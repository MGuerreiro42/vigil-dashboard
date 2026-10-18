import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import { createProjection, DOT_PITCH, gridOffset, gridSize, invertInsideWorld, nearestMarkerIndex, type BBox, type GeoMarker, type GeoTrackPoint, type ScreenPoint } from './dot-grid'
import { drawDotGeo, rasterizeMask } from './draw-dot-geo'
import { prepareCanvas, useCanvasSize } from './dot-canvas'
import { createColorResolver } from './dot-palette'
import { useLandLayers } from './land-layers'
import type { RainSampler } from './rain-raster'

export interface MapInspection {
  lon: number
  lat: number
  /** Index into `markers` of the marker under the pointer, if any */
  markerIndex: number | null
}

interface Props {
  /** Accessible description of what the map shows */
  label: string
  markers?: GeoMarker[]
  track?: GeoTrackPoint[]
  /** [west, south, east, north]; the whole world when omitted */
  bbox?: BBox
  graticule?: boolean
  /** Hex or custom property name, e.g. `--color-rim` for the radar */
  landColor?: string
  rain?: RainSampler | null
  /** Enables the crosshair and hit-testing; mouse hover inspects, a tap pins the inspection */
  onInspect?: (inspection: MapInspection | null) => void
  className?: string
  style?: CSSProperties
}

const NO_MARKERS: GeoMarker[] = []
const NO_TRACK: GeoTrackPoint[] = []

/** Flat equirectangular dot-matrix map; height comes from the caller's class or style. */
export function DotMap({ label, markers = NO_MARKERS, track = NO_TRACK, bbox, graticule = true, landColor = '--color-land', rain, onInspect, className = '', style }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const size = useCanvasSize(canvasRef)
  const layers = useLandLayers()
  const [crosshair, setCrosshair] = useState<ScreenPoint | null>(null)
  const { columns, rows } = gridSize(size.width, size.height)
  const [offsetX, offsetY] = gridOffset(size.width, size.height)
  const bboxKey = bbox?.join(',')

  // The mask only depends on the grid and the extent, so markers and hover redraw without re-rasterizing
  const geometry = useMemo(() => {
    if (!layers || !columns || !rows) return null
    const extent = bboxKey ? (bboxKey.split(',').map(Number) as BBox) : undefined
    const maskProjection = createProjection('map', columns, rows, { bbox: extent })
    return {
      mask: rasterizeMask(maskProjection, columns, rows, layers, { graticule, sphere: false }),
      projection: createProjection('map', columns * DOT_PITCH, rows * DOT_PITCH, { bbox: extent }),
    }
  }, [layers, columns, rows, bboxKey, graticule])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !geometry) return
    const context = prepareCanvas(canvas, size)
    if (!context) return
    drawDotGeo(context, { ...size, columns, rows, ...geometry, isVisible: () => true, landColor, markers, track, rain, crosshair, offset: [offsetX, offsetY] }, createColorResolver())
  }, [size, columns, rows, offsetX, offsetY, geometry, landColor, markers, track, rain, crosshair])

  const inspect = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!onInspect || !geometry) return
    const rect = event.currentTarget.getBoundingClientRect()
    const pointer: ScreenPoint = [event.clientX - rect.left, event.clientY - rect.top]
    const onGrid: ScreenPoint = [pointer[0] - offsetX, pointer[1] - offsetY]
    const lonLat = invertInsideWorld(geometry.projection, onGrid)
    setCrosshair(lonLat && pointer)
    onInspect(lonLat && { lon: lonLat[0], lat: lonLat[1], markerIndex: nearestMarkerIndex(markers, geometry.projection, onGrid) })
  }

  const interactive = Boolean(onInspect)
  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={label}
      className={`block w-full ${className}`}
      style={{ cursor: interactive ? 'crosshair' : undefined, ...style }}
      onPointerMove={interactive ? (event) => { if (event.pointerType !== 'touch') inspect(event) } : undefined}
      onPointerDown={interactive ? inspect : undefined}
      onPointerLeave={interactive ? (event) => {
        // A tap pins the inspection on touch screens; only a mouse leaving clears it
        if (event.pointerType !== 'mouse') return
        setCrosshair(null)
        onInspect?.(null)
      } : undefined}
    />
  )
}
