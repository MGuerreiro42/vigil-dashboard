import { useState, useEffect, useRef } from 'react'
import { useWebSocket } from '@/hooks/use-web-socket'
import type { BinanceOrderBook, BinanceOrderBookEntry, BinanceTrade, RawDepth, RawTrade } from '@/features/crypto/types'

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

const toBookEntry = ([price, qty]: [string, string]): BinanceOrderBookEntry => ({
  price: parseFloat(price),
  qty: parseFloat(qty),
})

export const WS_BASE = 'wss://stream.binance.com:9443'

/** Key of the mini-ticker stream in the source-health store */
export const BINANCE_STREAM = 'binance ws'

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
    const depth = raw as RawDepth
    if (!Array.isArray(depth?.bids) || !symbol) return
    setBook({
      symbol,
      data: {
        bids: depth.bids.map(toBookEntry),
        asks: depth.asks.map(toBookEntry),
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
  // Busy pairs send dozens of trades/s: buffer them and flush once per frame
  const bufferRef = useRef<BinanceTrade[]>([])
  const frameRef = useRef<number | null>(null)

  const symbol = coinId ? COINGECKO_TO_BINANCE[coinId] : null
  const url = symbol ? `${WS_BASE}/ws/${symbol}@trade` : null

  // Drop a pending batch when the symbol changes or the hook unmounts
  useEffect(() => () => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    frameRef.current = null
    bufferRef.current = []
  }, [symbol])

  useWebSocket(url, { onMessage: (raw) => {
    const trade = raw as RawTrade
    if (!trade?.t || !symbol) return
    const price = parseFloat(trade.p)
    const qty = parseFloat(trade.q)
    bufferRef.current.push({
      id: trade.t,
      price,
      qty,
      value: price * qty,
      buyerMaker: trade.m,
      timestamp: trade.T,
    })
    if (frameRef.current !== null) return
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null
      const batch = bufferRef.current.reverse()
      bufferRef.current = []
      setTrades((prev) => ({
        symbol,
        data: [...batch, ...(prev?.symbol === symbol ? prev.data : [])].slice(0, MAX_TRADES),
      }))
    })
  } })

  return trades?.symbol === symbol ? trades.data : EMPTY_TRADES
}
