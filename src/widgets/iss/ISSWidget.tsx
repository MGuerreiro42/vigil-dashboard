import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WidgetShell } from '@/components/layout/WidgetShell'
import { useISSPosition, useISSCoordinates, useISSFuturePath, useISSTLE } from '@/api/iss'
import type { ISSPosition, ISSFuturePosition, ISSTLE } from '@/api/types/iss'

const ACCENT = '#22d3ee'
const TRAIL_MAX = 45
type FocusTab = 'now' | 'trajectory' | 'tle'

// ─── Utilities ────────────────────────────────────────────────────────────────

function fmtCoord(val: number, pos: string, neg: string) {
  return `${Math.abs(val).toFixed(3)}° ${val >= 0 ? pos : neg}`
}
function fmtAlt(km: number) { return `${km.toFixed(1)} km` }
function fmtVel(kmh: number) { return `${(kmh / 3600).toFixed(2)} km/s` }

/** ISO 3166-1 alpha-2 → Unicode flag emoji */
function countryFlag(code: string): string {
  return code.toUpperCase().split('').map(
    (c) => String.fromCodePoint(c.charCodeAt(0) - 65 + 0x1f1e6),
  ).join('')
}

/** Convert TLE epoch day-of-year to a readable date string */
function epochToDate(year: number, day: number): string {
  const d = new Date(Date.UTC(year, 0, 1))
  d.setUTCDate(d.getUTCDate() + Math.floor(day) - 1)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })
}

/** Orbital period in minutes from mean motion (rev/day) */
function orbitalPeriod(meanMotion: number): number {
  return 24 * 60 / meanMotion
}

// ─── Globe ────────────────────────────────────────────────────────────────────

type GlobePt = { id: string; lat: number; lng: number; _opacity: number }
type GlobePath = { points: [number, number][]; color: string; strokeWidth: number; dashed?: boolean }

