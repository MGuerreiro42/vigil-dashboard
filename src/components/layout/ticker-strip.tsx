import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { useCryptoMarket } from '@/features/crypto/api/coingecko'
import { BINANCE_STREAM } from '@/features/crypto/api/binance'
import { useLiveQuote } from '@/features/crypto/hooks/use-live-quote'
import type { CryptoAsset } from '@/features/crypto/types'
import { ToneText } from '@/components/terminal/text'
import { changeTone, formatPrice, formatSigned } from '@/lib/terminal-format'
import { useAppStore } from '@/store/app-store'
import { useSourceHealthStore } from '@/store/source-health-store'

const TICKER_SIZE = 10

const TickerItem = memo(function TickerItem({ coin }: { coin: CryptoAsset }) {
  const { price, change } = useLiveQuote(coin)
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
  const label = streamState === 'error' ? 'offline' : streamState === 'reconnecting' ? 'reconnecting' : 'live'
  const tone = label === 'offline' ? 'err' : label === 'reconnecting' ? 'info' : 'ok'

  return (
    <div className="flex gap-[28px] overflow-hidden whitespace-nowrap border-b border-line px-[20px] py-[7px]">
      <ToneText tone={tone}>{t(`terminal.${label}`)}</ToneText>
      {[...(coins ?? [])].sort((first, second) => first.rank - second.rank).slice(0, TICKER_SIZE).map((coin) => <TickerItem key={coin.id} coin={coin} />)}
    </div>
  )
}
