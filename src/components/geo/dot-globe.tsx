import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import { autoRotateStep, createProjection, DOT_PITCH, dragRotation, easeRotationToward, gridSize, isOnVisibleHemisphere, type GeoMarker, type GeoTrackPoint, type Rotation } from './dot-grid'
import { drawDotGeo, rasterizeMask } from './draw-dot-geo'
import { prepareCanvas, useCanvasSize, useIsActive, usePrefersReducedMotion } from './dot-canvas'
import { createColorResolver } from './dot-palette'
import { useLandLayers } from './land-layers'

const FRAME_INTERVAL_MS = 90

interface Props {
  /** Accessible description of what the globe shows */
  label: string
  markers?: GeoMarker[]
  track?: GeoTrackPoint[]
  graticule?: boolean
  /** Hex or custom property name, e.g. `--color-land-iss` */
  landColor?: string
  /** [longitude, latitude] rotation; the visible center is its negation */
  initialRotation?: Rotation
  /** Spins +0.5° per frame unless dragged or the user prefers reduced motion */
  autoRotate?: boolean
  /** Eases the globe to center this point (e.g. the ISS) whenever it is not being dragged */
  focus?: { lon: number; lat: number } | null
  className?: string
  style?: CSSProperties
}

const NO_MARKERS: GeoMarker[] = []
const NO_TRACK: GeoTrackPoint[] = []
const DEFAULT_ROTATION: Rotation = [0, 0]

/** Orthographic dot-matrix globe; drag to turn it. Size comes from the caller (usually a square). */
export function DotGlobe({ label, markers = NO_MARKERS, track = NO_TRACK, graticule = true, landColor = '--color-land', initialRotation = DEFAULT_ROTATION, autoRotate = false, focus, className = '', style }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const size = useCanvasSize(canvasRef)
  const layers = useLandLayers()
  const active = useIsActive(canvasRef)
  const reducedMotion = usePrefersReducedMotion()
  const [rotation, setRotation] = useState<Rotation>(initialRotation)
  const drag = useRef<{ pointerId: number; x: number; y: number; start: Rotation } | null>(null)
  const focusLon = focus?.lon
  const focusLat = focus?.lat

  const spinning = autoRotate && !reducedMotion
  const following = focusLon !== undefined && focusLat !== undefined
  useEffect(() => {
    if (!active || (!spinning && !following)) return
    const timer = window.setInterval(() => {
      setRotation((current) => {
        if (drag.current) return current
        if (following && reducedMotion) return current[0] === -focusLon && current[1] === -focusLat ? current : [-focusLon, -focusLat]
        if (following) return easeRotationToward(current, focusLon, focusLat)
        return autoRotateStep(current)
      })
    }, FRAME_INTERVAL_MS)
    return () => window.clearInterval(timer)
  }, [active, spinning, following, reducedMotion, focusLon, focusLat])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !layers) return
    const context = prepareCanvas(canvas, size)
    const { columns, rows } = gridSize(size.width, size.height)
    if (!context || !columns || !rows) return
    // Rotation changes every frame, so the globe re-rasterizes its (small) mask each draw
    const mask = rasterizeMask(createProjection('globe', columns, rows, { rotation }), columns, rows, layers, { graticule, sphere: true })
    const projection = createProjection('globe', columns * DOT_PITCH, rows * DOT_PITCH, { rotation })
    drawDotGeo(context, {
      ...size, columns, rows, mask, projection, landColor, markers, track,
      isVisible: (lon, lat) => isOnVisibleHemisphere(rotation, lon, lat),
    }, createColorResolver())
  }, [size, layers, rotation, graticule, landColor, markers, track])

  const startDrag = (event: PointerEvent<HTMLCanvasElement>) => {
    drag.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, start: rotation }
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }
  const moveDrag = (event: PointerEvent<HTMLCanvasElement>) => {
    const current = drag.current
    if (!current || current.pointerId !== event.pointerId) return
    setRotation(dragRotation(current.start, event.clientX - current.x, event.clientY - current.y))
  }
  const endDrag = () => { drag.current = null }

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={label}
      className={`block ${className}`}
      // Vertical swipes scroll the page on phones; horizontal ones still spin the globe
      style={{ cursor: 'grab', touchAction: 'pan-y', ...style }}
      onPointerDown={startDrag}
      onPointerMove={moveDrag}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerLeave={endDrag}
    />
  )
}
