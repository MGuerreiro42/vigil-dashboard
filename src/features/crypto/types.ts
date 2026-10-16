export interface CryptoAsset {
  id: string
  symbol: string
  name: string
  price: number
  marketCap: number
  volume24h: number
  change24h: number
  change7d: number
  sparkline: number[]
  rank: number
  imageUrl: string
}

export interface ExchangeRates {
  base: string
  date: string
  rates: Record<string, number>
  updatedAt: number
}

export type BinanceTicker = {
  symbol: string      // e.g. 'BTCUSDT'
  price: number       // last price
  open: number        // 24h open
  high: number        // 24h high
  low: number         // 24h low
  volume: number      // base asset volume
  quoteVolume: number // quote asset volume (USD)
  updatedAt: number   // local timestamp
}

export type BinanceOrderBookEntry = {
  price: number
  qty: number
}

export type BinanceOrderBook = {
  bids: BinanceOrderBookEntry[] // sorted price desc
  asks: BinanceOrderBookEntry[] // sorted price asc
  updatedAt: number
}

export type BinanceTrade = {
  id: number
  price: number
  qty: number
  value: number     // price * qty
  buyerMaker: boolean // true = sell-initiated (red), false = buy-initiated (green)
  timestamp: number
}

// Raw stream payloads: single-letter keys are Binance's wire format
export type RawMiniTicker = { s: string; c: string; o: string; h: string; l: string; v: string; q: string }
export type RawDepth = { bids: [string, string][]; asks: [string, string][] }
export type RawTrade = { t: number; p: string; q: string; m: boolean; T: number }
