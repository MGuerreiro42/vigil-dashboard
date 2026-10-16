import { create } from 'zustand'

interface AppState {
  cryptoIds: string[]
  earthquakeMinMag: number
  setCryptoIds: (ids: string[]) => void
  setEarthquakeMinMag: (mag: number) => void
}

const DEFAULT_CRYPTO = [
  'bitcoin',       // BTC  — reserva de valor, top 1
  'ethereum',      // ETH  — smart contracts, top 2
  'binancecoin',   // BNB  — exchange token, top 3
  'ripple',        // XRP  — pagamentos internacionais, top 4
  'solana',        // SOL  — L1 de alta performance
  'cardano',       // ADA  — L1 PoS estabelecida
  'avalanche-2',   // AVAX — L1 / subnets
  'chainlink',     // LINK — infraestrutura oracle
  'polkadot',      // DOT  — interoperabilidade
  'litecoin',      // LTC  — altcoin original
  'cosmos',        // ATOM — hub interchain
  'near',          // NEAR — L1 sharding
  'uniswap',       // UNI  — maior DEX
  'stellar',       // XLM  — rede de pagamentos
  'monero',        // XMR  — privacidade estabelecida
]

export const useAppStore = create<AppState>((set) => ({
  cryptoIds: DEFAULT_CRYPTO,
  earthquakeMinMag: 2.5,

  setCryptoIds: (ids) => set({ cryptoIds: ids }),
  setEarthquakeMinMag: (mag) => set({ earthquakeMinMag: mag }),
}))