function ISSGlobe({
  position,
  trail,
  futurePath,
  followISS,
  compact,
}: {
  position: ISSPosition | null
  trail: Array<{ lat: number; lng: number }>
  futurePath: ISSFuturePosition[]
  followISS: boolean
  compact: boolean
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [dims, setDims] = useState({ w: 0, h: 0 })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [Globe, setGlobe] = useState<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globeRef = useRef<any>(null)

  useEffect(() => {
    import('react-globe.gl').then((mod) => setGlobe(() => mod.default))
  }, [])

  useEffect(() => {
    if (!wrapRef.current) return
    const ro = new ResizeObserver(([e]) => {
      setDims({ w: e.contentRect.width, h: e.contentRect.height })
    })
    ro.observe(wrapRef.current)
    return () => ro.disconnect()
  }, [])

  // Follow ISS whenever position changes (if enabled)
  const lat = position?.lat
  const lng = position?.lng
  useEffect(() => {
    if (lat == null || lng == null || !globeRef.current || !followISS) return
    globeRef.current.pointOfView({ lat, lng, altitude: compact ? 2.4 : 2.0 }, 800)
  }, [lat, lng, followISS, compact])

  // Points: past trail + ISS marker + solar sub-point
  const allPoints: GlobePt[] = useMemo(() => {
    const pts: GlobePt[] = trail.map((pt, i) => ({
      id: `trail_${i}`,
      lat: pt.lat,
      lng: pt.lng,
      _opacity: 0.10 + (i / Math.max(trail.length - 1, 1)) * 0.55,
    }))
    if (position) {
      pts.push({ id: 'iss', lat: position.lat, lng: position.lng, _opacity: 1 })
      // Sub-solar point
      pts.push({ id: 'solar', lat: position.solarLat, lng: position.solarLng, _opacity: 0.9 })
      // Future waypoints (small dots)
      futurePath.forEach((fp, i) => {
        pts.push({ id: `future_${i}`, lat: fp.lat, lng: fp.lng, _opacity: 0.25 })
      })
    }
    return pts
  }, [trail, position, futurePath])

  const getColor = useCallback((pt: object) => {
    const p = pt as GlobePt
    if (p.id === 'iss') return '#ffffff'
    if (p.id === 'solar') return '#fbbf24'
    if (p.id.startsWith('future_')) {
      const idx = parseInt(p.id.split('_')[1])
      const fp = futurePath[idx]
      return fp?.visibility === 'daylight' ? '#f59e0b88' : '#818cf888'
    }
    const a = Math.round(p._opacity * 255).toString(16).padStart(2, '0')
    return `${ACCENT}${a}`
  }, [futurePath])

  const getRadius = useCallback((pt: object) => {
    const p = pt as GlobePt
    if (p.id === 'iss') return 0.55
    if (p.id === 'solar') return 0.9
    if (p.id.startsWith('future_')) return 0.22
    return 0.18 + p._opacity * 0.18
  }, [])

  // Future path arcs (line segments between waypoints, colored by day/night)
  const futurePaths: GlobePath[] = useMemo(() => {
    if (!position || futurePath.length === 0) return []
    // Start arc from current ISS position
    const allWaypoints = [
      { lat: position.lat, lng: position.lng, visibility: position.visibility },
      ...futurePath,
    ]
    return allWaypoints.slice(0, -1).map((wp, i) => {
      const next = allWaypoints[i + 1]
      const color = wp.visibility === 'daylight' ? '#f59e0b99' : '#818cf899'
      return {
        points: [[wp.lat, wp.lng], [next.lat, next.lng]] as [number, number][],
        color,
        strokeWidth: 1.2,
        dashed: true,
      }
    })
  }, [position, futurePath])

  // Trail arc — fading line connecting recent positions (visible in both compact and focused)
  const trailLinePaths: GlobePath[] = useMemo(() => {
    const recent = trail.slice(-(compact ? 12 : 30))
    if (recent.length < 2) return []
    return recent.slice(0, -1).map((pt, i) => {
      const opacity = 0.08 + (i / Math.max(recent.length - 2, 1)) * 0.52
      const alpha = Math.round(opacity * 255).toString(16).padStart(2, '0')
      return {
        points: [[pt.lat, pt.lng], [recent[i + 1].lat, recent[i + 1].lng]] as [number, number][],
        color: `${ACCENT}${alpha}`,
        strokeWidth: compact ? 0.9 : 1.1,
        dashed: false,
      }
    })
  }, [trail, compact])

  const getTooltip = useCallback((pt: object) => {
    const p = pt as GlobePt
    if (p.id === 'iss' && position) {
      return `
        <div style="background:#07090f;border:1px solid ${ACCENT}45;border-radius:10px;padding:9px 13px;font-family:system-ui;min-width:155px">
          <div style="font-size:12px;font-weight:700;color:${ACCENT};margin-bottom:6px">🛸 ISS</div>
          <div style="font-size:11px;color:rgba(255,255,255,0.75);font-family:monospace">${fmtCoord(position.lat, 'N', 'S')}</div>
          <div style="font-size:11px;color:rgba(255,255,255,0.75);font-family:monospace">${fmtCoord(position.lng, 'E', 'W')}</div>
          <div style="font-size:10px;color:rgba(255,255,255,0.38);margin-top:5px">${fmtAlt(position.altitude)} · ${fmtVel(position.velocity)}</div>
        </div>`
    }
    if (p.id === 'solar' && position) {
      return `
        <div style="background:#07090f;border:1px solid #fbbf2445;border-radius:10px;padding:8px 12px;font-family:system-ui">
          <div style="font-size:12px;font-weight:700;color:#fbbf24;margin-bottom:5px">☀ Ponto Subsolar</div>
          <div style="font-size:10px;color:rgba(255,255,255,0.55)">O Sol está diretamente no zênite aqui</div>
          <div style="font-size:10px;color:rgba(255,255,255,0.38);margin-top:4px;font-family:monospace">${fmtCoord(position.solarLat, 'N', 'S')} ${fmtCoord(position.solarLng, 'E', 'W')}</div>
        </div>`
    }
    if (p.id.startsWith('future_')) {
      const idx = parseInt(p.id.split('_')[1])
      const fp = futurePath[idx]
      if (!fp) return ''
      const minsFromNow = Math.round((fp.timestamp - Date.now() / 1000) / 60)
      const vis = fp.visibility === 'daylight' ? '☀ Luz do dia' : '🌑 Eclipsada'
      return `
        <div style="background:#07090f;border:1px solid #ffffff20;border-radius:8px;padding:7px 11px;font-family:system-ui">
          <div style="font-size:10px;font-weight:700;color:rgba(255,255,255,0.7);margin-bottom:4px">+${minsFromNow} min</div>
          <div style="font-size:10px;color:rgba(255,255,255,0.4)">${fmtCoord(fp.lat, 'N', 'S')} ${fmtCoord(fp.lng, 'E', 'W')}</div>
          <div style="font-size:10px;color:rgba(255,255,255,0.3);margin-top:3px">${vis}</div>
        </div>`
    }
    return ''
  }, [position, futurePath])

  return (
    <div
      ref={wrapRef}
      style={{ position: 'absolute', inset: 0, borderRadius: 8, overflow: 'hidden', background: '#03050e' }}
    >
      {Globe && dims.w > 0 ? (
        <Globe
          ref={globeRef}
          width={dims.w}
          height={dims.h}
          backgroundColor="rgba(0,0,0,0)"
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
          atmosphereColor="rgba(34,211,238,0.14)"
          atmosphereAltitude={0.16}
          pointsData={allPoints}
          pointLat="lat"
          pointLng="lng"
          pointColor={getColor}
          pointRadius={getRadius}
          pointAltitude={0.012}
          pointLabel={getTooltip}
          pathsData={[...trailLinePaths, ...futurePaths]}
          pathPoints="points"
          pathColor="color"
          pathStroke="strokeWidth"
          pathDashLength={(p: object) => (p as GlobePath).dashed ? 0.05 : 1}
          pathDashGap={(p: object) => (p as GlobePath).dashed ? 0.03 : 0}
          pathAltitude={0.008}
          onGlobeReady={() => {
            if (!globeRef.current) return
            globeRef.current.controls().autoRotate = false
            globeRef.current.controls().enableZoom = true
            if (position) {
              globeRef.current.pointOfView(
                { lat: position.lat, lng: position.lng, altitude: compact ? 2.4 : 2.0 },
                0,
              )
            }
          }}
        />
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>
          Carregando globo…
        </div>
      )}
    </div>
  )
}

// ─── Live pulse badge ─────────────────────────────────────────────────────────

function LivePulse() {
  return (
    <motion.div
      style={{
        position: 'absolute', top: 8, right: 8,
        display: 'flex', alignItems: 'center', gap: 4,
        pointerEvents: 'none',
      }}
    >
      <motion.div
        animate={{ opacity: [1, 0.3, 1], scale: [1, 1.4, 1] }}
        transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        style={{ width: 6, height: 6, borderRadius: '50%', background: ACCENT, boxShadow: `0 0 6px ${ACCENT}` }}
      />
      <span style={{ fontSize: 9, color: ACCENT + 'bb', letterSpacing: '0.05em' }}>LIVE</span>
    </motion.div>
  )
}

// ─── Compact overlay ──────────────────────────────────────────────────────────

function CompactOverlay({
  position,
  countryCode,
  timezoneId,
  coordsLoading,
}: {
  position: ISSPosition | null
  countryCode: string | null | undefined
  timezoneId: string | undefined
  coordsLoading: boolean
}) {
  if (!position) return null
  const daylight = position.visibility === 'daylight'

  const locationLabel = useMemo(() => {
    if (coordsLoading) return '…'
    if (countryCode) return `${countryFlag(countryCode)} ${countryCode}`
    if (timezoneId) {
      // Extract ocean/region from timezone like "Etc/GMT+3" or "Indian/Christmas"
      const parts = timezoneId.split('/')
      if (parts[0] === 'Etc') return '🌊 Alto Mar'
      return `🌊 ${parts[0]}`
    }
    return '🌊 Alto Mar'
  }, [countryCode, timezoneId, coordsLoading])

  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      padding: '28px 10px 8px',
      background: 'linear-gradient(to top, rgba(3,5,14,0.93) 55%, transparent)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
      pointerEvents: 'none',
    }}>
      <div>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>
          sobrevoo
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.80)', fontWeight: 600, marginBottom: 2 }}>
          {locationLabel}
        </div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>
          {fmtCoord(position.lat, 'N', 'S')}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
        <span style={{
          fontSize: 9, fontWeight: 700,
          color: daylight ? '#fbbf24' : '#818cf8',
          background: daylight ? 'rgba(251,191,36,0.12)' : 'rgba(129,140,248,0.12)',
          border: `1px solid ${daylight ? 'rgba(251,191,36,0.25)' : 'rgba(129,140,248,0.25)'}`,
          padding: '2px 7px', borderRadius: 99,
        }}>
          {daylight ? '☀ dia' : '🌑 noite'}
        </span>
        <span style={{ fontSize: 10, color: ACCENT, fontFamily: 'monospace' }}>
          ↑ {fmtAlt(position.altitude)}
        </span>
      </div>
    </div>
  )
}

