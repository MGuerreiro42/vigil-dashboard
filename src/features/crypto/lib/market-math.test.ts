import { describe, expect, it } from 'vitest'
import type { BinanceTrade, CryptoAsset } from '@/features/crypto/types'
import { cumulativeLevels, depthBar, formatTradeUsd, formatUsdCompact, largestLevel, marketSummary, percentileCap, sortCoins, tradeFlow } from './market-math'

const coin = (symbol: string, rank: number, change24h: number, marketCap: number, volume24h = 1e9): CryptoAsset => ({
  id: symbol.toLowerCase(), symbol, name: symbol, price: 1, marketCap, volume24h, change24h, change7d: 0, sparkline: [], rank, imageUrl: '', source: 'coingecko',
})

const COINS = [coin('BTC', 1, -0.9, 1.64e12), coin('XMR', 13, 2.27, 1e10), coin('NEAR', 19, -6.3, 5e9)]

describe('coin list', () => {
  it('sorts by rank, change and cap', () => {
    expect(sortCoins(COINS, 'gainers').map((asset) => asset.symbol)).toEqual(['XMR', 'BTC', 'NEAR'])
    expect(sortCoins(COINS, 'losers').map((asset) => asset.symbol)).toEqual(['NEAR', 'BTC', 'XMR'])
    expect(sortCoins([...COINS].reverse(), 'rank')[0].symbol).toBe('BTC')
  })

  it('summarises the market', () => {
    expect(marketSummary(COINS)).toMatchObject({ count: 3, topGainer: { symbol: 'XMR' }, topLoser: { symbol: 'NEAR' }, volume24h: 3e9, rising: 1 })
  })
})

it('formats dollar amounts as in the design', () => {
  expect([1.64e12, 9.6e10, 7.36e8].map((value) => formatUsdCompact(value))).toEqual(['$1.64T', '$96.0B', '$736M'])
  expect(formatUsdCompact(2.94e12, 1)).toBe('$2.9T')
  expect([1234, 34.52].map(formatTradeUsd)).toEqual(['$1.2K', '$34.5'])
})

it('weights the buy share by quantity over the last minute', () => {
  const trade = (qty: number, buyerMaker: boolean, timestamp: number): BinanceTrade => ({ id: timestamp, price: 1, qty, value: qty, buyerMaker, timestamp })
  const now = 100_000
  expect(tradeFlow([trade(3, false, now), trade(1, true, now - 1_000), trade(50, true, now - 61_000)], now)).toEqual({ count: 2, buyShare: 0.75 })
  expect(tradeFlow([], now).buyShare).toBe(0.5)
})

describe('order book', () => {
  const bids = cumulativeLevels([{ price: 10, qty: 12.4 }, { price: 9, qty: 1 }, { price: 8, qty: 1 }], 10)
  const asks = cumulativeLevels([{ price: 11, qty: 0.5 }, { price: 12, qty: 0.5 }], 10)

  it('accumulates quantity level by level', () => {
    expect(bids.map((level) => level.cumulative)).toEqual([12.4, 13.4, 14.4])
  })

  it('caps the bars at the 95th percentile of cumulative quantity', () => {
    const cumulative = Array.from({ length: 20 }, (_, index) => ({ price: index, qty: 1, cumulative: index + 1 }))
    expect(percentileCap(cumulative)).toBe(19)
    expect(percentileCap([])).toBe(1)
  })

  it('clips bars above the cap', () => {
    expect(depthBar(12, 6)).toEqual({ bar: '█'.repeat(24), clipped: true })
    expect(depthBar(3, 6)).toEqual({ bar: '█'.repeat(12), clipped: false })
    expect(depthBar(0.01, 6).bar).toBe('█')
  })

  it('finds the wall on either side', () => {
    expect(largestLevel(bids, asks)).toEqual({ side: 'bid', index: 0, qty: 12.4 })
  })
})
