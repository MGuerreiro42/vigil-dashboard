import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { WidgetShell } from '@/components/layout/widget-shell'
import { StatTile } from '@/components/ui/stat-tile'
import { intlLocale } from '@/i18n'
import { FX_CURRENCIES, useFxHistory, useFxLatest, type FxCurrency } from '@/features/economy/api/frankfurter'
import { ACCENT } from '@/features/economy/lib/economy-style'
import { SeriesChart } from './series-chart'

const formatRate = (value: number) => value.toLocaleString(intlLocale(), { maximumFractionDigits: value >= 100 ? 2 : 4 })

export function CurrencyWidget() {
  const { t } = useTranslation()
  const [currency, setCurrency] = useState<FxCurrency>('BRL')
  const { data: latest, isLoading, error, refetch, dataUpdatedAt } = useFxLatest()
  const { data: history } = useFxHistory(currency)
  const first = history?.[0]?.value
  const change = first && latest ? ((latest.rates[currency] - first) / first) * 100 : null

  return (
    <WidgetShell
      title={t('economy.fx.title')}
      icon={<span className="text-xl">💱</span>}
      isLoading={isLoading}
      error={error}
      onRetry={() => refetch()}
      lastUpdated={dataUpdatedAt || undefined}
      accentColor={ACCENT}
      isFocused
      fillHeight
    >
      {latest && (
        <div className="flex flex-col gap-3 flex-1 min-h-0">
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-3 2xl:grid-cols-5 gap-2">
            {FX_CURRENCIES.map((code) => (
              <button key={code} type="button" onClick={() => setCurrency(code)} aria-pressed={code === currency} className="text-left rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400">
                <StatTile label={`USD/${code}`} value={formatRate(latest.rates[code])} valueClassName="text-base font-mono font-bold" color={code === currency ? ACCENT : undefined} className="w-full" />
              </button>
            ))}
          </div>
          <div className="flex items-baseline justify-between text-[11px] text-fg-subtle">
            <span className="uppercase tracking-widest">{t('economy.fx.history', { currency })}</span>
            {change !== null && (
              <span className={change >= 0 ? 'text-emerald-300' : 'text-rose-300'}>{change >= 0 ? '+' : ''}{change.toFixed(2)}%</span>
            )}
          </div>
          <div className="flex-1 min-h-[140px]">
            {history && <SeriesChart points={history} color={ACCENT} label={`USD/${currency}`} format={formatRate} />}
          </div>
          <p className="text-[10px] text-fg-subtle">{t('economy.fx.source', { date: latest.date })}</p>
        </div>
      )}
    </WidgetShell>
  )
}
