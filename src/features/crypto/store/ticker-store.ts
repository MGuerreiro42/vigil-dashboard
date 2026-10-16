import { create } from 'zustand'
import type { BinanceTicker } from '@/features/crypto/types'

interface BinanceTickerStore {
  tickers: Record<string, BinanceTicker>
  connectedCount: number
  setTicker: (sym: string, t: BinanceTicker) => void
  setConnected: (n: number) => void
}

/**
 * Global singleton store for Binance ticker data.
 * A single BinanceTickerSync component manages the WS connection and writes here.
 * All widgets subscribe with per-symbol selectors, so only the relevant
 * component re-renders when a specific coin's price changes.
 */
export const useBinanceTickerStore = create<BinanceTickerStore>((set) => ({
  tickers: {},
  connectedCount: 0,
  setTicker: (sym, t) =>
    set((state) => ({ tickers: { ...state.tickers, [sym]: t } })),
  setConnected: (n) => set({ connectedCount: n }),
}))
