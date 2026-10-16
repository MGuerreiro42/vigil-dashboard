import { useState } from 'react'
import { useWebSocket } from '@/hooks/useWebSocket'
import type { BinanceOrderBook, BinanceTrade } from './types/binance'

/** Maps CoinGecko IDs → Binance USDT pair (lowercase) */
export const COINGECKO_TO_BINANCE: Record<string, string> = {
  bitcoin: 'btcusdt',
  ethereum: 'ethusdt',
  binancecoin: 'bnbusdt',
  ripple: 'xrpusdt',
  solana: 'solusdt',
  cardano: 'adausdt',
  'avalanche-2': 'avaxusdt',
  chainlink: 'linkusdt',
  polkadot: 'dotusdt',
  litecoin: 'ltcusdt',
  cosmos: 'atomusdt',
  near: 'nearusdt',
  uniswap: 'uniusdt',
  stellar: 'xlmusdt',
  monero: 'xmrusdt',
}

export const WS_BASE = 'wss://stream.binance.com:9443'

// ─── Order book depth ─────────────────────────────────────────────────────

/**
 * Subscribes to Binance depth20 stream for the given CoinGecko ID.
 * Returns the current best 20 bid/ask levels, updated every ~1 second.
 * Passes null to disconnect.
 */
export function useBinanceOrderBook(coinId: string | null): BinanceOrderBook | null {
  const [book, setBook] = useState<{ symbol: string; data: BinanceOrderBook } | null>(null)

  const symbol = coinId ? COINGECKO_TO_BINANCE[coinId] : null
  const url = symbol ? `${WS_BASE}/ws/${symbol}@depth20` : null

  useWebSocket(url, { onMessage: (raw) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const d = raw as any
    if (!Array.isArray(d?.bids)) return
    if (!symbol) return
    setBook({
      symbol,
      data: {
        bids: d.bids.map(([p, q]: string[]) => ({ price: parseFloat(p), qty: parseFloat(q) })),
        asks: d.asks.map(([p, q]: string[]) => ({ price: parseFloat(p), qty: parseFloat(q) })),
        updatedAt: Date.now(),
      },
    })
  } })

  // State from a previous symbol reads as empty, so switching coins needs no reset
  return book?.symbol === symbol ? book.data : null
}

// ─── Aggregated trade stream ──────────────────────────────────────────────

const MAX_TRADES = 60
const EMPTY_TRADES: BinanceTrade[] = []

/**
 * Subscribes to Binance trade stream for the given CoinGecko ID.
 * Returns the last MAX_TRADES trades in reverse-chronological order.
 * Passes null to disconnect.
 */
export function useBinanceTrades(coinId: string | null): BinanceTrade[] {
  const [trades, setTrades] = useState<{ symbol: string; data: BinanceTrade[] } | null>(null)

  const symbol = coinId ? COINGECKO_TO_BINANCE[coinId] : null
  const url = symbol ? `${WS_BASE}/ws/${symbol}@trade` : null

  useWebSocket(url, { onMessage: (raw) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const t = raw as any
    if (!t?.t) return
    const price = parseFloat(t.p)
    const qty = parseFloat(t.q)
    if (!symbol) return
    const trade: BinanceTrade = {
      id: t.t,
      price,
      qty,
      value: price * qty,
      buyerMaker: t.m,
      timestamp: t.T,
    }
    setTrades((prev) => ({
      symbol,
      data: [trade, ...(prev?.symbol === symbol ? prev.data.slice(0, MAX_TRADES - 1) : [])],
    }))
  } })

  return trades?.symbol === symbol ? trades.data : EMPTY_TRADES
}
