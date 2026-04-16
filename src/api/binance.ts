import { useState, useEffect, useRef } from 'react'
import type { BinanceTicker, BinanceOrderBook, BinanceTrade } from './types/binance'

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
  const wsRef = useRef<WebSocket | null>(null)
  const shouldReconnect = useRef(false)
  const cbRef = useRef(onMessage)
  cbRef.current = onMessage

  useEffect(() => {
    if (!url) return
    shouldReconnect.current = true

    function connect() {
      if (!shouldReconnect.current) return
      const ws = new WebSocket(url as string)
      wsRef.current = ws

      ws.onmessage = (ev) => {
        try { cbRef.current(JSON.parse(ev.data as string)) } catch { /* ignore */ }
      }
      ws.onerror = () => ws.close()
      ws.onclose = () => {
        wsRef.current = null
        if (shouldReconnect.current) setTimeout(connect, 3_000)
      }
    }

    connect()

    return () => {
      shouldReconnect.current = false
      wsRef.current?.close()
      wsRef.current = null
    }
  }, [url])
}

// ─── Multi-symbol mini tickers ────────────────────────────────────────────

/**
 * Subscribes to Binance miniTicker stream for all provided CoinGecko IDs.
 * Returns a map keyed by Binance symbol (lowercase, e.g. 'btcusdt').
 * Updates continuously as prices change.
 */
export function useBinanceTickers(coinIds: string[]): Record<string, BinanceTicker> {
  const [tickers, setTickers] = useState<Record<string, BinanceTicker>>({})

  const symbols = coinIds.map((id) => COINGECKO_TO_BINANCE[id]).filter(Boolean)
  const streams = symbols.map((s) => `${s}@miniTicker`).join('/')
  const url = symbols.length > 0 ? `${WS_BASE}/stream?streams=${streams}` : null

  useWS(url, (raw) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const d = (raw as any)?.data
    if (!d?.s) return
    setTickers((prev) => ({
      ...prev,
      [d.s.toLowerCase()]: {
        symbol: d.s,
        price: parseFloat(d.c),
        open: parseFloat(d.o),
        high: parseFloat(d.h),
        low: parseFloat(d.l),
        volume: parseFloat(d.v),
        quoteVolume: parseFloat(d.q),
        updatedAt: Date.now(),
      },
    }))
  })

  return tickers
}

// ─── Order book depth ─────────────────────────────────────────────────────

/**
 * Subscribes to Binance depth20 stream for the given CoinGecko ID.
 * Returns the current best 20 bid/ask levels, updated every ~1 second.
 * Passes null to disconnect.
 */
export function useBinanceOrderBook(coinId: string | null): BinanceOrderBook | null {
  const [book, setBook] = useState<BinanceOrderBook | null>(null)

  const symbol = coinId ? COINGECKO_TO_BINANCE[coinId] : null
  const url = symbol ? `${WS_BASE}/ws/${symbol}@depth20` : null

  useWS(url, (raw) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const d = raw as any
    if (!Array.isArray(d?.bids)) return
    setBook({
      bids: d.bids.map(([p, q]: string[]) => ({ price: parseFloat(p), qty: parseFloat(q) })),
      asks: d.asks.map(([p, q]: string[]) => ({ price: parseFloat(p), qty: parseFloat(q) })),
      updatedAt: Date.now(),
    })
  })

  // Reset local state when symbol changes
  useEffect(() => { setBook(null) }, [coinId])

  return book
}

// ─── Aggregated trade stream ──────────────────────────────────────────────

const MAX_TRADES = 60

/**
 * Subscribes to Binance trade stream for the given CoinGecko ID.
 * Returns the last MAX_TRADES trades in reverse-chronological order.
 * Passes null to disconnect.
 */
export function useBinanceTrades(coinId: string | null): BinanceTrade[] {
  const [trades, setTrades] = useState<BinanceTrade[]>([])

  const symbol = coinId ? COINGECKO_TO_BINANCE[coinId] : null
  const url = symbol ? `${WS_BASE}/ws/${symbol}@trade` : null

  useWS(url, (raw) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const t = raw as any
    if (!t?.t) return
    const price = parseFloat(t.p)
    const qty = parseFloat(t.q)
    setTrades((prev) => [
      {
        id: t.t,
        price,
        qty,
        value: price * qty,
        buyerMaker: t.m,
        timestamp: t.T,
      },
      ...prev.slice(0, MAX_TRADES - 1),
    ])
  })

  useEffect(() => { setTrades([]) }, [coinId])

  return trades
}
