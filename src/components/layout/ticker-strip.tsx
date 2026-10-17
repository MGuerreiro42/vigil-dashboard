import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { useCryptoMarket } from '@/features/crypto/api/coingecko'
import { BINANCE_STREAM, COINGECKO_TO_BINANCE } from '@/features/crypto/api/binance'
import { useBinanceTickerStore } from '@/features/crypto/store/ticker-store'
import type { CryptoAsset } from '@/features/crypto/types'
import { ToneText } from '@/components/terminal/text'
import { changeTone, formatPrice, formatSigned } from '@/lib/terminal-format'
import { useAppStore } from '@/store/app-store'
import { useSourceHealthStore } from '@/store/source-health-store'

const TICKER_SIZE = 10

const TickerItem = memo(function TickerItem({ coin }: { coin: CryptoAsset }) {
  const symbol = COINGECKO_TO_BINANCE[coin.id]
  const ticker = useBinanceTickerStore((state) => (symbol ? state.tickers[symbol] : undefined))
  const price = ticker?.price ?? coin.price
  const change = ticker ? ((ticker.price - ticker.open) / ticker.open) * 100 : coin.change24h
  return (
    <span>
      {coin.symbol.toUpperCase()} {formatPrice(price)} <ToneText tone={changeTone(change)}>{formatSigned(change)}</ToneText>
    </span>
  )
})

/** Static strip of the top coins; overflow is clipped at the right edge, no marquee. */
export function TickerStrip() {
  const { t } = useTranslation()
  const cryptoIds = useAppStore((state) => state.cryptoIds)
  const { data: coins } = useCryptoMarket(cryptoIds)
  const streamState = useSourceHealthStore((state) => state.streams[BINANCE_STREAM]?.state)
  const live = streamState !== 'reconnecting' && streamState !== 'error'

  return (
    <div className="flex gap-[28px] overflow-hidden whitespace-nowrap border-b border-line px-[20px] py-[7px]">
      <ToneText tone={live ? 'ok' : 'info'}>{t(live ? 'terminal.live' : 'terminal.reconnecting')}</ToneText>
      {[...(coins ?? [])].sort((first, second) => first.rank - second.rank).slice(0, TICKER_SIZE).map((coin) => <TickerItem key={coin.id} coin={coin} />)}
    </div>
  )
}
