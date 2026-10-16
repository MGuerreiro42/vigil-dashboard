import { useTranslation } from 'react-i18next'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts'
import { WidgetShell } from '@/components/layout/widget-shell'
import { StatTile } from '@/components/ui/stat-tile'
import { chartTooltipStyle } from '@/lib/chart-styles'
import { formatRelativeTime } from '@/lib/format-relative-time'
import { intlLocale } from '@/i18n'
import { useKpIndex, useSpaceAlerts } from '@/features/space/api/space-weather'
import { auroraLatitude, kpToScale, SCALE_COLORS } from '@/features/space/lib/geomagnetic'
import { ACCENT } from '@/features/space/lib/space-style'

const ALERT_COLORS = { alert: '#f43f5e', warning: '#f59e0b', watch: '#facc15', summary: '#38bdf8', other: '#8b93a1' } as const

export function SpaceWeatherWidget() {
  const { t } = useTranslation()
  const { data: readings, isLoading, error, refetch, dataUpdatedAt } = useKpIndex()
  const { data: alerts } = useSpaceAlerts()
  const current = readings?.at(-1)
  const scale = current ? kpToScale(current.kp) : null

  return (
    <WidgetShell
      title={t('space.weather.title')}
      icon={<span className="text-xl">☀️</span>}
      isLoading={isLoading}
      error={error}
      onRetry={() => refetch()}
      lastUpdated={dataUpdatedAt || undefined}
      accentColor={ACCENT}
      isFocused
      fillHeight
    >
      {current && scale && (
        <div className="flex flex-col gap-3 flex-1 min-h-0">
          <div className="flex gap-2">
            <StatTile label={t('space.weather.kpNow')} value={current.kp.toFixed(2)} caption={`${scale} · ${t(`space.weather.scale.${scale}`)}`} color={SCALE_COLORS[scale]} />
            <div className="flex-1 rounded-xl border border-white/[0.06] bg-white/[0.04] px-3 py-2.5 text-[12px] text-fg-muted flex items-center">
              🌌 {t('space.weather.aurora', { latitude: auroraLatitude(current.kp) })}
            </div>
          </div>

          <div className="flex-shrink-0">
            <p className="text-[10px] uppercase tracking-widest text-fg-subtle mb-1">{t('space.weather.sevenDays')}</p>
            <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={readings} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                <XAxis dataKey="time" hide />
                <YAxis domain={[0, 9]} ticks={[0, 3, 5, 7, 9]} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} axisLine={false} tickLine={false} />
                {/* Kp 5 is where storms (G1) begin */}
                <ReferenceLine y={5} stroke="rgba(250,204,21,0.5)" strokeDasharray="3 3" />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  labelFormatter={(time) => new Date(String(time)).toLocaleString(intlLocale(), { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  formatter={(value) => [Number(value).toFixed(2), 'Kp']}
                />
                <Bar dataKey="kp" radius={[2, 2, 0, 0]}>
                  {readings?.map((reading) => <Cell key={reading.time} fill={SCALE_COLORS[kpToScale(reading.kp)]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            </div>
          </div>

          <div className="flex-1 min-h-0 flex flex-col">
            <p className="text-[10px] uppercase tracking-widest text-fg-subtle mb-1.5">{t('space.weather.alerts')}</p>
            {alerts?.length === 0 && <p className="text-sm text-fg-subtle">{t('space.weather.noAlerts')}</p>}
            <ul className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-1">
              {alerts?.map((alert) => (
                <li key={alert.id} className="flex items-start gap-2 text-[12px]">
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0" style={{ color: ALERT_COLORS[alert.kind], background: ALERT_COLORS[alert.kind] + '1a' }}>
                    {t(`space.weather.kind.${alert.kind}`)}
                  </span>
                  <span className="flex-1 text-white/75">{alert.headline}</span>
                  <span className="text-[11px] text-fg-subtle flex-shrink-0">{formatRelativeTime(Date.parse(alert.issuedAt) / 1000)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </WidgetShell>
  )
}
