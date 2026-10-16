import { useTranslation } from 'react-i18next'
import { WidgetShell } from '@/components/layout/widget-shell'
import { StatTile } from '@/components/ui/stat-tile'
import { intlLocale } from '@/i18n'
import { useBcbSeries } from '@/features/economy/api/bcb'
import { SeriesChart } from './series-chart'

const COLOR = '#facc15'
const percent = (value: number) => `${value.toLocaleString(intlLocale(), { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
const monthLabel = (date: string) => new Date(`${date}T00:00:00Z`).toLocaleDateString(intlLocale(), { month: 'short', year: 'numeric', timeZone: 'UTC' })

export function BrazilMacroWidget() {
  const { t } = useTranslation()
  const selic = useBcbSeries('selic')
  const ipca12m = useBcbSeries('ipca12m')
  const ipcaMonthly = useBcbSeries('ipcaMonthly')
  const selicNow = selic.data?.at(-1)
  const ipcaNow = ipca12m.data?.at(-1)
  const monthNow = ipcaMonthly.data?.at(-1)
  // Fisher equation: real rate from the nominal Selic and trailing 12-month inflation
  const realRate = selicNow && ipcaNow ? ((1 + selicNow.value / 100) / (1 + ipcaNow.value / 100) - 1) * 100 : null

  return (
    <WidgetShell
      title={t('economy.brazil.title')}
      icon={<span className="text-xl">🇧🇷</span>}
      isLoading={selic.isLoading || ipca12m.isLoading}
      error={selic.error ?? ipca12m.error}
      onRetry={() => { selic.refetch(); ipca12m.refetch(); ipcaMonthly.refetch() }}
      lastUpdated={selic.dataUpdatedAt || undefined}
      accentColor={COLOR}
      isFocused
      fillHeight
    >
      {selicNow && ipcaNow && (
        <div className="flex flex-col gap-3 flex-1 min-h-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 2xl:grid-cols-4 gap-2">
            <StatTile label={t('economy.brazil.selic')} value={percent(selicNow.value)} caption={t('economy.brazil.perYear')} color={COLOR} />
            <StatTile label={t('economy.brazil.ipca12m')} value={percent(ipcaNow.value)} caption={monthLabel(ipcaNow.date)} />
            <StatTile label={t('economy.brazil.ipcaMonth')} value={monthNow ? percent(monthNow.value) : '—'} caption={monthNow && monthLabel(monthNow.date)} />
            <StatTile label={t('economy.brazil.realRate')} value={realRate === null ? '—' : percent(realRate)} caption={t('economy.brazil.realRateCaption')} valueColor="#34d399" />
          </div>
          <p className="text-[11px] uppercase tracking-widest text-fg-subtle">{t('economy.brazil.ipcaTrend')}</p>
          <div className="flex-1 min-h-[140px]">
            <SeriesChart points={ipca12m.data ?? []} color={COLOR} label={t('economy.brazil.ipca12m')} format={percent} />
          </div>
          <p className="text-[10px] text-fg-subtle">{t('economy.brazil.source')}</p>
        </div>
      )}
    </WidgetShell>
  )
}
