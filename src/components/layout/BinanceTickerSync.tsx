import { useBinanceTickerStore } from '@/store/binance.store'
import { COINGECKO_TO_BINANCE, WS_BASE } from '@/api/binance'
import { useWebSocket } from '@/hooks/useWebSocket'
import type { RawMiniTicker } from '@/api/types/binance'

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

  const symbols = coinIds.map((id) => COINGECKO_TO_BINANCE[id]).filter(Boolean)
  const url = symbols.length > 0
    ? `${WS_BASE}/stream?streams=${symbols.map((symbol) => `${symbol}@miniTicker`).join('/')}`
    : null

  useWebSocket(url, {
    onOpen: () => setConnected(symbols.length),
    onClose: () => setConnected(0),
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
