import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { WidgetShell } from '@/components/layout/widget-shell'
import { magnitudeColor } from '@/features/earthquakes/lib/magnitude'
import { SegmentedTabs } from '@/components/ui/segmented-tabs'
import { tabPanel } from '@/components/ui/tab-panel'
import { useNaturalEvents } from '@/features/natural-events/api/gdacs'
import { useEarthquakes } from '@/features/earthquakes/api/usgs'
import { formatRelativeTime } from '@/lib/format-relative-time'
import type { NaturalEvent } from '@/features/natural-events/types'
import { CategoriesView } from './categories-view'
import { EventFeed } from './event-feed'
import { EventsGlobe } from './events-globe'
import { SeismicTab } from './seismic-tab'
import { TimelineView } from './timeline-view'
import { ACCENT, alertBadge, categoryStyle } from '@/features/natural-events/lib/event-style'
import { StatTile } from '@/components/ui/stat-tile'
import { useTranslation } from 'react-i18next'

type RightTab = 'globe' | 'timeline' | 'categories' | 'seismic'

export function NaturalEventsWidget({ isFocused = false }: { isFocused?: boolean }) {
  const { t } = useTranslation()

  const { data: events = [], isLoading, error, refetch, dataUpdatedAt } = useNaturalEvents()
  const { data: quakes = [] } = useEarthquakes(2.5)

  const [activeTab, setActiveTab] = useState<RightTab>('globe')
  const [globeEverVisited, setGlobeEverVisited] = useState(false)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)

  const selectedEvent = useMemo(
    () => events.find(event => event.id === selectedEventId) ?? null,
    [events, selectedEventId],
  )

  if (isFocused && activeTab === 'globe' && !globeEverVisited) setGlobeEverVisited(true)

  const handleTabChange = (tab: RightTab) => {
    setActiveTab(tab)
    if (tab === 'globe') setGlobeEverVisited(true)
  }

  // Stats
  const totalActive = events.length
  const dominantCat = useMemo(() => {
    if (!events.length) return null
    const counts: Record<string, number> = {}
    events.forEach(event => { counts[event.categoryId] = (counts[event.categoryId] ?? 0) + 1 })
    const top = Object.entries(counts).sort((first, second) => second[1] - first[1])[0]
    return top ? { id: top[0], count: top[1], cfg: categoryStyle(top[0]) } : null
  }, [events])

  // Countries from GDACS country field (more accurate than title parsing)
  const countriesAffected = useMemo(() => {
    const names = new Set<string>()
    events.forEach(event => {
      if (event.country) {
        // GDACS sometimes has "Country1, Country2"
        event.country.split(',').forEach(country => names.add(country.trim()))
      } else {
        const parts = event.title.split(',')
        if (parts.length > 1) names.add(parts[parts.length - 1].trim())
      }
    })
    return names.size
  }, [events])

  // High-alert count (Orange + Red)
  const highAlertCount = useMemo(
    () => events.filter(event => event.alertLevel === 'Orange' || event.alertLevel === 'Red').length,
    [events],
  )

  // Highest magnitude quake from USGS
  const maxQuake = useMemo(
    () => quakes.length ? quakes.reduce((strongest, quake) => quake.magnitude > strongest.magnitude ? quake : strongest) : null,
    [quakes],
  )

  const lastEvent = events.length
    ? [...events].sort((first, second) => new Date(second.date).getTime() - new Date(first.date).getTime())[0]
    : null

  const tabs: { id: RightTab; label: string }[] = [
    { id: 'globe',      label: t('naturalEvents.tabs.globe') },
    { id: 'seismic',    label: t('naturalEvents.tabs.seismic', { count: quakes.length }) },
    { id: 'timeline',   label: t('naturalEvents.tabs.timeline') },
    { id: 'categories', label: t('naturalEvents.tabs.categories') },
  ]

  const handleEventClick = (evt: NaturalEvent) => {
    setSelectedEventId(evt.id)
    setActiveTab('globe')
    setGlobeEverVisited(true)
  }

  const handleClearSelection = () => setSelectedEventId(null)

  return (
    <WidgetShell
      title={t('naturalEvents.title')}
      icon={<span className={isFocused ? 'text-2xl' : 'text-base'}>🌿</span>}
      isLoading={isLoading}
      error={error}
      onRetry={() => refetch()}
      lastUpdated={dataUpdatedAt || undefined}
      accentColor={ACCENT}
      isFocused={isFocused}
      fillHeight={isFocused}
      viewRoute="/planet#natural-events"
    >
      {/* ── Stats header ── */}
      {events.length > 0 && (
        <div className="grid grid-cols-2 sm:flex gap-2 mb-3 flex-shrink-0">
          <StatTile label={t('naturalEvents.stats.active')} value={totalActive} caption={t('naturalEvents.stats.global')} valueColor={ACCENT} />

          {dominantCat && (
            <StatTile label={t('naturalEvents.stats.mostFrequent')} value={dominantCat.cfg.icon} caption={dominantCat.cfg.label} color={dominantCat.cfg.color} valueClassName="text-[18px]" />
          )}

          {isFocused && (
            <StatTile label={t('naturalEvents.stats.countries')} value={countriesAffected} caption={t('naturalEvents.stats.affected')} />
          )}

          {isFocused && highAlertCount > 0 && (
            <StatTile label={t('naturalEvents.stats.highAlert')} value={highAlertCount} caption={t('naturalEvents.stats.highAlertCaption')} color="#f97316" />
          )}

          {isFocused && maxQuake && (
            <StatTile label={t('naturalEvents.stats.strongestQuake')} value={maxQuake.magnitude.toFixed(1)} caption={maxQuake.place.split(',')[0]} color={magnitudeColor(maxQuake.magnitude)} />
          )}

          {lastEvent && (
            <div className="flex-1 flex flex-col justify-between px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] min-w-0">
              <span className="text-[10px] uppercase tracking-widest text-fg-subtle leading-none">{t('naturalEvents.stats.latestEvent')}</span>
              <span className="text-[12px] text-white/70 leading-tight mt-1.5 line-clamp-2">{lastEvent.title}</span>
              <span className="text-[10px] mt-1 leading-none" style={{ color: categoryStyle(lastEvent.categoryId).color }}>
                {categoryStyle(lastEvent.categoryId).icon} {formatRelativeTime(Math.floor(new Date(lastEvent.date).getTime() / 1000))}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── MODO COMPACTO ── */}
      {!isFocused && (
        <div className="flex flex-col gap-0.5 overflow-hidden">
          {[...events]
            .sort((first, second) => {
              // Sort by alert severity first (Red > Orange > Green), then by date
              const alertOrder: Record<string, number> = { Red: 3, Orange: 2, Green: 1 }
              const firstScore = alertOrder[first.alertLevel ?? 'Green'] ?? 0
              const secondScore = alertOrder[second.alertLevel ?? 'Green'] ?? 0
              if (secondScore !== firstScore) return secondScore - firstScore
              return new Date(second.date).getTime() - new Date(first.date).getTime()
            })
            .slice(0, 8)
            .map((evt, i) => {
              const cfg = categoryStyle(evt.categoryId)
              const badge = alertBadge(evt.alertLevel)
              return (
                <motion.div
                  key={evt.id}
                  initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-white/4 transition-colors group"
                >
                  <span className="text-base leading-none flex-shrink-0">{cfg.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] text-white/75 truncate group-hover:text-white/90">
                      {evt.country ?? evt.title}
                    </div>
                    <div className="text-[10px] text-fg-subtle mt-0.5 flex items-center gap-1.5">
                      <span style={{ color: cfg.color }}>{cfg.label}</span>
                      <span>·</span>
                      <span>{formatRelativeTime(Math.floor(new Date(evt.date).getTime() / 1000))}</span>
                    </div>
                  </div>
                  {badge && (
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: badge.color + '20', color: badge.color, border: `1px solid ${badge.color}40` }}
                    >
                      {badge.label}
                    </span>
                  )}
                </motion.div>
              )
            })}
        </div>
      )}

      {/* ── MODO EXPANDIDO ── */}
      {isFocused && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col md:flex-row gap-4 flex-1 min-h-0"
        >
          {/* Main panel — LEFT (flex-1) */}
          <div className="flex-1 min-w-0 min-h-0 flex flex-col gap-3">
            {/* Tab bar */}
            <SegmentedTabs tabs={tabs} active={activeTab} onChange={handleTabChange} accent={ACCENT} />

            {/* Panel area */}
            <div className="flex-1 min-h-0" style={{ position: 'relative' }}>

              {/* Globe — keep in DOM once visited (canvas survives opacity toggle) */}
              {globeEverVisited && (
                <div {...tabPanel(activeTab === 'globe')}>
                  <EventsGlobe events={events} selectedEvent={selectedEvent} onEventClick={handleEventClick} onClearSelection={handleClearSelection} active={activeTab === 'globe'} />
                </div>
              )}

              {/* Timeline */}
              <div {...tabPanel(activeTab === 'timeline')}>
                <TimelineView events={events} />
              </div>

              {/* Categories */}
              <div {...tabPanel(activeTab === 'categories')}>
                <CategoriesView events={events} />
              </div>

              {/* Seismic — USGS earthquake data */}
              <div {...tabPanel(activeTab === 'seismic')}>
                <SeismicTab quakes={quakes} />
              </div>

            </div>
          </div>

          {/* Divider */}
          <div className="md:w-px md:h-auto h-px w-full bg-white/6 flex-shrink-0" />

          {/* Feed — RIGHT (w-52 on md+, full width on mobile) */}
          <div className="w-full h-[38%] md:h-auto md:w-52 flex-shrink-0 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2 flex-shrink-0">
              <span className="text-[10px] uppercase tracking-widest text-fg-subtle">{t('naturalEvents.liveFeed')}</span>
              <span className="text-[11px] font-mono text-fg-subtle">{events.length}</span>
            </div>
            <EventFeed events={events} selectedEventId={selectedEventId} onEventClick={handleEventClick} />
          </div>

        </motion.div>
      )}
    </WidgetShell>
  )
}
