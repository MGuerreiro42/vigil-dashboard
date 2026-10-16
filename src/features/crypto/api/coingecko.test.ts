import { expect, it } from 'vitest'
import { binanceTickersToAssets } from './coingecko'

it('builds market rows from Binance tickers in the requested order, skipping unlisted coins', () => {
  const assets = binanceTickersToAssets(['bitcoin', 'avalanche-2', 'unlisted-coin'], [
    { symbol: 'AVAXUSDT', lastPrice: '9.95', priceChangePercent: '-0.64', quoteVolume: '1000' },
    { symbol: 'BTCUSDT', lastPrice: '81743.19', priceChangePercent: '-0.680', quoteVolume: '1244968843.8' },
  ])
  expect(assets.map((asset) => [asset.id, asset.symbol, asset.name, asset.rank])).toEqual([
    ['bitcoin', 'BTC', 'Bitcoin', 1],
    ['avalanche-2', 'AVAX', 'Avalanche', 2],
  ])
  expect(assets[0]).toMatchObject({ price: 81743.19, change24h: -0.68, volume24h: 1244968843.8, imageUrl: '', source: 'binance' })
})
