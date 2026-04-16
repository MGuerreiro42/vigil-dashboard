import { useEffect, useRef } from 'react'
import { useBinanceTickerStore } from '@/store/binance.store'
import { COINGECKO_TO_BINANCE } from '@/api/binance'

const WS_BASE = 'wss://stream.binance.com:9443'

interface Props {
  /** CoinGecko IDs to subscribe to — drives the stream URL */
  coinIds: string[]
}

/**
 * Invisible component mounted once at the Dashboard level.
 * Manages a SINGLE Binance mini-ticker WebSocket for all coins and
 * writes to the global useBinanceTickerStore.
 *
 * This prevents duplicate WS connections when multiple widgets
 * (LiveTickerBar + CryptoWidget) need the same live prices.
 */
export function BinanceTickerSync({ coinIds }: Props) {
  const setTicker    = useBinanceTickerStore((s) => s.setTicker)
  const setConnected = useBinanceTickerStore((s) => s.setConnected)

  const shouldReconnect = useRef(false)
  const wsRef           = useRef<WebSocket | null>(null)

  useEffect(() => {
    const symbols = coinIds.map((id) => COINGECKO_TO_BINANCE[id]).filter(Boolean)
    if (symbols.length === 0) return

    const streams = symbols.map((s) => `${s}@miniTicker`).join('/')
    const url = `${WS_BASE}/stream?streams=${streams}`

    shouldReconnect.current = true

    function connect() {
      if (!shouldReconnect.current) return
      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => setConnected(symbols.length)

      ws.onmessage = (ev) => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const d = (JSON.parse(ev.data as string) as any)?.data
          if (!d?.s) return
          setTicker(d.s.toLowerCase(), {
            symbol:      d.s,
            price:       parseFloat(d.c),
            open:        parseFloat(d.o),
            high:        parseFloat(d.h),
            low:         parseFloat(d.l),
            volume:      parseFloat(d.v),
            quoteVolume: parseFloat(d.q),
            updatedAt:   Date.now(),
          })
        } catch { /* ignore malformed frames */ }
      }

      ws.onerror = () => ws.close()
      ws.onclose = () => {
        wsRef.current = null
        setConnected(0)
        if (shouldReconnect.current) setTimeout(connect, 3_000)
      }
    }

    connect()

    return () => {
      shouldReconnect.current = false
      wsRef.current?.close()
      wsRef.current = null
      setConnected(0)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coinIds.join(',')])

  return null
}
