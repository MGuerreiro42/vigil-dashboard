import { useEffect, useCallback, useMemo } from 'react'
import { useGlobe, GLOBE_TEXTURE_URL } from '@/hooks/use-globe'
import type { ISSPosition, ISSFuturePosition } from '@/features/iss/types'
import { ACCENT, formatAltitude, formatCoordinate, formatVelocity } from '@/features/iss/lib/iss-display'

type GlobePt = { id: string; lat: number; lng: number; _opacity: number }
type GlobePath = { points: [number, number][]; color: string; strokeWidth: number; dashed?: boolean }

const pathDashLength = (path: object) => ((path as GlobePath).dashed ? 0.05 : 1)
const pathDashGap = (path: object) => ((path as GlobePath).dashed ? 0.03 : 0)

export function ISSGlobe({
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
  const { containerRef, globeRef, Globe, size } = useGlobe()

  // Follow ISS whenever position changes (if enabled)
  const lat = position?.lat
  const lng = position?.lng
  useEffect(() => {
    if (lat == null || lng == null || !globeRef.current || !followISS) return
    globeRef.current.pointOfView({ lat, lng, altitude: compact ? 2.4 : 2.0 }, 800)
  }, [lat, lng, followISS, compact, globeRef])

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

  // A new array each render would make the globe rebuild every path
  const paths = useMemo(() => [...trailLinePaths, ...futurePaths], [trailLinePaths, futurePaths])

  const getTooltip = useCallback((pt: object) => {
    const p = pt as GlobePt
    if (p.id === 'iss' && position) {
      return `
        <div style="background:#07090f;border:1px solid ${ACCENT}45;border-radius:10px;padding:9px 13px;font-family:system-ui;min-width:155px">
          <div style="font-size:12px;font-weight:700;color:${ACCENT};margin-bottom:6px">🛸 ISS</div>
          <div style="font-size:11px;color:rgba(255,255,255,0.75);font-family:monospace">${formatCoordinate(position.lat, 'N', 'S')}</div>
          <div style="font-size:11px;color:rgba(255,255,255,0.75);font-family:monospace">${formatCoordinate(position.lng, 'E', 'W')}</div>
          <div style="font-size:10px;color:rgba(255,255,255,0.38);margin-top:5px">${formatAltitude(position.altitude)} · ${formatVelocity(position.velocity)}</div>
        </div>`
    }
    if (p.id === 'solar' && position) {
      return `
        <div style="background:#07090f;border:1px solid #fbbf2445;border-radius:10px;padding:8px 12px;font-family:system-ui">
          <div style="font-size:12px;font-weight:700;color:#fbbf24;margin-bottom:5px">☀ Ponto Subsolar</div>
          <div style="font-size:10px;color:rgba(255,255,255,0.55)">O Sol está diretamente no zênite aqui</div>
          <div style="font-size:10px;color:rgba(255,255,255,0.38);margin-top:4px;font-family:monospace">${formatCoordinate(position.solarLat, 'N', 'S')} ${formatCoordinate(position.solarLng, 'E', 'W')}</div>
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
          <div style="font-size:10px;color:rgba(255,255,255,0.4)">${formatCoordinate(fp.lat, 'N', 'S')} ${formatCoordinate(fp.lng, 'E', 'W')}</div>
          <div style="font-size:10px;color:rgba(255,255,255,0.3);margin-top:3px">${vis}</div>
        </div>`
    }
    return ''
  }, [position, futurePath])

  return (
    <div
      ref={containerRef}
      style={{ position: 'absolute', inset: 0, borderRadius: 8, overflow: 'hidden', background: '#03050e' }}
    >
      {Globe && size.width > 0 ? (
        <Globe
          ref={globeRef}
          width={size.width}
          height={size.height}
          backgroundColor="rgba(0,0,0,0)"
          globeImageUrl={GLOBE_TEXTURE_URL}
          atmosphereColor="rgba(34,211,238,0.14)"
          atmosphereAltitude={0.16}
          pointsData={allPoints}
          pointLat="lat"
          pointLng="lng"
          pointColor={getColor}
          pointRadius={getRadius}
          pointAltitude={0.012}
          pointLabel={getTooltip}
          pathsData={paths}
          pathPoints="points"
          pathColor="color"
          pathStroke="strokeWidth"
          pathDashLength={pathDashLength}
          pathDashGap={pathDashGap}
          pathPointAlt={0.008}
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
