import { useBinanceTickerStore } from '@/features/crypto/store/ticker-store'
import { BINANCE_STREAM, COINGECKO_TO_BINANCE, WS_BASE } from '@/features/crypto/api/binance'
import { useWebSocket } from '@/hooks/use-web-socket'
import { useSourceHealthStore } from '@/store/source-health-store'
import type { RawMiniTicker } from '@/features/crypto/types'

interface Props {
  /** CoinGecko IDs to subscribe to — drives the stream URL */
  coinIds: string[]
}

/**
 * Invisible component mounted by each page that shows live prices.
 * Manages a SINGLE Binance mini-ticker WebSocket for all coins and
 * writes to the global useBinanceTickerStore.
 *
 * This prevents duplicate WS connections when multiple widgets
 * (LiveTickerBar + CryptoWidget) need the same live prices.
 */
export function BinanceTickerSync({ coinIds }: Props) {
  const setTicker    = useBinanceTickerStore((state) => state.setTicker)
  const setConnected = useBinanceTickerStore((state) => state.setConnected)
  const setStream = useSourceHealthStore((state) => state.setStream)

  const symbols = coinIds.map((id) => COINGECKO_TO_BINANCE[id]).filter(Boolean)
  const url = symbols.length > 0
    ? `${WS_BASE}/stream?streams=${symbols.map((symbol) => `${symbol}@miniTicker`).join('/')}`
    : null

  useWebSocket(url, {
    onOpen: () => setConnected(symbols.length),
    onClose: () => setConnected(0),
    onStatus: ({ state, attempt, nextRetryAt }) => {
      const now = Date.now()
      const previous = useSourceHealthStore.getState().streams[BINANCE_STREAM]
      if (state === 'live') {
        const lostAt = previous?.lostAt ?? null
        setStream(BINANCE_STREAM, { state, attempt, nextRetryAt, lostAt: null, recoveredAfterMs: lostAt ? now - lostAt : null, recoveredAt: lostAt ? now : null })
      } else {
        setStream(BINANCE_STREAM, { state, attempt, nextRetryAt, lostAt: state === 'connecting' ? null : previous?.lostAt ?? now })
      }
    },
    onMessage: (raw) => {
      const ticker = (raw as { data?: RawMiniTicker })?.data
      if (!ticker?.s) return
      setTicker(ticker.s.toLowerCase(), {
        symbol:      ticker.s,
        price:       parseFloat(ticker.c),
        open:        parseFloat(ticker.o),
        high:        parseFloat(ticker.h),
        low:         parseFloat(ticker.l),
        volume:      parseFloat(ticker.v),
        quoteVolume: parseFloat(ticker.q),
        updatedAt:   Date.now(),
      })
    },
  })

  return null
}
