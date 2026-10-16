import { useTranslation } from 'react-i18next'
import { WidgetShell } from '@/components/layout/widget-shell'
import { intlLocale } from '@/i18n'
import { useNearEarthObjects } from '@/features/space/api/asteroids'
import { ACCENT } from '@/features/space/lib/space-style'
import { HttpError } from '@/lib/http'

export function AsteroidsWidget() {
  const { t } = useTranslation()
  const { data: objects, isLoading, error, refetch, dataUpdatedAt } = useNearEarthObjects()
  const number = (value: number, digits = 1) => value.toLocaleString(intlLocale(), { maximumFractionDigits: digits })

  return (
    <WidgetShell
      title={t('space.asteroids.title')}
      icon={<span className="text-xl">☄️</span>}
      isLoading={isLoading}
      error={error}
      onRetry={() => refetch()}
      lastUpdated={dataUpdatedAt || undefined}
      accentColor={ACCENT}
      isFocused
      fillHeight
      errorHint={error instanceof HttpError && error.status === 429 ? t('space.asteroids.rateLimited') : undefined}
    >
      {objects && (
        <div className="flex flex-col gap-2 flex-1 min-h-0">
          <p className="text-[12px] text-fg-muted">{objects.length ? t('space.asteroids.count', { count: objects.length }) : t('space.asteroids.empty')}</p>
          <ul className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-1">
            {objects.map((object) => (
              <li key={object.id}>
                <a href={object.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-white/[0.04]">
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] text-white/85 flex items-center gap-2">
                      {object.name}
                      {object.hazardous && (
                        <span className="text-[10px] font-semibold px-1.5 rounded text-rose-300 bg-rose-500/15">{t('space.asteroids.hazardous')}</span>
                      )}
                    </div>
                    <div className="text-[11px] text-fg-subtle">
                      ⌀ {t('space.asteroids.diameter', { min: number(object.diameterMinMeters, 0), max: number(object.diameterMaxMeters, 0) })}
                      {' · '}{t('space.asteroids.velocity', { value: number(object.velocityKmS) })}
                      {' · '}{new Date(object.closestApproach).toLocaleTimeString(intlLocale(), { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div className="text-right text-[12px] font-mono tabular-nums" style={{ color: ACCENT }}>
                    {t('space.asteroids.lunar', { value: number(object.missDistanceLunar) })}
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </WidgetShell>
  )
}
