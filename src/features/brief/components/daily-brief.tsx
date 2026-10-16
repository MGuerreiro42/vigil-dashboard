import { useMemo, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { generateDailyBrief } from '@/features/brief/lib/generate-brief'
import { GlassCard } from '@/components/surfaces/glass-card'
import type { CryptoAsset } from '@/features/crypto/types'
import type { WeatherCurrent, ForecastDay } from '@/features/weather/types'
import type { AirQuality } from '@/features/weather/types'
import type { Earthquake } from '@/features/earthquakes/types'
import type { GithubRepo } from '@/features/github/types'
import { InsightCard } from './insight-card'
import { WikiDiscoverCard } from './wiki-discover-card'
import { useTranslation } from 'react-i18next'
import { intlLocale } from '@/i18n'

interface Props {
  crypto?: CryptoAsset[]
  weather?: WeatherCurrent
  forecast?: ForecastDay[]
  airQuality?: AirQuality | null
  earthquakes?: Earthquake[]
  githubTrending?: GithubRepo[]
}

export const DailyBrief = memo(function DailyBrief({ crypto, weather, forecast, airQuality, earthquakes, githubTrending }: Props) {
  const { t } = useTranslation()
  const insights = useMemo(
    () => generateDailyBrief({ crypto, weather, forecast, airQuality, earthquakes, githubTrending }, t),
    [crypto, weather, forecast, airQuality, earthquakes, githubTrending, t]
  )

  // Ordenar: alertas → warnings → info (Gestalt: proximidade e ordem)
  const sorted = useMemo(
    () => [...insights].sort((first, second) => {
      const order = { alert: 0, warning: 1, info: 2 }
      return order[first.severity] - order[second.severity]
    }),
    [insights]
  )

  const now = new Date()
  const hour = now.getHours()
  const greeting = t(hour < 12 ? 'brief.greeting.morning' : hour < 18 ? 'brief.greeting.afternoon' : 'brief.greeting.evening')
  const alertCount = insights.filter((insight) => insight.severity === 'alert').length
  const warnCount = insights.filter((insight) => insight.severity === 'warning').length

  return (
    <GlassCard className="w-full" variant="default">
      <div className="px-4 md:px-5 pt-4 md:pt-5 pb-3 md:pb-4 flex flex-col lg:flex-row gap-4 lg:gap-5 items-stretch">

        {/* ── Left: greeting + insight cards ── */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Header */}
          <div className="flex items-start justify-between mb-3 md:mb-4">
            <div className="flex items-start gap-3 md:gap-4 flex-wrap">
              {/* Saudação */}
              <div>
                <motion.h2
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                  className="text-xl md:text-2xl font-semibold tracking-tight"
                  style={{
                    background: 'linear-gradient(90deg, rgba(255,255,255,0.95), rgba(255,255,255,0.55))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {greeting}
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-xs md:text-sm text-fg-muted mt-0.5 capitalize"
                >
                  {now.toLocaleDateString(intlLocale(), { weekday: 'long', day: 'numeric', month: 'long' })}
                </motion.p>
              </div>

              {/* Divisor vertical — só em sm+ */}
              <div className="hidden sm:block w-px self-stretch bg-white/8 mx-1" />

              {/* Status sumário */}
              <div className="flex items-center gap-2 md:gap-3 self-center flex-wrap">
                <span className="text-xs md:text-sm font-medium text-white/50">{t('brief.title')}</span>
                {alertCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: '#f43f5e22', color: '#f43f5e', border: '1px solid #f43f5e40' }}
                  >
                    {t('brief.alerts', { count: alertCount })}
                  </motion.span>
                )}
                {warnCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.05 }}
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: '#f59e0b22', color: '#f59e0b', border: '1px solid #f59e0b40' }}
                  >
                    {t('brief.warnings', { count: warnCount })}
                  </motion.span>
                )}
                {alertCount === 0 && warnCount === 0 && (
                  <span className="text-xs text-fg-subtle">{t('brief.allClear', { count: insights.length })}</span>
                )}
              </div>
            </div>

            {/* Timestamp */}
            <span className="text-xs text-fg-subtle self-start tabular-nums">
              {now.toLocaleTimeString(intlLocale(), { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Insight cards */}
          <div className="flex gap-2 md:gap-2.5 overflow-x-auto pb-1 -mx-1 px-1">
            <AnimatePresence>
              {sorted.map((insight, i) => (
                <InsightCard key={insight.id} insight={insight} index={i} />
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Divider — horizontal on mobile, vertical on lg ── */}
        <div className="lg:w-px lg:self-stretch w-full h-px bg-white/[0.07] flex-shrink-0" />

        {/* ── Right: Wikipedia discover — collapsible on mobile ── */}
        <WikiDiscoverCard />

      </div>
    </GlassCard>
  )
})
