import { useTranslation } from 'react-i18next'
import { WidgetShell } from '@/components/layout/widget-shell'
import { intlLocale } from '@/i18n'
import { useUpcomingLaunches } from '@/features/space/api/launches'
import { ACCENT } from '@/features/space/lib/space-style'
import { NextLaunchCard } from './next-launch-card'

const STATUS_COLORS: Record<string, string> = { Go: '#10b981', Success: '#10b981', Hold: '#f59e0b', Failure: '#f43f5e' }

export function LaunchesWidget() {
  const { t } = useTranslation()
  const { data: launches, isLoading, error, refetch, dataUpdatedAt } = useUpcomingLaunches()
  const [next, ...rest] = launches ?? []

  return (
    <WidgetShell
      title={t('space.launches.title')}
      icon={<span className="text-xl">🚀</span>}
      isLoading={isLoading}
      error={error}
      onRetry={() => refetch()}
      lastUpdated={dataUpdatedAt || undefined}
      accentColor={ACCENT}
      isFocused
      fillHeight
    >
      {launches && launches.length === 0 && <p className="text-sm text-fg-subtle">{t('space.launches.empty')}</p>}
      {next && (
        <div className="flex flex-col gap-3 flex-1 min-h-0">
          <NextLaunchCard launch={next} />
          <ul className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-0.5">
            {rest.map((launch) => (
              <li key={launch.id} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-white/[0.04]">
                <div className="w-20 flex-shrink-0 text-[11px] text-fg-muted tabular-nums">
                  {new Date(launch.net).toLocaleDateString(intlLocale(), { day: '2-digit', month: 'short' })}
                  <div className="text-fg-subtle">{new Date(launch.net).toLocaleTimeString(intlLocale(), { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] text-white/85 truncate">{launch.mission}</div>
                  <div className="text-[11px] text-fg-subtle truncate">
                    {launch.rocket}{launch.provider && ` · ${launch.provider}`}{launch.orbit && ` · ${launch.orbit}`}
                  </div>
                </div>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full border border-white/10" style={{ color: STATUS_COLORS[launch.status] ?? 'rgba(255,255,255,0.62)' }}>
                  {t(`space.launches.status.${launch.status}` as 'space.launches.status.Go', { defaultValue: launch.status })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </WidgetShell>
  )
}
