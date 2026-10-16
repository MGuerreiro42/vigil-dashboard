import { useBinanceTickerStore } from '@/store/binance.store'
import { COINGECKO_TO_BINANCE, WS_BASE } from '@/api/binance'
import { useWebSocket } from '@/hooks/useWebSocket'

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
  const setTicker    = useBinanceTickerStore((s) => s.setTicker)
  const setConnected = useBinanceTickerStore((s) => s.setConnected)

  const symbols = coinIds.map((id) => COINGECKO_TO_BINANCE[id]).filter(Boolean)
  const url = symbols.length > 0
    ? `${WS_BASE}/stream?streams=${symbols.map((s) => `${s}@miniTicker`).join('/')}`
    : null

  useWebSocket(url, {
    onOpen: () => setConnected(symbols.length),
    onClose: () => setConnected(0),
    onMessage: (raw) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const d = (raw as any)?.data
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
    },
  })

  return null
}
