import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WidgetShell } from '@/components/layout/WidgetShell'
import { useNaturalEvents } from '@/api/gdacs'
import { useEarthquakes } from '@/api/usgs'
import { formatRelativeTime } from '@/hooks/useRelativeTime'
import type { NaturalEvent } from '@/api/types/natural-event'
import type { Earthquake } from '@/api/types/earthquake'

const ACCENT = '#10b981'

// ---------------------------------------------------------------------------
// Category config
// ---------------------------------------------------------------------------
const CAT: Record<string, { label: string; icon: string; color: string }> = {
  wildfires:          { label: 'Incêndios',       icon: '🔥', color: '#f97316' },
  severeStorms:       { label: 'Tempestades',      icon: '🌪️', color: '#818cf8' },
  volcanoes:          { label: 'Vulcões',           icon: '🌋', color: '#ef4444' },
  seaLakeIce:         { label: 'Gelo Marinho',      icon: '🧊', color: '#67e8f9' },
  floods:             { label: 'Inundações',         icon: '🌊', color: '#3b82f6' },
  landslides:         { label: 'Deslizamentos',      icon: '⛰️', color: '#92400e' },
  snow:               { label: 'Neve',               icon: '❄️', color: '#cbd5e1' },
  tempExtremes:       { label: 'Extremos Térmicos', icon: '🌡️', color: '#f59e0b' },
  drought:            { label: 'Seca',               icon: '☀️', color: '#d97706' },
  dustHaze:           { label: 'Poeira / Névoa',     icon: '💨', color: '#a8a29e' },
  waterColor:         { label: 'Mancha na Água',     icon: '🟦', color: '#0ea5e9' },
  manmade:            { label: 'Incidentes',          icon: '⚠️', color: '#e11d48' },
}

function catCfg(id: string) {
  return CAT[id] ?? { label: id, icon: '🌐', color: '#6b7280' }
}

// GDACS alert level → color
const ALERT_COLOR: Record<string, string> = {
  Green: '#10b981',
  Orange: '#f97316',
  Red: '#ef4444',
}
function alertBadge(level?: string) {
  if (!level) return null
  return { color: ALERT_COLOR[level] ?? '#6b7280', label: level }
}

// ---------------------------------------------------------------------------
// Seismic helpers
// ---------------------------------------------------------------------------
function magColor(mag: number): string {
  if (mag >= 6.5) return '#f43f5e'
  if (mag >= 5.0) return '#f97316'
  if (mag >= 3.5) return '#f59e0b'
  return '#6b7280'
}
function magLabel(mag: number): string {
  if (mag >= 6.5) return 'Severo'
  if (mag >= 5.0) return 'Forte'
  if (mag >= 3.5) return 'Moderado'
  return 'Menor'
}

