import type { BinanceOrderBookEntry, BinanceTrade, CryptoAsset } from '@/features/crypto/types'

export type CoinSort = 'rank' | 'gainers' | 'losers' | 'cap'

const SORTERS: Record<CoinSort, (first: CryptoAsset, second: CryptoAsset) => number> = {
  rank: (first, second) => first.rank - second.rank,
  gainers: (first, second) => second.change24h - first.change24h,
  losers: (first, second) => first.change24h - second.change24h,
  cap: (first, second) => second.marketCap - first.marketCap,
}

export function sortCoins(coins: CryptoAsset[], sort: CoinSort): CryptoAsset[] {
  return [...coins].sort(SORTERS[sort])
}

export function marketSummary(coins: CryptoAsset[]) {
  const byChange = sortCoins(coins, 'gainers')
  return {
    count: coins.length,
    topGainer: byChange[0],
    topLoser: byChange[byChange.length - 1],
    volume24h: coins.reduce((total, coin) => total + coin.volume24h, 0),
    rising: coins.filter((coin) => coin.change24h > 0).length,
  }
}

/** $1.64T · $96.0B · $736M; the pulse panel shows trillions with one decimal. */
export function formatUsdCompact(value: number, trillionDigits = 2): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(trillionDigits)}T`
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`
  return `$${(value / 1e6).toFixed(0)}M`
}

/** Trade notional: $1.2K above a thousand, $34.5 below. */
export function formatTradeUsd(value: number): string {
  return value >= 1000 ? `$${(value / 1000).toFixed(1)}K` : `$${value.toFixed(1)}`
}

const FLOW_WINDOW_MS = 60_000

/** Quantity-weighted share of buyer-initiated trades in the last minute. */
export function tradeFlow(trades: BinanceTrade[], now: number) {
  const recent = trades.filter((trade) => now - trade.timestamp <= FLOW_WINDOW_MS)
  const total = recent.reduce((sum, trade) => sum + trade.qty, 0)
  const bought = recent.filter((trade) => !trade.buyerMaker).reduce((sum, trade) => sum + trade.qty, 0)
  return { count: recent.length, buyShare: total > 0 ? bought / total : 0.5 }
}

export interface BookLevel extends BinanceOrderBookEntry {
  cumulative: number
}

export function cumulativeLevels(entries: BinanceOrderBookEntry[], depth: number): BookLevel[] {
  let cumulative = 0
  return entries.slice(0, depth).map((entry) => ({ ...entry, cumulative: (cumulative += entry.qty) }))
}

/** Bar cap: 95th percentile (nearest rank) of the cumulative quantities, so one wall cannot flatten the rest. */
export function percentileCap(levels: BookLevel[], percentile = 0.95): number {
  const sorted = levels.map((level) => level.cumulative).sort((first, second) => first - second)
  if (!sorted.length) return 1
  return sorted[Math.max(0, Math.ceil(percentile * sorted.length) - 1)] || 1
}

const BOOK_BAR_WIDTH = 24

export function depthBar(cumulative: number, cap: number) {
  return { bar: '█'.repeat(Math.max(1, Math.round((Math.min(cumulative, cap) / cap) * BOOK_BAR_WIDTH))), clipped: cumulative > cap }
}

/** Largest single level on either side: the "wall" the depth note names. */
export function largestLevel(bids: BookLevel[], asks: BookLevel[]) {
  const sides = [...bids.map((level, index) => ({ side: 'bid' as const, index, qty: level.qty })), ...asks.map((level, index) => ({ side: 'ask' as const, index, qty: level.qty }))]
  return sides.reduce<(typeof sides)[number] | null>((largest, level) => (!largest || level.qty > largest.qty ? level : largest), null)
}