// ─── Focused: Stats bar ───────────────────────────────────────────────────────

function StatsBar({
  position,
  followISS,
  onToggleFollow,
  activeTab,
  onTabChange,
}: {
  position: ISSPosition | null
  followISS: boolean
  onToggleFollow: () => void
  activeTab: FocusTab
  onTabChange: (t: FocusTab) => void
}) {
  if (!position) return null

  const tabs: { id: FocusTab; label: string }[] = [
    { id: 'now', label: '📡 Agora' },
    { id: 'trajectory', label: '🛤 Trajetória' },
    { id: 'tle', label: '🔭 TLE' },
  ]

  return (
    <div className="flex items-center gap-2 mb-3 flex-shrink-0 flex-wrap">
      {/* Quick stats */}
      <div className="flex flex-col px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06]">
        <span className="text-[9px] uppercase tracking-widest text-white/25 leading-none">Altitude</span>
        <span className="text-[17px] font-mono font-bold leading-none mt-1.5" style={{ color: ACCENT }}>
          {position.altitude.toFixed(0)}
        </span>
        <span className="text-[9px] text-white/20 mt-0.5 leading-none">km</span>
      </div>
      <div className="flex flex-col px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06]">
        <span className="text-[9px] uppercase tracking-widest text-white/25 leading-none">Velocidade</span>
        <span className="text-[17px] font-mono font-bold leading-none mt-1.5" style={{ color: '#10b981' }}>
          {(position.velocity / 3600).toFixed(2)}
        </span>
        <span className="text-[9px] text-white/20 mt-0.5 leading-none">km/s</span>
      </div>
      <div className="flex flex-col px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06]">
        <span className="text-[9px] uppercase tracking-widest text-white/25 leading-none">Footprint</span>
        <span className="text-[17px] font-mono font-bold text-white/70 leading-none mt-1.5">
          {Math.round(position.footprint / 1000)}k
        </span>
        <span className="text-[9px] text-white/20 mt-0.5 leading-none">km visíveis</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 ml-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="text-[11px] px-3 py-1.5 rounded-lg transition-all"
            style={{
              background: activeTab === tab.id ? `${ACCENT}18` : 'rgba(255,255,255,0.04)',
              color: activeTab === tab.id ? ACCENT : 'rgba(255,255,255,0.4)',
              border: `1px solid ${activeTab === tab.id ? ACCENT + '35' : 'rgba(255,255,255,0.08)'}`,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Follow toggle */}
      <button
        onClick={onToggleFollow}
        className="flex items-center gap-1.5 text-[11px] px-3 py-2 rounded-xl transition-all ml-auto"
        style={{
          background: followISS ? `${ACCENT}15` : 'rgba(255,255,255,0.05)',
          color: followISS ? ACCENT : 'rgba(255,255,255,0.35)',
          border: `1px solid ${followISS ? ACCENT + '35' : 'rgba(255,255,255,0.1)'}`,
        }}
      >
        📡 {followISS ? 'Seguindo' : 'Livre'}
      </button>
    </div>
  )
}

// ─── Focused side panel: "Agora" tab ──────────────────────────────────────────

function NowPanel({
  position,
  countryCode,
  timezoneId,
  offset,
  coordsLoading,
  updateCount,
}: {
  position: ISSPosition | null
  countryCode: string | null | undefined
  timezoneId: string | undefined
  offset: number | undefined
  coordsLoading: boolean
  updateCount: number
}) {
  const daylight = position?.visibility === 'daylight'

  const locationLabel = useMemo(() => {
    if (coordsLoading || countryCode === undefined) return '…'
    if (countryCode) return `${countryFlag(countryCode)} ${countryCode}`
    return '🌊 Alto Mar'
  }, [countryCode, coordsLoading])

  const tzLabel = timezoneId
    ? `${timezoneId.replace('_', ' ')} (UTC${offset != null && offset >= 0 ? '+' : ''}${offset ?? ''})`
    : '—'

  if (!position) return null

  const rows = [
    { label: 'Latitude',   value: fmtCoord(position.lat, 'N', 'S'),  color: ACCENT },
    { label: 'Longitude',  value: fmtCoord(position.lng, 'E', 'W'),  color: ACCENT },
    { label: 'Altitude',   value: fmtAlt(position.altitude),           color: '#a855f7' },
    { label: 'Velocidade', value: fmtVel(position.velocity),           color: '#10b981' },
    { label: 'Footprint',  value: `${Math.round(position.footprint).toLocaleString('en')} km`, color: '#f59e0b' },
    { label: 'Ponto Solar ☀', value: `${fmtCoord(position.solarLat, 'N', 'S')}`, color: '#fbbf24' },
    { label: '',           value: fmtCoord(position.solarLng, 'E', 'W'), color: '#fbbf24' },
  ]

  return (
    <div style={{ width: 185, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto' }}>
      {/* Visibility */}
      <motion.div
        key={String(daylight)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          padding: '9px 12px', borderRadius: 10, textAlign: 'center',
          background: daylight ? 'rgba(251,191,36,0.07)' : 'rgba(129,140,248,0.07)',
          border: `1px solid ${daylight ? 'rgba(251,191,36,0.2)' : 'rgba(129,140,248,0.2)'}`,
        }}
      >
        <div style={{ fontSize: 22, marginBottom: 4 }}>{daylight ? '☀️' : '🌑'}</div>
        <div style={{ fontSize: 11, fontWeight: 700, color: daylight ? '#fbbf24' : '#818cf8' }}>
          {daylight ? 'Luz do dia' : 'Eclipsada'}
        </div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', marginTop: 1 }}>visibilidade da ISS</div>
      </motion.div>

      {/* Country / timezone */}
      <div style={{
        padding: '8px 12px', borderRadius: 10,
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
      }}>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.24)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>
          Sobrevoo
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>{locationLabel}</div>
        {timezoneId && (
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 3, lineHeight: 1.4 }}>{tzLabel}</div>
        )}
      </div>

      {/* Telemetry rows */}
      {rows.filter(r => r.label !== '').map(({ label, value, color }) => (
        <div key={label} style={{
          padding: '7px 12px', borderRadius: 10,
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
        }}>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.24)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>
            {label}
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color, fontFamily: 'monospace' }}>{value}</div>
          {/* Show second row for solar lon */}
          {label === 'Ponto Solar ☀' && (
            <div style={{ fontSize: 12, fontWeight: 700, color, fontFamily: 'monospace', marginTop: 2 }}>
              {fmtCoord(position.solarLng, 'E', 'W')}
            </div>
          )}
        </div>
      ))}

      {/* Update counter */}
      <div style={{ textAlign: 'center', paddingTop: 2 }}>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.18)' }}>atualiza a cada 5s</div>
        <div style={{ fontSize: 10, fontFamily: 'monospace', color: ACCENT + '60', marginTop: 2 }}>#{updateCount}</div>
      </div>
    </div>
  )
}

