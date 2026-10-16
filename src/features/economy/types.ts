export interface SeriesPoint {
  /** ISO date (yyyy-mm-dd) */
  date: string
  value: number
}

export interface FxSnapshot {
  base: string
  date: string
  rates: Record<string, number>
}

export interface FearGreed {
  value: number
  classification: string
  history: SeriesPoint[]
}

export interface CryptoGlobal {
  marketCapUsd: number
  volume24hUsd: number
  btcDominance: number
}

export interface BitcoinFees {
  fastest: number
  halfHour: number
  hour: number
}
