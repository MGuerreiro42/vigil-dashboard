import { useTranslation } from 'react-i18next'
import { WidgetShell } from '@/components/layout/widget-shell'
import { StatTile } from '@/components/ui/stat-tile'
import { USD_COMPACT } from '@/features/crypto/lib/crypto-format'
import { useBitcoinFees, useCryptoGlobal, useFearGreed } from '@/features/economy/api/crypto-pulse'
import { fearGreedColor } from '@/features/economy/lib/economy-style'
import { SeriesChart } from './series-chart'

const ACCENT = '#f7931a'

export function CryptoPulseWidget() {
  const { t } = useTranslation()
  const fearGreed = useFearGreed()
  const { data: global } = useCryptoGlobal()
  const { data: fees } = useBitcoinFees()
  const sentiment = fearGreed.data
  const color = sentiment ? fearGreedColor(sentiment.value) : ACCENT

  return (
    <WidgetShell
      title={t('economy.pulse.title')}
      icon={<span className="text-xl">🧭</span>}
      isLoading={fearGreed.isLoading}
      error={fearGreed.error}
      onRetry={() => fearGreed.refetch()}
      lastUpdated={fearGreed.dataUpdatedAt || undefined}
      accentColor={ACCENT}
      isFocused
      fillHeight
    >
      {sentiment && (
        <div className="flex flex-col gap-3 flex-1 min-h-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 2xl:grid-cols-4 gap-2">
            <StatTile label={t('economy.pulse.fearGreed')} value={sentiment.value} caption={sentiment.classification} color={color} />
            <StatTile label={t('economy.pulse.marketCap')} value={global ? USD_COMPACT.format(global.marketCapUsd) : '—'} caption={global && `${t('economy.pulse.volume')} ${USD_COMPACT.format(global.volume24hUsd)}`} valueClassName="text-base font-mono font-bold" />
            <StatTile label={t('economy.pulse.btcDominance')} value={global ? `${global.btcDominance.toFixed(1)}%` : '—'} valueClassName="text-base font-mono font-bold" valueColor={ACCENT} />
            <StatTile label={t('economy.pulse.fees')} value={fees ? fees.fastest : '—'} caption={fees && t('economy.pulse.feesCaption', { halfHour: fees.halfHour, hour: fees.hour })} valueClassName="text-base font-mono font-bold" />
          </div>
          <p className="text-[11px] uppercase tracking-widest text-fg-subtle">{t('economy.pulse.thirtyDays')}</p>
          <div className="flex-1 min-h-[140px]">
            <SeriesChart points={sentiment.history} color={color} label={t('economy.pulse.fearGreed')} format={(value) => value.toFixed(0)} />
          </div>
          <p className="text-[10px] text-fg-subtle">{t('economy.pulse.source')}</p>
        </div>
      )}
    </WidgetShell>
  )
}
