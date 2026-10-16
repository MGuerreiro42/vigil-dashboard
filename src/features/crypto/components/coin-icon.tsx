import type { CryptoAsset } from '@/features/crypto/types'

/** Coin logo, or its symbol initials when the data source has no logo (Binance fallback). */
export function CoinIcon({ coin, size }: { coin: CryptoAsset; size: number }) {
  if (coin.imageUrl) return <img src={coin.imageUrl} alt="" className="rounded-full flex-shrink-0" style={{ width: size, height: size }} />
  return (
    <span
      aria-hidden
      className="rounded-full flex-shrink-0 flex items-center justify-center bg-white/[0.08] text-white/70 font-semibold"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {coin.symbol.slice(0, 3)}
    </span>
  )
}