function SeismicTab({ quakes }: { quakes: Earthquake[] }) {
  const [sort, setSort] = useState<'recent' | 'mag'>('mag')
  const sorted = useMemo(() => {
    const list = [...quakes]
    return sort === 'mag'
      ? list.sort((a, b) => b.magnitude - a.magnitude)
      : list.sort((a, b) => b.time - a.time)
  }, [quakes, sort])

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Sort controls + count */}
      <div className="flex items-center gap-1 mb-2 flex-shrink-0">
        {(['mag', 'recent'] as const).map(s => (
          <button
            key={s}
            onClick={() => setSort(s)}
            className="px-2.5 py-1 rounded-md text-[11px] font-medium transition-all"
            style={{
              background: sort === s ? 'rgba(255,255,255,0.08)' : 'transparent',
              color: sort === s ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.28)',
              border: `1px solid ${sort === s ? 'rgba(255,255,255,0.12)' : 'transparent'}`,
            }}
          >
            {s === 'mag' ? 'Magnitude ↓' : 'Recente'}
          </button>
        ))}
        <span className="ml-auto text-[10px] text-white/20">{quakes.length} eventos</span>
      </div>

      {/* List */}
      <div className="flex flex-col gap-0.5 overflow-y-auto flex-1 min-h-0">
        {sorted.map((quake, i) => (
          <motion.a
            key={quake.id}
            href={quake.url} target="_blank" rel="noopener noreferrer"
            initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.015 }}
            className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg hover:bg-white/[0.04] transition-colors group flex-shrink-0"
          >
            <div
              className="flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0"
              style={{ background: magColor(quake.magnitude) + '18', border: `1px solid ${magColor(quake.magnitude)}30` }}
            >
              <span className="text-[12px] font-mono font-bold" style={{ color: magColor(quake.magnitude) }}>
                {quake.magnitude.toFixed(1)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] text-white/70 truncate group-hover:text-white/90">{quake.place}</div>
              <div className="text-[10px] text-white/28 mt-0.5 flex items-center gap-1.5">
                <span style={{ color: magColor(quake.magnitude) + 'aa' }}>{magLabel(quake.magnitude)}</span>
                <span>·</span>
                <span>{quake.depth.toFixed(0)} km prof.</span>
                <span>·</span>
                <span>{formatRelativeTime(Math.floor(quake.time / 1000))}</span>
                {quake.tsunamiRisk && <span className="text-amber-400 ml-1">🌊</span>}
              </div>
            </div>
          </motion.a>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Storm intensity helpers (Saffir-Simpson / WMO scale in knots)
// ---------------------------------------------------------------------------
function stormCategory(kts: number): { label: string; color: string; short: string } {
  if (kts < 34)  return { label: 'Depressão Tropical', short: 'DT',   color: '#94a3b8' }
  if (kts < 64)  return { label: 'Tempestade Tropical', short: 'TT',   color: '#60a5fa' }
  if (kts < 83)  return { label: 'Categoria 1',          short: 'C1',   color: '#fde047' }
  if (kts < 96)  return { label: 'Categoria 2',          short: 'C2',   color: '#fb923c' }
  if (kts < 113) return { label: 'Categoria 3',          short: 'C3',   color: '#ef4444' }
  if (kts < 137) return { label: 'Categoria 4',          short: 'C4',   color: '#dc2626' }
  return               { label: 'Categoria 5',          short: 'C5',   color: '#7c3aed' }
}

// Radius scale for globe points — log scale, returns value in [0.25, 1.2]
function magnitudeRadius(evt: NaturalEvent): number {
  const m = evt.magnitude
  if (!m || m <= 0) return 0.45
  const unit = evt.magnitudeUnit ?? ''
  let val = m
  if (unit === 'hectare') val = m * 2.471 // convert to acres for uniform scale
  // log2 scale: 100ac→0.35, 1k→0.5, 10k→0.7, 100k→0.95, 1M→1.2
  const r = 0.25 + (Math.log2(Math.max(val, 1)) / 20) * 0.95
  return Math.min(Math.max(r, 0.25), 1.2)
}


// ---------------------------------------------------------------------------
// Globe tooltip HTML (hover — non-selected points)
// ---------------------------------------------------------------------------
function buildGlobeTooltip(evt: NaturalEvent): string {
  const cfg = catCfg(evt.categoryId)
  const rel = formatRelativeTime(Math.floor(new Date(evt.date).getTime() / 1000))
  const latDir = evt.lat >= 0 ? 'N' : 'S'
  const lngDir = evt.lng >= 0 ? 'L' : 'O'

  // Magnitude display
  let magLine = ''
  if (evt.magnitude != null && evt.magnitudeUnit) {
    const unit = evt.magnitudeUnit === 'kts' ? 'kts' : evt.magnitudeUnit === 'NM^2' ? 'NM²' : evt.magnitudeUnit
    if (evt.magnitudeUnit === 'kts') {
      const sc = stormCategory(evt.magnitude)
      magLine = `<span style="color:${sc.color};background:${sc.color}18;padding:1px 6px;border-radius:99px;font-size:9px;font-weight:700">${sc.short} · ${evt.magnitude} ${unit}</span>`
    } else {
      const display = evt.magnitude >= 1000
        ? `${(evt.magnitude / 1000).toFixed(1)}k ${unit}`
        : `${evt.magnitude.toFixed(0)} ${unit}`
      magLine = `<span style="color:${cfg.color}cc;font-size:10px">${display}</span>`
    }
  }

  return `
    <div style="background:#0d1117;border:1px solid ${cfg.color}40;border-radius:10px;padding:9px 12px;min-width:170px;max-width:220px;font-family:system-ui,sans-serif;box-shadow:0 8px 32px rgba(0,0,0,0.7);">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
        <span style="font-size:16px;line-height:1">${cfg.icon}</span>
        <span style="font-size:10px;font-weight:700;color:${cfg.color};background:${cfg.color}18;padding:1px 6px;border-radius:99px">${cfg.label}</span>
        ${magLine}
      </div>
      <div style="font-size:11px;font-weight:600;color:rgba(255,255,255,0.85);line-height:1.4;margin-bottom:5px">${evt.title}</div>
      ${evt.description ? `<div style="font-size:10px;color:rgba(255,255,255,0.4);margin-bottom:5px">${evt.description}</div>` : ''}
      <div style="font-size:10px;color:rgba(255,255,255,0.3)">${Math.abs(evt.lat).toFixed(2)}°${latDir} ${Math.abs(evt.lng).toFixed(2)}°${lngDir} · ${rel}</div>
    </div>
  `
}


// ---------------------------------------------------------------------------
// Pinned tooltip (JSX — fixed overlay when event is selected)
// ---------------------------------------------------------------------------
function PinnedTooltip({ evt, onClose }: { evt: NaturalEvent; onClose: () => void }) {
  const cfg = catCfg(evt.categoryId)
  const rel = formatRelativeTime(Math.floor(new Date(evt.date).getTime() / 1000))
  const absDate = new Date(evt.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
  const latDir = evt.lat >= 0 ? 'N' : 'S'
  const lngDir = evt.lng >= 0 ? 'L' : 'O'
  const isStorm = evt.categoryId === 'severeStorms'
  const stormCat = isStorm && evt.magnitude ? stormCategory(evt.magnitude) : null

  // Magnitude display
  let magDisplay = ''
  if (evt.magnitude != null && evt.magnitudeUnit) {
    const u = evt.magnitudeUnit
    if (u === 'kts') magDisplay = `${evt.magnitude} kts`
    else if (u === 'NM^2') magDisplay = `${evt.magnitude.toFixed(1)} NM²`
    else if (u === 'hectare') magDisplay = `${(evt.magnitude).toLocaleString('pt-BR')} ha`
    else {
      magDisplay = evt.magnitude >= 1000
        ? `${(evt.magnitude / 1000).toFixed(1)}k ${u}`
        : `${evt.magnitude.toFixed(0)} ${u}`
    }
  }

  const hasFooter = !!evt.sourceUrl || !!evt.description

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 4, scale: 0.97 }}
      transition={{ duration: 0.18 }}
      style={{
        position: 'absolute', bottom: 40, left: 12, zIndex: 20,
        background: '#0d1117',
        border: `1px solid ${cfg.color}45`,
        borderRadius: 12,
        padding: '10px 13px',
        minWidth: 210, maxWidth: 250,
        boxShadow: `0 8px 32px rgba(0,0,0,0.75), 0 0 0 1px ${cfg.color}15`,
        fontFamily: 'system-ui, sans-serif',
        pointerEvents: 'auto',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7 }}>
        <span style={{ fontSize: 16, lineHeight: 1 }}>{cfg.icon}</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: cfg.color, background: cfg.color + '18', padding: '1px 6px', borderRadius: 99 }}>{cfg.label}</span>
        {stormCat && (
          <span style={{ fontSize: 9, fontWeight: 700, color: stormCat.color, background: stormCat.color + '20', padding: '1px 6px', borderRadius: 99 }}>{stormCat.short}</span>
        )}
        {evt.status === 'open'
          ? <span style={{ marginLeft: 'auto', fontSize: 9, color: '#10b981', background: '#10b98118', padding: '1px 6px', borderRadius: 99, fontWeight: 700 }}>ATIVO</span>
          : <span style={{ marginLeft: 'auto', fontSize: 9, color: '#6b7280', background: '#6b728018', padding: '1px 6px', borderRadius: 99 }}>FECHADO</span>}
        <button onClick={onClose} style={{
          marginLeft: 4, background: 'rgba(255,255,255,0.06)', border: 'none',
          color: 'rgba(255,255,255,0.4)', borderRadius: 6, width: 18, height: 18,
          fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>×</button>
      </div>

      {/* Title */}
      <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.88)', lineHeight: 1.4, marginBottom: 7 }}>
        {evt.title}
      </div>

      {/* Info grid */}
      <div style={{ display: 'grid', gridTemplateColumns: magDisplay ? '1fr 1fr 1fr' : '1fr 1fr', gap: 4, marginBottom: hasFooter ? 7 : 0 }}>
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 6, padding: '4px 7px' }}>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Data</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>{absDate}</div>
          <div style={{ fontSize: 9, color: cfg.color + '99', marginTop: 1 }}>{rel}</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 6, padding: '4px 7px' }}>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Coords</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace' }}>{Math.abs(evt.lat).toFixed(2)}°{latDir}</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace' }}>{Math.abs(evt.lng).toFixed(2)}°{lngDir}</div>
        </div>
        {magDisplay && (
          <div style={{ background: cfg.color + '0f', border: `1px solid ${cfg.color}25`, borderRadius: 6, padding: '4px 7px' }}>
            <div style={{ fontSize: 9, color: cfg.color + 'aa', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
              {isStorm ? 'Vento' : 'Área'}
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: stormCat?.color ?? cfg.color }}>{magDisplay}</div>
            {stormCat && <div style={{ fontSize: 9, color: stormCat.color + 'aa', marginTop: 1 }}>{stormCat.label}</div>}
          </div>
        )}
      </div>

      {/* Footer */}
      {hasFooter && (
        <div style={{ paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: 3 }}>
          {evt.description && (
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', lineHeight: 1.4 }}>{evt.description}</div>
          )}
          {evt.sourceUrl && (
            <a href={evt.sourceUrl} target="_blank" rel="noopener"
              style={{ color: cfg.color, fontSize: 10, textDecoration: 'none', borderBottom: `1px dotted ${cfg.color}55` }}>
              Ver fonte ↗
            </a>
          )}
        </div>
      )}
    </motion.div>
  )
}


