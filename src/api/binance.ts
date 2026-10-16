import { useState, useEffect, useRef } from 'react'
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

const WS_BASE = 'wss://stream.binance.com:9443'

// ─── Internal utility ─────────────────────────────────────────────────────

/**
 * Low-level hook that manages a single WebSocket connection with
 * auto-reconnect on close/error. Uses a ref for the callback so the
 * connection is only recreated when `url` changes.
 */
function useWS(url: string | null, onMessage: (data: unknown) => void) {
  const cbRef = useRef(onMessage)
  useEffect(() => { cbRef.current = onMessage })

  useEffect(() => {
    if (!url) return
    // Per-connection state: a closing socket from a previous url can't reconnect or touch the new one
    let active = true
    let socket: WebSocket | null = null
    let retry: ReturnType<typeof setTimeout> | undefined

    function connect() {
      const ws = new WebSocket(url as string)
      socket = ws
      ws.onmessage = (ev) => {
        try { cbRef.current(JSON.parse(ev.data as string)) } catch { /* ignore */ }
      }
      ws.onerror = () => ws.close()
      ws.onclose = () => {
        if (active) retry = setTimeout(connect, 3_000)
      }
    }

    connect()

    return () => {
      active = false
      clearTimeout(retry)
      socket?.close()
    }
  }, [url])
}

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

  useWS(url, (raw) => {
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
  })

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

  useWS(url, (raw) => {
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
  })

  return trades?.symbol === symbol ? trades.data : EMPTY_TRADES
}
