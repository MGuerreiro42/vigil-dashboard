import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type * as Leaflet from 'leaflet'
import { DARK_BASEMAP_ATTRIBUTION, DARK_BASEMAP_MAX_ZOOM, DARK_BASEMAP_URL } from '@/lib/map-tiles'
import { WidgetShell } from '@/components/layout/widget-shell'
import { intlLocale } from '@/i18n'
import { DEFAULT_COORDS } from '@/features/weather/api/open-meteo'
import { useRadarFrames } from '@/features/weather/api/rainviewer'
import { useGeoStore } from '@/store/geo-store'

const ACCENT = '#60a5fa'
const RADAR_OPACITY = 0.75
const FRAME_INTERVAL_MS = 600
// RainViewer serves radar tiles up to zoom 7; Leaflet upscales beyond that
const RADAR_MAX_NATIVE_ZOOM = 7

export function RadarWidget() {
  const { t } = useTranslation()
  const coords = useGeoStore((state) => state.coords) ?? DEFAULT_COORDS
  const { data: frames, isLoading, error, refetch, dataUpdatedAt } = useRadarFrames()
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  // WidgetShell mounts the container only after the first load, so the map waits for it
  const [container, setContainer] = useState<HTMLDivElement | null>(null)
  const mapRef = useRef<Leaflet.Map | null>(null)
  const leafletRef = useRef<typeof Leaflet | null>(null)
  const markerRef = useRef<Leaflet.CircleMarker | null>(null)
  const radarLayersRef = useRef(new Map<string, Leaflet.TileLayer>())
  const [ready, setReady] = useState(false)

  const frameCount = frames?.length ?? 0
  // Until the user scrubs, follow the newest frame as new ones arrive
  const frameIndex = selectedIndex === null || selectedIndex >= frameCount ? frameCount - 1 : selectedIndex
  const frame = frames?.[frameIndex]

  useEffect(() => {
    if (!container) return
    let cancelled = false
    const radarLayers = radarLayersRef.current
    let resizeObserver: ResizeObserver | null = null
    import('leaflet').then((leaflet) => {
      if (cancelled || !container || mapRef.current) return
      const map = leaflet.map(container, { zoomControl: false, center: [DEFAULT_COORDS.lat, DEFAULT_COORDS.lng], zoom: 6, maxZoom: 10 })
      leaflet.tileLayer(DARK_BASEMAP_URL, { maxZoom: DARK_BASEMAP_MAX_ZOOM, attribution: DARK_BASEMAP_ATTRIBUTION }).addTo(map)
      leaflet.control.zoom({ position: 'bottomright' }).addTo(map)
      resizeObserver = new ResizeObserver(() => map.invalidateSize({ animate: false }))
      resizeObserver.observe(container)
      leafletRef.current = leaflet
      mapRef.current = map
      setReady(true)
    })
    return () => {
      cancelled = true
      resizeObserver?.disconnect()
      mapRef.current?.remove()
      mapRef.current = null
      markerRef.current = null
      radarLayers.clear()
      setReady(false)
    }
  }, [container])

  useEffect(() => {
    const leaflet = leafletRef.current
    const map = mapRef.current
    if (!ready || !leaflet || !map) return
    map.setView([coords.lat, coords.lng], map.getZoom())
    markerRef.current?.remove()
    markerRef.current = leaflet.circleMarker([coords.lat, coords.lng], { radius: 6, color: '#fff', weight: 2, fillColor: ACCENT, fillOpacity: 1 }).addTo(map)
  }, [coords.lat, coords.lng, ready])

  // Each frame keeps its own layer so replaying the loop reuses already-loaded tiles
  useEffect(() => {
    const leaflet = leafletRef.current
    const map = mapRef.current
    if (!ready || !leaflet || !map || !frames || !frame) return
    const radarLayers = radarLayersRef.current
    const liveUrls = new Set(frames.map((radarFrame) => radarFrame.tileUrl))
    for (const [url, layer] of radarLayers) {
      if (!liveUrls.has(url)) { layer.remove(); radarLayers.delete(url) }
    }
    const nextFrame = frames[(frameIndex + 1) % frames.length]
    for (const url of [frame.tileUrl, nextFrame.tileUrl]) {
      if (!radarLayers.has(url)) radarLayers.set(url, leaflet.tileLayer(url, { opacity: 0, maxNativeZoom: RADAR_MAX_NATIVE_ZOOM, maxZoom: 12, zIndex: 2 }).addTo(map))
    }
    for (const [url, layer] of radarLayers) layer.setOpacity(url === frame.tileUrl ? RADAR_OPACITY : 0)
  }, [frames, frame, frameIndex, ready])

  useEffect(() => {
    if (!isPlaying || frameCount === 0) return
    const timer = setInterval(() => setSelectedIndex((index) => ((index ?? frameCount - 1) + 1) % frameCount), FRAME_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [isPlaying, frameCount])

  return (
    <WidgetShell
      title={t('weather.radar.title')}
      icon={<span className="text-xl">📡</span>}
      isLoading={isLoading}
      error={error}
      onRetry={() => refetch()}
      lastUpdated={dataUpdatedAt || undefined}
      accentColor={ACCENT}
      isFocused
      fillHeight
    >
      <div className="flex flex-col gap-3 flex-1 min-h-0">
        <div ref={setContainer} className="relative flex-1 min-h-[240px] rounded-xl overflow-hidden border border-white/[0.06]" />
        {frame && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsPlaying((playing) => !playing)}
              aria-label={isPlaying ? t('weather.radar.pause') : t('weather.radar.play')}
              className="w-8 h-8 flex-shrink-0 rounded-lg border border-white/10 bg-white/[0.04] text-white/80 hover:bg-white/[0.08]"
            >
              {isPlaying ? '❚❚' : '▶'}
            </button>
            <input
              type="range"
              min={0}
              max={frameCount - 1}
              value={frameIndex}
              onChange={(event) => { setIsPlaying(false); setSelectedIndex(Number(event.target.value)) }}
              aria-label={t('weather.radar.timeline')}
              className="flex-1 accent-blue-400"
            />
            <span className="w-12 text-right font-mono text-[12px] text-white/75">
              {new Date(frame.time * 1000).toLocaleTimeString(intlLocale(), { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}
        <p className="text-[10px] text-fg-subtle">{t('weather.radar.source')}</p>
      </div>
    </WidgetShell>
  )
}