type GlobePoint = { id: string; lat: number; lng: number; color: string; radius: number }
type TrackSegment = { points: [number, number][]; color: string; strokeWidth: number }

function GlobeView({ events, selectedEvent, onEventClick, onClearSelection }: {
  events: NaturalEvent[]
  selectedEvent: NaturalEvent | null
  onEventClick: (e: NaturalEvent) => void
  onClearSelection: () => void
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [dims, setDims] = useState({ w: 0, h: 0 })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [GlobeComponent, setGlobeComponent] = useState<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globeRef = useRef<any>(null)
  const rotatingRef = useRef(true)

  useEffect(() => {
    import('react-globe.gl').then((mod) => setGlobeComponent(() => mod.default))
  }, [])

  useEffect(() => {
    if (!wrapRef.current) return
    const ro = new ResizeObserver(([e]) => {
      setDims({ w: e.contentRect.width, h: e.contentRect.height })
    })
    ro.observe(wrapRef.current)
    return () => ro.disconnect()
  }, [])

  // FlyTo when selectedEvent changes
  useEffect(() => {
    if (!selectedEvent || !globeRef.current) return
    rotatingRef.current = false
    globeRef.current.controls().autoRotate = false
    // For storms with tracks, fly to the latest (last) position
    globeRef.current.pointOfView(
      { lat: selectedEvent.lat, lng: selectedEvent.lng, altitude: 1.4 },
      1200,
    )
  }, [selectedEvent])

  // Main event points — magnitude-scaled radius
  const points: GlobePoint[] = useMemo(
    () => events.map(e => {
      const isSelected = selectedEvent?.id === e.id
      const isStorm = e.categoryId === 'severeStorms'
      // Hide the main point for selected storms (replaced by track dots)
      if (isSelected && isStorm && e.track.length > 1) return null
      return {
        id: e.id,
        lat: e.lat,
        lng: e.lng,
        color: isSelected ? '#ffffff' : catCfg(e.categoryId).color,
        radius: isSelected ? magnitudeRadius(e) * 1.4 : magnitudeRadius(e),
      }
    }).filter(Boolean) as GlobePoint[],
    [events, selectedEvent],
  )

  // Storm track: segmented paths colored by Saffir-Simpson intensity
  const stormTrackSegments: TrackSegment[] = useMemo(() => {
    if (!selectedEvent || selectedEvent.categoryId !== 'severeStorms') return []
    const track = selectedEvent.track
    if (track.length < 2) return []
    return track.slice(0, -1).map((pt, i) => {
      const next = track[i + 1]
      const sc = stormCategory(pt.magnitude ?? 35)
      return {
        points: [[pt.lat, pt.lng], [next.lat, next.lng]] as [number, number][],
        color: sc.color + 'cc',
        strokeWidth: 1.5,
      }
    })
  }, [selectedEvent])

  // Track waypoint dots (for selected storm) — colored by intensity
  const trackDots = useMemo(() => {
    if (!selectedEvent || selectedEvent.categoryId !== 'severeStorms') return []
    return selectedEvent.track.map((pt, i) => {
      const isLast = i === selectedEvent.track.length - 1
      const sc = stormCategory(pt.magnitude ?? 35)
      return {
        id: isLast ? selectedEvent.id : `${selectedEvent.id}_track_${i}`,
        lat: pt.lat,
        lng: pt.lng,
        color: isLast ? '#ffffff' : sc.color,
        radius: isLast ? 0.7 : 0.28,
      }
    })
  }, [selectedEvent])

  // Merge main points + track dots
  const allPoints = useMemo(
    () => [...points, ...trackDots],
    [points, trackDots],
  )

  const handlePointClick = useCallback((point: object) => {
    const p = point as GlobePoint
    // Ignore track waypoint clicks (only main event points have matching IDs)
    const evt = events.find(e => e.id === p.id)
    if (evt) onEventClick(evt)
  }, [events, onEventClick])

  const handleGlobeClick = useCallback(() => {
    if (!globeRef.current) return
    rotatingRef.current = !rotatingRef.current
    globeRef.current.controls().autoRotate = rotatingRef.current
  }, [])

  const getTooltip = useCallback((point: object) => {
    const p = point as GlobePoint
    if (p.id === selectedEvent?.id || p.id.includes('_track_')) return ''
    const evt = events.find(e => e.id === p.id)
    return evt ? buildGlobeTooltip(evt) : ''
  }, [events, selectedEvent])

  return (
    <div ref={wrapRef} style={{ position: 'absolute', inset: 0, background: '#06080f', borderRadius: 10, overflow: 'hidden' }}>
      {GlobeComponent && dims.w > 0 && (
        <GlobeComponent
          ref={globeRef}
          width={dims.w}
          height={dims.h}
          backgroundColor="rgba(0,0,0,0)"
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
          atmosphereColor="rgba(16,185,129,0.15)"
          atmosphereAltitude={0.18}
          // Main event points
          pointsData={allPoints}
          pointLat="lat"
          pointLng="lng"
          pointColor="color"
          pointAltitude={0.012}
          pointRadius="radius"
          pointLabel={getTooltip}
          onPointClick={handlePointClick}
          // Storm track paths
          pathsData={stormTrackSegments}
          pathPoints="points"
          pathColor="color"
          pathStroke="strokeWidth"
          pathDashLength={0.05}
          pathDashGap={0}
          pathAltitude={0.005}
          onGlobeClick={handleGlobeClick}
          onGlobeReady={() => {
            if (!globeRef.current) return
            globeRef.current.controls().autoRotate = true
            globeRef.current.controls().autoRotateSpeed = 0.4
            globeRef.current.controls().enableZoom = true
          }}
        />
      )}
      {(!GlobeComponent || dims.w === 0) && (
        <div className="flex items-center justify-center h-full text-white/20 text-sm">Carregando globo…</div>
      )}

      {/* Storm track legend — only when a storm with track is selected */}
      <AnimatePresence>
        {selectedEvent?.categoryId === 'severeStorms' && selectedEvent.track.length > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute', top: 10, right: 12, zIndex: 10,
              background: 'rgba(13,17,23,0.85)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8, padding: '6px 10px',
              fontSize: 9, fontFamily: 'system-ui, sans-serif',
              display: 'flex', flexDirection: 'column', gap: 2,
            }}
          >
            {[35, 64, 83, 96, 113, 137].map(kts => {
              const sc = stormCategory(kts)
              return (
                <div key={kts} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 18, height: 2, background: sc.color, borderRadius: 1 }} />
                  <span style={{ color: sc.color, fontWeight: 700 }}>{sc.short}</span>
                  <span style={{ color: 'rgba(255,255,255,0.3)' }}>{sc.label}</span>
                </div>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pinned tooltip overlay */}
      <AnimatePresence>
        {selectedEvent && (
          <PinnedTooltip key={selectedEvent.id} evt={selectedEvent} onClose={onClearSelection} />
        )}
      </AnimatePresence>

      <div style={{ position: 'absolute', bottom: 10, right: 12, fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>
        clique no globo · pausa rotação
      </div>
    </div>
  )
}


// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------
function TimelineView({ events }: { events: NaturalEvent[] }) {
  const [hovered, setHovered] = useState<NaturalEvent | null>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  // Captured once per mount: the timeline is re-created whenever its tab opens
  const [nowMs] = useState(() => Date.now())
  const startMs = nowMs - 20 * 24 * 60 * 60 * 1000

  const categories = useMemo(() => {
    const ids = Array.from(new Set(events.map(e => e.categoryId)))
    return ids.filter(id => CAT[id]).sort((a, b) => {
      const ca = events.filter(e => e.categoryId === a).length
      const cb = events.filter(e => e.categoryId === b).length
      return cb - ca
    })
  }, [events])

  const toXPct = (dateStr: string) => {
    const t = Math.max(startMs, Math.min(nowMs, new Date(dateStr).getTime()))
    return ((t - startMs) / (nowMs - startMs)) * 100
  }

  const dayLabels = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => {
      const t = startMs + ((i + 1) / 5) * (nowMs - startMs)
      const d = new Date(t)
      return { label: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), pct: ((i + 1) / 5) * 100 }
    })
  }, [startMs, nowMs])

  return (
    <div
      style={{
        position: 'absolute', inset: 0,
        background: '#06080f',
        borderRadius: 10,
        border: '1px solid rgba(255,255,255,0.06)',
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)',
        backgroundSize: '100% calc(100% / ' + (categories.length || 1) + ')',
        overflow: 'hidden',
        padding: '12px 16px 32px 128px',
      }}
      onMouseMove={e => setMousePos({ x: e.clientX, y: e.clientY })}
    >
      {/* Category rows */}
      {categories.map((catId, idx) => {
        const cfg = catCfg(catId)
        const catEvents = events.filter(e => e.categoryId === catId)
        const rowPct = ((idx + 0.5) / categories.length) * 100

        return (
          <div key={catId} style={{ position: 'absolute', left: 128, right: 16, top: `${rowPct}%`, transform: 'translateY(-50%)' }}>
            {/* Label */}
            <div style={{ position: 'absolute', left: -122, width: 112, textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
              <span style={{ fontSize: 12 }}>{cfg.icon}</span>
              <span style={{ fontSize: 10, color: cfg.color, opacity: 0.85, whiteSpace: 'nowrap' }}>{cfg.label}</span>
            </div>

            {/* Row line */}
            <div style={{ height: 1, background: cfg.color + '18', width: '100%', position: 'relative' }}>
              {/* Events */}
              {catEvents.map(evt => (
                <div
                  key={evt.id}
                  onMouseEnter={() => setHovered(evt)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    position: 'absolute',
                    left: `${toXPct(evt.date)}%`,
                    top: -5,
                    width: 10, height: 10,
                    borderRadius: '50%',
                    background: cfg.color,
                    opacity: hovered?.id === evt.id ? 1 : 0.65,
                    transform: 'translateX(-50%)',
                    cursor: 'pointer',
                    boxShadow: hovered?.id === evt.id ? `0 0 8px ${cfg.color}` : 'none',
                    transition: 'opacity 0.15s, box-shadow 0.15s',
                    zIndex: 2,
                  }}
                />
              ))}
            </div>
          </div>
        )
      })}

      {/* Time axis */}
      <div style={{ position: 'absolute', bottom: 8, left: 128, right: 16 }}>
        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', width: '100%', position: 'relative' }}>
          {dayLabels.map(({ label, pct }) => (
            <div key={label} style={{ position: 'absolute', left: `${pct}%`, transform: 'translateX(-50%)', top: 4 }}>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>{label}</span>
            </div>
          ))}
          <div style={{ position: 'absolute', left: 0, top: 4 }}>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>−20d</span>
          </div>
          <div style={{ position: 'absolute', right: 0, top: 4 }}>
            <span style={{ fontSize: 9, color: `${ACCENT}80` }}>agora</span>
          </div>
        </div>
      </div>

      {/* Hover tooltip */}
      {hovered && (
        <div style={{
          position: 'fixed',
          left: mousePos.x + 12,
          top: mousePos.y - 60,
          zIndex: 50,
          background: '#06080f',
          border: `1px solid ${catCfg(hovered.categoryId).color}40`,
          borderRadius: 8,
          padding: '8px 12px',
          minWidth: 200,
          maxWidth: 260,
          pointerEvents: 'none',
          boxShadow: '0 8px 24px rgba(0,0,0,0.7)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 14 }}>{catCfg(hovered.categoryId).icon}</span>
            <span style={{ fontSize: 11, color: catCfg(hovered.categoryId).color, fontWeight: 600 }}>{catCfg(hovered.categoryId).label}</span>
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 1.4 }}>{hovered.title}</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>{formatRelativeTime(Math.floor(new Date(hovered.date).getTime() / 1000))}</div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Categories grid + contextual detail sections
// ---------------------------------------------------------------------------
function CategoriesView({ events }: { events: NaturalEvent[] }) {
  const categoryGroups = useMemo(() => {
    const groups: Record<string, NaturalEvent[]> = {}
    events.forEach(e => {
      if (!groups[e.categoryId]) groups[e.categoryId] = []
      groups[e.categoryId].push(e)
    })
    return Object.entries(groups)
      .sort(([, a], [, b]) => b.length - a.length)
      .map(([id, evts]) => ({
        id,
        cfg: catCfg(id),
        count: evts.length,
        latest: evts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0],
      }))
  }, [events])

  // Top fires by area (need magnitude in acres or hectares)
  const topFires = useMemo(() => {
    return events
      .filter(e => e.categoryId === 'wildfires' && e.magnitude != null)
      .map(e => ({
        ...e,
        acres: e.magnitudeUnit === 'hectare'
          ? (e.magnitude! * 2.471)
          : e.magnitude!,
      }))
      .sort((a, b) => b.acres - a.acres)
      .slice(0, 7)
  }, [events])

  // Active storms with intensity
  const storms = useMemo(() => {
    return events
      .filter(e => e.categoryId === 'severeStorms')
      .map(e => ({
        ...e,
        cat: e.magnitude ? stormCategory(e.magnitude) : stormCategory(0),
      }))
      .sort((a, b) => (b.magnitude ?? 0) - (a.magnitude ?? 0))
  }, [events])

  const maxAcres = topFires[0]?.acres ?? 1

  return (
    <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', padding: '4px 4px 16px 4px' }}>

      {/* Category cards grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
        gap: 8,
        marginBottom: (topFires.length > 0 || storms.length > 0) ? 16 : 0,
      }}>
        {categoryGroups.map(({ id, cfg, count, latest }) => (
          <motion.div
            key={id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ background: cfg.color + '0c', border: `1px solid ${cfg.color}28`, borderRadius: 12, padding: '10px 12px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 20 }}>{cfg.icon}</span>
              <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'monospace', color: cfg.color, background: cfg.color + '18', padding: '1px 7px', borderRadius: 99 }}>{count}</span>
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: 3 }}>{cfg.label}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
              {latest.title}
            </div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.18)', marginTop: 5 }}>
              {formatRelativeTime(Math.floor(new Date(latest.date).getTime() / 1000))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* 🔥 Fire ranking by area */}
      {topFires.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>🔥</span> Maiores Incêndios Ativos
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {topFires.map((fire, i) => {
              const pct = (fire.acres / maxAcres) * 100
              const label = fire.acres >= 1000
                ? `${(fire.acres / 1000).toFixed(1)}k ac`
                : `${fire.acres.toFixed(0)} ac`
              return (
                <motion.div
                  key={fire.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace', width: 14, textAlign: 'right', flexShrink: 0 }}>{i + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)', marginBottom: 2, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                      {fire.title}
                    </div>
                    <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: `linear-gradient(90deg, #f9731640, #f97316)`,
                        borderRadius: 99,
                      }} />
                    </div>
                  </div>
                  <span style={{ fontSize: 10, color: '#f97316', fontFamily: 'monospace', flexShrink: 0, minWidth: 50, textAlign: 'right' }}>{label}</span>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {/* 🌀 Storm intensity */}
      {storms.length > 0 && (
        <div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>🌀</span> Tempestades Ativas
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {storms.map(storm => (
              <motion.div
                key={storm.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: storm.cat.color + '0c',
                  border: `1px solid ${storm.cat.color}25`,
                  borderRadius: 8, padding: '7px 10px',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: 600, marginBottom: 2 }}>{storm.title}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
                    {formatRelativeTime(Math.floor(new Date(storm.date).getTime() / 1000))}
                    {storm.track.length > 1 && <span style={{ color: storm.cat.color + '99', marginLeft: 6 }}>· {storm.track.length} posições registradas</span>}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: storm.cat.color, fontFamily: 'monospace' }}>{storm.magnitude} kts</div>
                  <div style={{ fontSize: 9, color: storm.cat.color + 'aa', marginTop: 1 }}>{storm.cat.short} · {storm.cat.label}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}


// ---------------------------------------------------------------------------
// Right feed column
// ---------------------------------------------------------------------------
function EventFeed({ events, selectedEventId, onEventClick }: {
  events: NaturalEvent[]
  selectedEventId: string | null
  onEventClick: (e: NaturalEvent) => void
}) {
  const sorted = useMemo(
    () => [...events].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [events],
  )

  return (
    <div className="flex flex-col gap-0.5 overflow-y-auto flex-1 min-h-0 pr-0.5">
      {sorted.map(evt => {
        const cfg = catCfg(evt.categoryId)
        const isSelected = evt.id === selectedEventId
        return (
          <motion.div
            key={evt.id}
            initial={{ opacity: 0, x: 6 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => onEventClick(evt)}
            className="flex items-start gap-2 py-1.5 px-2 rounded-lg cursor-pointer transition-colors group flex-shrink-0"
            style={{
              background: isSelected ? cfg.color + '18' : undefined,
              borderLeft: isSelected ? `2px solid ${cfg.color}` : '2px solid transparent',
            }}
          >
            <span className="text-base leading-none mt-0.5 flex-shrink-0">{cfg.icon}</span>
            <div className="flex-1 min-w-0">
              <div
                className="text-[11px] leading-tight line-clamp-2"
                style={{ color: isSelected ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.65)' }}
              >
                {evt.country ? `${evt.country} — ${evt.title}` : evt.title}
              </div>
              <div className="text-[10px] mt-0.5 flex items-center gap-1.5 flex-wrap" style={{ color: cfg.color + 'aa' }}>
                <span>{cfg.label}</span>
                <span className="text-white/20">·</span>
                <span>{formatRelativeTime(Math.floor(new Date(evt.date).getTime() / 1000))}</span>
                {evt.alertLevel && evt.alertLevel !== 'Green' && (
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: ALERT_COLOR[evt.alertLevel] + '20', color: ALERT_COLOR[evt.alertLevel], border: `1px solid ${ALERT_COLOR[evt.alertLevel]}40` }}
                  >
                    {evt.alertLevel}
                  </span>
                )}
                {evt.sourceUrl && (
                  <a
                    href={evt.sourceUrl}
                    target="_blank"
                    rel="noopener"
                    onClick={e => e.stopPropagation()}
                    className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: cfg.color + '99', fontSize: 10 }}
                  >↗</a>
                )}
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main widget
// ---------------------------------------------------------------------------
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
    return top ? { id: top[0], count: top[1], cfg: catCfg(top[0]) } : null
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
              style={{ background: magColor(maxQuake.magnitude) + '10', borderColor: magColor(maxQuake.magnitude) + '35' }}>
              <span className="text-[10px] uppercase tracking-widest leading-none" style={{ color: magColor(maxQuake.magnitude) + 'aa' }}>Maior M</span>
              <span className="text-[22px] font-mono font-bold leading-none mt-1.5" style={{ color: magColor(maxQuake.magnitude) }}>
                {maxQuake.magnitude.toFixed(1)}
              </span>
              <span className="text-[10px] mt-1 leading-none truncate" style={{ color: magColor(maxQuake.magnitude) + '80' }}>
                {maxQuake.place.split(',')[0]}
              </span>
            </div>
          )}

          {lastEvent && (
            <div className="flex-1 flex flex-col justify-between px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] min-w-0">
              <span className="text-[10px] uppercase tracking-widest text-white/25 leading-none">Último Evento</span>
              <span className="text-[12px] text-white/70 leading-tight mt-1.5 line-clamp-2">{lastEvent.title}</span>
              <span className="text-[10px] mt-1 leading-none" style={{ color: catCfg(lastEvent.categoryId).color + 'aa' }}>
                {catCfg(lastEvent.categoryId).icon} {formatRelativeTime(Math.floor(new Date(lastEvent.date).getTime() / 1000))}
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
              const cfg = catCfg(evt.categoryId)
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
            <div className="flex gap-1 flex-shrink-0">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className="px-3 py-1 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: activeTab === tab.id ? ACCENT + '20' : 'transparent',
                    color: activeTab === tab.id ? ACCENT : 'rgba(255,255,255,0.35)',
                    border: `1px solid ${activeTab === tab.id ? ACCENT + '50' : 'transparent'}`,
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Panel area */}
            <div className="flex-1 min-h-0" style={{ position: 'relative' }}>

              {/* Globe — keep in DOM once visited (canvas survives opacity toggle) */}
              {globeEverVisited && (
                <div style={{
                  position: 'absolute', inset: 0,
                  opacity: activeTab === 'globe' ? 1 : 0,
                  pointerEvents: activeTab === 'globe' ? 'auto' : 'none',
                  transition: 'opacity 0.2s ease',
                }}>
                  <GlobeView events={events} selectedEvent={selectedEvent} onEventClick={handleEventClick} onClearSelection={handleClearSelection} />
                </div>
              )}

              {/* Timeline */}
              <div style={{
                position: 'absolute', inset: 0,
                opacity: activeTab === 'timeline' ? 1 : 0,
                pointerEvents: activeTab === 'timeline' ? 'auto' : 'none',
                transition: 'opacity 0.2s ease',
              }}>
                <TimelineView events={events} />
              </div>

              {/* Categories */}
              <div style={{
                position: 'absolute', inset: 0,
                opacity: activeTab === 'categories' ? 1 : 0,
                pointerEvents: activeTab === 'categories' ? 'auto' : 'none',
                transition: 'opacity 0.2s ease',
              }}>
                <CategoriesView events={events} />
              </div>

              {/* Seismic — USGS earthquake data */}
              <div style={{
                position: 'absolute', inset: 0,
                opacity: activeTab === 'seismic' ? 1 : 0,
                pointerEvents: activeTab === 'seismic' ? 'auto' : 'none',
                transition: 'opacity 0.2s ease',
              }}>
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
