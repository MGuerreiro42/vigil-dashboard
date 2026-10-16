import { COINGECKO_TO_BINANCE } from '@/features/crypto/api/binance'
import { useBinanceTickerStore } from '@/features/crypto/store/ticker-store'
import { usePriceFlash, flashColor } from '@/features/crypto/hooks/use-price-flash'
import type { CryptoAsset } from '@/features/crypto/types'
import { formatPrice } from '@/features/crypto/lib/crypto-format'

export function LivePrice({
  coin,
  className = '',
  idleColor,
}: {
  coin: CryptoAsset
  className?: string
  idleColor?: string
}) {
  const symbol = COINGECKO_TO_BINANCE[coin.id]
  const livePrice = useBinanceTickerStore((state) => (symbol ? state.tickers[symbol]?.price : undefined))
  const flash = usePriceFlash(livePrice)

  return (
    <span
      className={`font-mono transition-colors duration-300 ${className}`}
      style={{ color: flashColor(flash, idleColor) }}
    >
      {formatPrice(livePrice ?? coin.price)}
    </span>
  )
}

/** Depth chart built from order book bids / asks. */
