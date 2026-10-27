import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCanvasSize } from '@/components/geo/dot-canvas'
import { createProjection, DOT_PITCH, gridSize, type BBox, type GeoMarker } from '@/components/geo/dot-grid'
import { DotMap } from '@/components/geo/dot-map'
import { loadRainSampler, radarTiles, type RainBand, type RainRasterResult } from '@/components/geo/rain-raster'
import { QueryPanel } from '@/components/terminal/query-panel'
import { BracketButton, EmptyState, LegendGrid, ToneText } from '@/components/terminal/text'
import { DEFAULT_COORDS } from '@/features/weather/api/open-meteo'
import { useRadarFrames } from '@/features/weather/api/rainviewer'
import { frameOffsets, pastRadarFrames, radarBbox } from '@/features/weather/lib/weather-terminal'
import type { RadarFrame } from '@/features/weather/types'
import { useNow } from '@/hooks/use-now'
import { useGeoStore } from '@/store/geo-store'
import { useCityName } from '@/features/weather/lib/use-city-name'

const FRAME_MS = 1_000
const MAP_HEIGHT = '340px'
const BANDS: { band: RainBand; className: string }[] = [
  { band: 'weak', className: 'text-rain-weak' },
  { band: 'moderate', className: 'text-info' },
  { band: 'strong', className: 'text-warn' },
  { band: 'extreme', className: 'text-err' },
]

function isControl(target: EventTarget | null) {
  return target instanceof HTMLElement && Boolean(target.closest('input, textarea, select, button, a, [tabindex], [contenteditable="true"]'))
}

/** Space toggles playback while this screen is open, unless focus is on a control that uses the key itself. */
function useSpaceToggle(onToggle: () => void) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== ' ' || event.metaKey || event.ctrlKey || event.altKey || isControl(event.target)) return
      event.preventDefault()
      onToggle()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onToggle])
}

const frameKey = (frame: RadarFrame, bbox: BBox) => `${frame.tileUrl}|${bbox.join(',')}`

/**
 * Samples the active frame's tiles into the dot renderer; each frame loads once and stays cached while
 * it is among the current frames, so playback does not refetch.
 */
function useRainRaster(frames: RadarFrame[], active: RadarFrame, bbox: BBox) {
  const cache = useRef(new Map<string, Promise<RainRasterResult>>())
  const [shown, setShown] = useState<{ key: string; result: RainRasterResult } | null>(null)
  const key = frameKey(active, bbox)
  const liveKeys = frames.map((frame) => frameKey(frame, bbox)).join(' ')

  useEffect(() => {
    // Each sampler holds a full RGBA copy of its tiles, so drop frames that left the 2 h window
    for (const cachedKey of cache.current.keys()) if (!liveKeys.includes(cachedKey)) cache.current.delete(cachedKey)
  }, [liveKeys])

  useEffect(() => {
    let cancelled = false
    let pending = cache.current.get(key)
    if (!pending) {
      const [tileUrl, bboxText] = key.split('|')
      pending = loadRainSampler(tileUrl, bboxText.split(',').map(Number) as BBox)
      cache.current.set(key, pending)
    }
    pending.then((result) => {
      // Failed loads retry the next time the frame comes up
      if (!result.ok) cache.current.delete(key)
      if (!cancelled) setShown({ key, result })
    }, () => cache.current.delete(key))
    return () => { cancelled = true }
  }, [key])

  return shown?.result ?? null
}

/** Tiles drawn as images over the dot map when their pixels cannot be read (no CORS). */
function TileOverlay({ tileUrl, bbox }: { tileUrl: string; bbox: BBox }) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const size = useCanvasSize(overlayRef)
  const { columns, rows } = gridSize(size.width, size.height)
  const placed = useMemo(() => {
    if (!columns || !rows) return []
    const projection = createProjection('map', columns * DOT_PITCH, rows * DOT_PITCH, { bbox })
    return radarTiles(tileUrl, bbox).tiles.flatMap((tile) => {
      const topLeft = projection([tile.bounds[0], tile.bounds[3]])
      const bottomRight = projection([tile.bounds[2], tile.bounds[1]])
      return topLeft && bottomRight ? [{ url: tile.url, left: topLeft[0], top: topLeft[1], width: bottomRight[0] - topLeft[0], height: bottomRight[1] - topLeft[1] }] : []
    })
  }, [tileUrl, bbox, columns, rows])

  return (
    <div ref={overlayRef} className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {placed.map((tile) => <img key={tile.url} src={tile.url} alt="" className="absolute max-w-none" style={{ left: tile.left, top: tile.top, width: tile.width, height: tile.height }} />)}
    </div>
  )
}

