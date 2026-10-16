import { useTranslation } from 'react-i18next'
import { WidgetShell } from '@/components/layout/widget-shell'
import { useBlueskyTrends } from '@/features/pulse/api/bluesky-trends'

const ACCENT = '#3b82f6'

export function BlueskyTrendsWidget() {
  const { t } = useTranslation()
  const { data: trends, isLoading, error, refetch, dataUpdatedAt } = useBlueskyTrends()

  return (
    <WidgetShell
      title={t('pulse.bluesky.title')}
      icon={<span className="text-xl">🦋</span>}
      isLoading={isLoading}
      error={error}
      onRetry={() => refetch()}
      lastUpdated={dataUpdatedAt || undefined}
      accentColor={ACCENT}
      isFocused
      fillHeight
    >
      {trends && (
        <div className="flex flex-col gap-2 flex-1 min-h-0">
          {trends.length === 0 && <p className="text-sm text-fg-subtle">{t('pulse.bluesky.empty')}</p>}
          <ol className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-1">
            {trends.map((trend, index) => (
              <li key={trend.id}>
                <a href={trend.url} target="_blank" rel="noreferrer" className="flex gap-3 rounded-lg px-2 py-1.5 hover:bg-white/[0.04]">
                  <span className="w-5 flex-shrink-0 text-right font-mono text-[12px] text-fg-subtle">{index + 1}</span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13px] text-white/85">{trend.name}</span>
                    {trend.description && <span className="block text-[12px] text-fg-muted">{trend.description}</span>}
                  </span>
                </a>
              </li>
            ))}
          </ol>
          <p className="text-[10px] text-fg-subtle">{t('pulse.bluesky.source')}</p>
        </div>
      )}
    </WidgetShell>
  )
}
