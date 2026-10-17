import { COINGECKO_TO_BINANCE } from '@/features/crypto/api/binance'
import { useBinanceTickerStore } from '@/features/crypto/store/ticker-store'
import type { CryptoAsset } from '@/features/crypto/types'

/** Price and 24h change from the Binance stream when it has the coin, else from the REST snapshot. */
export function useLiveQuote(coin: CryptoAsset): { price: number; change: number } {
  const symbol = COINGECKO_TO_BINANCE[coin.id]
  const ticker = useBinanceTickerStore((state) => (symbol ? state.tickers[symbol] : undefined))
  if (!ticker) return { price: coin.price, change: coin.change24h }
  return { price: ticker.price, change: ((ticker.price - ticker.open) / ticker.open) * 100 }
}
