import { create } from 'zustand'

interface AppState {
  cryptoIds: string[]
}

// CoinGecko ids of the tracked coins, every one with a Binance USDT pair for live prices
const DEFAULT_CRYPTO = [
  'bitcoin',
  'ethereum',
  'binancecoin',
  'ripple',
  'solana',
  'cardano',
  'avalanche-2',
  'chainlink',
  'polkadot',
  'litecoin',
  'cosmos',
  'near',
  'uniswap',
  'stellar',
  'monero',
]

export const useAppStore = create<AppState>(() => ({
  cryptoIds: DEFAULT_CRYPTO,
}))
