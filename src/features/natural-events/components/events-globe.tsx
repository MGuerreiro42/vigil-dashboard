import { useEffect, useRef, useMemo, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import type { NaturalEvent } from '@/features/natural-events/types'
import { useGlobe, GLOBE_TEXTURE_URL } from '@/hooks/use-globe'
import { PinnedTooltip } from './pinned-tooltip'
import { categoryStyle, magnitudeRadius } from '@/features/natural-events/lib/event-style'
import { buildGlobeTooltip } from '@/features/natural-events/lib/globe-tooltip'

type GlobePoint = { id: string; lat: number; lng: number; color: string; radius: number }

export function EventsGlobe({ events, selectedEvent, onEventClick, onClearSelection, active }: {
  events: NaturalEvent[]
  selectedEvent: NaturalEvent | null
  onEventClick: (e: NaturalEvent) => void
  onClearSelection: () => void
  active: boolean
}) {
  const { containerRef, globeRef, Globe, size } = useGlobe(active)
  const rotatingRef = useRef(true)

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
  }, [selectedEvent, globeRef])

  // Main event points — magnitude-scaled radius
  const points: GlobePoint[] = useMemo(
    () => events.map(event => {
      const isSelected = selectedEvent?.id === event.id
      return {
        id: event.id,
        lat: event.lat,
        lng: event.lng,
        color: isSelected ? '#ffffff' : categoryStyle(event.categoryId).color,
        radius: isSelected ? magnitudeRadius(event) * 1.4 : magnitudeRadius(event),
      }
    }),
    [events, selectedEvent],
  )

  const handlePointClick = useCallback((point: object) => {
    const globePoint = point as GlobePoint
    const evt = events.find(event => event.id === globePoint.id)
    if (evt) onEventClick(evt)
  }, [events, onEventClick])

  const handleGlobeClick = useCallback(() => {
    if (!globeRef.current) return
    rotatingRef.current = !rotatingRef.current
    globeRef.current.controls().autoRotate = rotatingRef.current
  }, [globeRef])

  const getTooltip = useCallback((point: object) => {
    const globePoint = point as GlobePoint
    if (globePoint.id === selectedEvent?.id) return ''
    const evt = events.find(event => event.id === globePoint.id)
    return evt ? buildGlobeTooltip(evt) : ''
  }, [events, selectedEvent])

  return (
    <div ref={containerRef} style={{ position: 'absolute', inset: 0, background: '#06080f', borderRadius: 10, overflow: 'hidden' }}>
      {Globe && size.width > 0 && (
        <Globe
          ref={globeRef}
          width={size.width}
          height={size.height}
          backgroundColor="rgba(0,0,0,0)"
          globeImageUrl={GLOBE_TEXTURE_URL}
          atmosphereColor="rgba(16,185,129,0.15)"
          atmosphereAltitude={0.18}
          // Main event points
          pointsData={points}
          pointLat="lat"
          pointLng="lng"
          pointColor="color"
          pointAltitude={0.012}
          pointRadius="radius"
          pointLabel={getTooltip}
          onPointClick={handlePointClick}
          onGlobeClick={handleGlobeClick}
          onGlobeReady={() => {
            if (!globeRef.current) return
            globeRef.current.controls().autoRotate = true
            globeRef.current.controls().autoRotateSpeed = 0.4
            globeRef.current.controls().enableZoom = true
          }}
        />
      )}
      {(!Globe || size.width === 0) && (
        <div className="flex items-center justify-center h-full text-fg-subtle text-sm">Carregando globo…</div>
      )}

      {/* Pinned tooltip overlay */}
      <AnimatePresence>
        {selectedEvent && (
          <PinnedTooltip key={selectedEvent.id} evt={selectedEvent} onClose={onClearSelection} />
        )}
      </AnimatePresence>

      <div style={{ position: 'absolute', bottom: 10, right: 12, fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>
        clique no globo · pausa rotação
      </div>
    </div>
  )
}