function RadarBody({ allFrames }: { allFrames: RadarFrame[] }) {
  const { t } = useTranslation()
  const coords = useGeoStore((state) => state.coords) ?? DEFAULT_COORDS
  const city = useCityName().toLowerCase()
  const now = useNow(60_000)
  const frames = useMemo(() => pastRadarFrames(allFrames, now / 1000), [allFrames, now])
  const [selected, setSelected] = useState<number | null>(null)
  const [playing, setPlaying] = useState(false)
  const lastIndex = frames.length - 1
  const activeIndex = selected === null ? lastIndex : Math.min(selected, lastIndex)
  const bbox = useMemo(() => radarBbox(coords.lng, coords.lat), [coords.lng, coords.lat])
  const markers = useMemo<GeoMarker[]>(() => [{ lon: coords.lng, lat: coords.lat, glyph: '+', color: '--color-info', label: city }], [coords.lng, coords.lat, city])
  const togglePlaying = useCallback(() => setPlaying((current) => !current), [])
  useSpaceToggle(togglePlaying)

  useEffect(() => {
    if (!playing || frames.length < 2) return
    const timer = setInterval(() => setSelected((index) => ((index ?? frames.length - 1) + 1) % frames.length), FRAME_MS)
    return () => clearInterval(timer)
  }, [playing, frames.length])

  const active = frames[activeIndex]
  const raster = useRainRaster(frames, active ?? frames[0], bbox)
  if (!active) return <EmptyState title={t('terminal.planet.radar.empty')} hint={t('terminal.planet.radar.emptyHint')} />

  const offsets = frameOffsets(frames)
  const frameLabel = (index: number) => (offsets[index] === 0 ? t('terminal.planet.now') : t('terminal.planet.radar.minutesAgo', { count: -offsets[index] }))
  const selectFrame = (index: number) => {
    setSelected(index)
    setPlaying(false)
  }
  const sampled = raster?.ok ? raster.sample : null
  const tainted = raster?.ok === false && raster.reason === 'tainted'

  return (
    <>
      <div className="relative">
        <DotMap label={t('terminal.planet.radar.mapLabel', { city })} bbox={bbox} graticule={false} landColor="--color-rim" rain={sampled} markers={markers} style={{ height: MAP_HEIGHT }} />
        {tainted && <TileOverlay tileUrl={active.tileUrl} bbox={bbox} />}
      </div>
      {raster?.ok === false && raster.reason === 'load' && <span className="text-dim">{t('terminal.planet.radar.tilesFailed')}</span>}
      <div className="flex flex-wrap items-center gap-x-[12px] gap-y-[6px]">
        <BracketButton tone="ok" aria-pressed={playing} onClick={togglePlaying}>{t(playing ? 'terminal.planet.radar.pause' : 'terminal.planet.radar.play')}</BracketButton>
        <span className="ml-auto sm:hidden" aria-live="off">{frameLabel(activeIndex)}</span>
        <div role="group" aria-label={t('terminal.planet.radar.frames')} className="flex flex-wrap gap-x-[8px] gap-y-[2px] max-sm:hidden">
          {offsets.map((offset, index) => (
            <button key={frames[index].time} type="button" aria-pressed={index === activeIndex} aria-label={frameLabel(index)} onClick={() => selectFrame(index)} className={index === activeIndex ? 'text-ok' : 'text-dim'}>
              {offset === 0 ? t('terminal.planet.now') : `−${-offset}`}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-[4px] sm:hidden">
        <div role="group" aria-label={t('terminal.planet.radar.frames')} className="grid gap-[2px]" style={{ gridTemplateColumns: `repeat(${offsets.length}, minmax(0,1fr))` }}>
          {frames.map((frame, index) => (
            <button
              key={frame.time}
              type="button"
              aria-pressed={index === activeIndex}
              aria-label={frameLabel(index)}
              onClick={() => selectFrame(index)}
              className={`h-[20px] ${index === activeIndex ? 'bg-ok' : index < activeIndex ? 'bg-frame-played' : 'bg-line'}`}
            />
          ))}
        </div>
        <span className="flex justify-between text-dim" aria-hidden>
          <span>−{-offsets[0]}</span>
          <span>−{-offsets[Math.floor(offsets.length / 2)]}</span>
          <span>{t('terminal.planet.now')}</span>
        </span>
      </div>
      <LegendGrid minItem={130} gap="4px 16px">
        <span><ToneText className="font-semibold" tone="info">+</ToneText> {t('terminal.planet.radar.you', { city })}</span>
        {BANDS.map(({ band, className }) => <span key={band}><span className={`font-semibold ${className}`}>■</span> {t(`terminal.planet.radar.bands.${band}`)}</span>)}
      </LegendGrid>
    </>
  )
}

/** [3.4] RainViewer's last 2 h of radar sampled into the dot map around the selected city. */
export function RadarPanel() {
  const { t } = useTranslation()
  const query = useRadarFrames()
  return (
    <QueryPanel id="3.4" title={t('terminal.planet.radar.title')} gap={12} meta="rainviewer · 2 h · 10 min" query={query} source="rainviewer">
      {(frames) => <RadarBody allFrames={frames} />}
    </QueryPanel>
  )
}