// ─── Focused side panel: "Trajetória" tab ─────────────────────────────────────

function TrajectoryPanel({ futurePath, position }: { futurePath: ISSFuturePosition[]; position: ISSPosition | null }) {
  if (futurePath.length === 0) {
    return (
      <div style={{ width: 185, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>Calculando…</div>
      </div>
    )
  }

  const period = 92 // minutes (approximate ISS orbital period)
  const dayCount = futurePath.filter(p => p.visibility === 'daylight').length
  const dayPct = Math.round((dayCount / futurePath.length) * 100)

  return (
    <div style={{ width: 185, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto' }}>
      {/* Orbit summary */}
      <div style={{
        padding: '9px 12px', borderRadius: 10,
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
      }}>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.24)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
          Próxima órbita (~{period} min)
        </div>
        {/* Day/night bar */}
        <div style={{ height: 6, borderRadius: 99, background: '#818cf830', overflow: 'hidden', marginBottom: 6 }}>
          <div style={{ height: '100%', width: `${dayPct}%`, background: 'linear-gradient(90deg, #f59e0b, #fbbf24)', borderRadius: 99 }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
          <span style={{ color: '#fbbf24' }}>☀ {dayPct}% dia</span>
          <span style={{ color: '#818cf8' }}>🌑 {100 - dayPct}% noite</span>
        </div>
      </div>

      {/* Timeline of future positions */}
      <div style={{
        padding: '8px 12px', borderRadius: 10,
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
      }}>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.24)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
          Posições futuras
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {futurePath.map((fp, i) => {
            const minsFromNow = Math.round((fp.timestamp - (position?.timestamp ?? Date.now() / 1000)) / 60)
            const isDaylight = fp.visibility === 'daylight'
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <span style={{ fontSize: 9, color: isDaylight ? '#fbbf24' : '#818cf8', flexShrink: 0 }}>
                  {isDaylight ? '☀' : '🌑'}
                </span>
                <span style={{ fontSize: 9, color: ACCENT, fontFamily: 'monospace', flexShrink: 0, minWidth: 36 }}>
                  +{minsFromNow}m
                </span>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {Math.abs(fp.lat).toFixed(1)}°{fp.lat >= 0 ? 'N' : 'S'} {Math.abs(fp.lng).toFixed(1)}°{fp.lng >= 0 ? 'E' : 'W'}
                </span>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div style={{
        padding: '8px 12px', borderRadius: 10,
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
        fontSize: 10, color: 'rgba(255,255,255,0.35)', lineHeight: 1.6,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <div style={{ width: 20, height: 2, background: '#f59e0b', borderRadius: 1, flexShrink: 0 }} />
          <span>Trajetória em luz do dia</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 20, height: 2, background: '#818cf8', borderRadius: 1, flexShrink: 0 }} />
          <span>Trajetória na sombra</span>
        </div>
      </div>
    </div>
  )
}

// ─── Focused side panel: "TLE" tab ────────────────────────────────────────────

function TLEPanel({ tle }: { tle: ISSTLE | undefined }) {
  if (!tle) {
    return (
      <div style={{ width: 185, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>Carregando TLE…</div>
      </div>
    )
  }

  const period = orbitalPeriod(tle.meanMotion)

  const elements = [
    { label: 'Inclinação',       value: `${tle.inclination.toFixed(4)}°`,        color: ACCENT,     tip: 'Ângulo da órbita em relação ao equador' },
    { label: 'RAAN',             value: `${tle.raan.toFixed(4)}°`,               color: '#a855f7',  tip: 'Ascensão Reta do Nodo Ascendente' },
    { label: 'Excentricidade',   value: tle.eccentricity.toFixed(7),             color: '#10b981',  tip: '0 = órbita perfeitamente circular' },
    { label: 'Arg. Perigeu',     value: `${tle.argPerigee.toFixed(4)}°`,         color: '#f59e0b',  tip: 'Ponto mais baixo da órbita' },
    { label: 'Anomalia Média',   value: `${tle.meanAnomaly.toFixed(4)}°`,        color: '#f97316',  tip: 'Posição na órbita no epoch' },
    { label: 'Mov. Médio',       value: `${tle.meanMotion.toFixed(5)} rev/dia`,  color: '#22d3ee',  tip: `Período: ${period.toFixed(2)} min` },
    { label: 'BSTAR (drag)',     value: tle.bstar.toExponential(3),              color: '#6b7280',  tip: 'Coeficiente de arrasto balístico' },
  ]

  return (
    <div style={{ width: 185, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto' }}>
      {/* Header */}
      <div style={{
        padding: '9px 12px', borderRadius: 10,
        background: 'rgba(168,85,247,0.07)', border: '1px solid rgba(168,85,247,0.2)',
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#a855f7', marginBottom: 2 }}>
          {tle.header}
        </div>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>
          TLE de {epochToDate(tle.epochYear, tle.epochDay)}
        </div>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', marginTop: 1 }}>
          Dia {tle.epochDay.toFixed(5)} de {tle.epochYear}
        </div>
      </div>

      {/* Orbital elements */}
      {elements.map(({ label, value, color, tip }) => (
        <div
          key={label}
          title={tip}
          style={{
            padding: '7px 12px', borderRadius: 10, cursor: 'help',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.24)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>
            {label}
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color, fontFamily: 'monospace' }}>{value}</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.22)', marginTop: 2 }}>{tip}</div>
        </div>
      ))}

      {/* Raw TLE lines */}
      <div style={{
        padding: '8px 10px', borderRadius: 10,
        background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)',
        fontFamily: 'monospace', fontSize: 8, color: 'rgba(255,255,255,0.25)',
        lineHeight: 1.8, wordBreak: 'break-all',
      }}>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, marginBottom: 4 }}>Raw TLE</div>
        <div>{tle.line1}</div>
        <div>{tle.line2}</div>
      </div>
    </div>
  )
}

// ─── Main widget ──────────────────────────────────────────────────────────────

export function ISSWidget({ isFocused = false }: { isFocused?: boolean }) {

  const { data: position, isLoading, error, refetch, dataUpdatedAt } = useISSPosition()
  const { data: coords, isLoading: coordsLoading } = useISSCoordinates(position?.lat, position?.lng)
  const { data: futurePath = [] } = useISSFuturePath(position?.timestamp)
  const { data: tle } = useISSTLE()

  // Accumulated ISS trail
  const trailRef = useRef<Array<{ lat: number; lng: number }>>([])
  const lastTsRef = useRef<number>(0)
  const [trail, setTrail] = useState<Array<{ lat: number; lng: number }>>([])
  const [updateCount, setUpdateCount] = useState(0)
  const [followISS, setFollowISS] = useState(true)
  const [activeTab, setActiveTab] = useState<FocusTab>('now')

  useEffect(() => {
    if (!position || position.timestamp === lastTsRef.current) return
    lastTsRef.current = position.timestamp
    trailRef.current = [...trailRef.current.slice(-(TRAIL_MAX - 1)), { lat: position.lat, lng: position.lng }]
    setTrail([...trailRef.current])
    setUpdateCount((c) => c + 1)
  }, [position])

  useEffect(() => () => { trailRef.current = []; setTrail([]) }, [])

  const handleToggleFollow = useCallback(() => setFollowISS((f) => !f), [])

  const sidePanel = useMemo(() => {
    if (activeTab === 'tle') return <TLEPanel tle={tle} />
    if (activeTab === 'trajectory') return <TrajectoryPanel futurePath={futurePath} position={position ?? null} />
    return (
      <NowPanel
        position={position ?? null}
        countryCode={coords?.countryCode}
        timezoneId={coords?.timezoneId}
        offset={coords?.offset}
        coordsLoading={coordsLoading}
        updateCount={updateCount}
      />
    )
  }, [activeTab, tle, futurePath, position, coords, coordsLoading, updateCount])

  return (
    <WidgetShell
      title="ISS · Estação Espacial"
      icon={<span className={isFocused ? 'text-2xl' : 'text-base'}>🛸</span>}
      isLoading={isLoading && !position}
      error={error}
      onRetry={() => refetch()}
      lastUpdated={dataUpdatedAt || undefined}
      accentColor={ACCENT}
      isFocused={isFocused}
      fillHeight
      isLive
      viewRoute="/iss"
    >
      {/* Stats bar + tabs — focused only */}
      {isFocused && (
        <StatsBar
          position={position ?? null}
          followISS={followISS}
          onToggleFollow={handleToggleFollow}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      )}

      {/* Globe + side panel */}
      <div className="flex-1 min-h-0 flex gap-3">
        <div className="flex-1 min-w-0 relative">
          <ISSGlobe
            position={position ?? null}
            trail={trail}
            futurePath={isFocused ? futurePath : []}
            followISS={followISS}
            compact={!isFocused}
          />
          <LivePulse />
          {!isFocused && (
            <CompactOverlay
              position={position ?? null}
              countryCode={coords?.countryCode}
              timezoneId={coords?.timezoneId}
              coordsLoading={coordsLoading && !coords}
            />
          )}
        </div>

        {/* Side panel — focused only, animated on tab change */}
        {isFocused && (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              style={{ display: 'flex' }}
            >
              {sidePanel}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </WidgetShell>
  )
}
