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
