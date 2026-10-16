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

type RightTab = 'globe' | 'timeline' | 'categories' | 'seismic'

export function NaturalEventsWidget({ isFocused = false }: { isFocused?: boolean }) {

  const { data: events = [], isLoading, error, refetch, dataUpdatedAt } = useNaturalEvents()
  const { data: quakes = [] } = useEarthquakes(2.5)

  const [activeTab, setActiveTab] = useState<RightTab>('globe')
  const [globeEverVisited, setGlobeEverVisited] = useState(false)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)

  const selectedEvent = useMemo(
    () => events.find(e => e.id === selectedEventId) ?? null,
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
    events.forEach(e => { counts[e.categoryId] = (counts[e.categoryId] ?? 0) + 1 })
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
    return top ? { id: top[0], count: top[1], cfg: categoryStyle(top[0]) } : null
  }, [events])

  // Countries from GDACS country field (more accurate than title parsing)
  const countriesAffected = useMemo(() => {
    const names = new Set<string>()
    events.forEach(e => {
      if (e.country) {
        // GDACS sometimes has "Country1, Country2"
        e.country.split(',').forEach(c => names.add(c.trim()))
      } else {
        const parts = e.title.split(',')
        if (parts.length > 1) names.add(parts[parts.length - 1].trim())
      }
    })
    return names.size
  }, [events])

  // High-alert count (Orange + Red)
  const highAlertCount = useMemo(
    () => events.filter(e => e.alertLevel === 'Orange' || e.alertLevel === 'Red').length,
    [events],
  )

  // Highest magnitude quake from USGS
  const maxQuake = useMemo(
    () => quakes.length ? quakes.reduce((a, b) => b.magnitude > a.magnitude ? b : a) : null,
    [quakes],
  )

  const lastEvent = events.length
    ? [...events].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
    : null

  const tabs: { id: RightTab; label: string }[] = [
    { id: 'globe',      label: '🌍 Globo' },
    { id: 'seismic',    label: `🌋 Sismica (${quakes.length})` },
    { id: 'timeline',   label: '📅 Timeline' },
    { id: 'categories', label: '🗂 Categorias' },
  ]

  const handleEventClick = (evt: NaturalEvent) => {
    setSelectedEventId(evt.id)
    setActiveTab('globe')
    setGlobeEverVisited(true)
  }

  const handleClearSelection = () => setSelectedEventId(null)

  return (
    <WidgetShell
      title="Eventos Naturais"
      icon={<span className={isFocused ? 'text-2xl' : 'text-base'}>🌿</span>}
      isLoading={isLoading}
      error={error}
      onRetry={() => refetch()}
      lastUpdated={dataUpdatedAt || undefined}
      accentColor={ACCENT}
      isFocused={isFocused}
      fillHeight={isFocused}
      viewRoute="/natural-events"
    >
      {/* ── Stats header ── */}
      {events.length > 0 && (
        <div className="flex gap-2 mb-3 flex-shrink-0">
          <div className="flex flex-col justify-between px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] min-w-[64px]">
            <span className="text-[10px] uppercase tracking-widest text-white/25 leading-none">Ativos</span>
            <span className="text-[22px] font-mono font-bold leading-none mt-1.5" style={{ color: ACCENT }}>{totalActive}</span>
            <span className="text-[10px] text-white/20 mt-1 leading-none">global</span>
          </div>

          {dominantCat && (
            <div className="flex flex-col justify-between px-3 py-2.5 rounded-xl border min-w-[68px]"
              style={{ background: dominantCat.cfg.color + '0f', borderColor: dominantCat.cfg.color + '30' }}>
              <span className="text-[10px] uppercase tracking-widest leading-none" style={{ color: dominantCat.cfg.color + 'aa' }}>Maior Freq.</span>
              <span className="text-[18px] leading-none mt-1.5">{dominantCat.cfg.icon}</span>
              <span className="text-[10px] mt-1 leading-none" style={{ color: dominantCat.cfg.color + '99' }}>
                {dominantCat.cfg.label}
              </span>
            </div>
          )}

          {isFocused && (
            <div className="flex flex-col justify-between px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] min-w-[64px]">
              <span className="text-[10px] uppercase tracking-widest text-white/25 leading-none">Países</span>
              <span className="text-[22px] font-mono font-bold text-white/85 leading-none mt-1.5">{countriesAffected}</span>
              <span className="text-[10px] text-white/20 mt-1 leading-none">afetados</span>
            </div>
          )}

          {isFocused && highAlertCount > 0 && (
            <div className="flex flex-col justify-between px-3 py-2.5 rounded-xl border min-w-[64px]"
              style={{ background: '#f9731610', borderColor: '#f9731640' }}>
              <span className="text-[10px] uppercase tracking-widest leading-none" style={{ color: '#f97316aa' }}>Alerta Alto</span>
              <span className="text-[22px] font-mono font-bold leading-none mt-1.5" style={{ color: '#f97316' }}>{highAlertCount}</span>
              <span className="text-[10px] mt-1 leading-none" style={{ color: '#f9731699' }}>Orange+Red</span>
            </div>
          )}

          {isFocused && maxQuake && (
            <div className="flex flex-col justify-between px-3 py-2.5 rounded-xl border min-w-[64px]"
              style={{ background: magnitudeColor(maxQuake.magnitude) + '10', borderColor: magnitudeColor(maxQuake.magnitude) + '35' }}>
              <span className="text-[10px] uppercase tracking-widest leading-none" style={{ color: magnitudeColor(maxQuake.magnitude) + 'aa' }}>Maior M</span>
              <span className="text-[22px] font-mono font-bold leading-none mt-1.5" style={{ color: magnitudeColor(maxQuake.magnitude) }}>
                {maxQuake.magnitude.toFixed(1)}
              </span>
              <span className="text-[10px] mt-1 leading-none truncate" style={{ color: magnitudeColor(maxQuake.magnitude) + '80' }}>
                {maxQuake.place.split(',')[0]}
              </span>
            </div>
          )}

          {lastEvent && (
            <div className="flex-1 flex flex-col justify-between px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] min-w-0">
              <span className="text-[10px] uppercase tracking-widest text-white/25 leading-none">Último Evento</span>
              <span className="text-[12px] text-white/70 leading-tight mt-1.5 line-clamp-2">{lastEvent.title}</span>
              <span className="text-[10px] mt-1 leading-none" style={{ color: categoryStyle(lastEvent.categoryId).color + 'aa' }}>
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
            .sort((a, b) => {
              // Sort by alert severity first (Red > Orange > Green), then by date
              const alertOrder: Record<string, number> = { Red: 3, Orange: 2, Green: 1 }
              const aScore = alertOrder[a.alertLevel ?? 'Green'] ?? 0
              const bScore = alertOrder[b.alertLevel ?? 'Green'] ?? 0
              if (bScore !== aScore) return bScore - aScore
              return new Date(b.date).getTime() - new Date(a.date).getTime()
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
                    <div className="text-[10px] text-white/30 mt-0.5 flex items-center gap-1.5">
                      <span style={{ color: cfg.color + 'aa' }}>{cfg.label}</span>
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
          <div className="flex-1 min-w-0 flex flex-col gap-3">
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
          <div className="w-full md:w-52 md:flex-shrink-0 flex flex-col md:min-h-0 min-h-[200px]">
            <div className="flex items-center justify-between mb-2 flex-shrink-0">
              <span className="text-[10px] uppercase tracking-widest text-white/25">Feed ao vivo</span>
              <span className="text-[11px] font-mono text-white/20">{events.length}</span>
            </div>
            <EventFeed events={events} selectedEventId={selectedEventId} onEventClick={handleEventClick} />
          </div>

        </motion.div>
      )}
    </WidgetShell>
  )
}
