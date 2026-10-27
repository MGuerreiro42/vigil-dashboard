import { geoDistance, geoEquirectangular, geoOrthographic, type GeoProjection } from 'd3-geo'

export const DOT_PITCH = 4
export const HIT_RADIUS = 14
// Just under 90° so markers on the limb do not flicker in and out while the globe turns
const GLOBE_VISIBLE_RADIANS = 1.55
const DRAG_DEGREES_PER_PIXEL = 0.4
const MAX_TILT = 80
const AUTO_ROTATE_STEP = 0.5
const FOLLOW_EASING = 0.12

export type GeoKind = 'map' | 'globe'
export type BBox = [west: number, south: number, east: number, north: number]
export type Rotation = [longitude: number, latitude: number]
export type ScreenPoint = [x: number, y: number]

export interface GeoMarker {
  lon: number
  lat: number
  glyph: string
  color: string
  /** Placed by `layoutLabels`; on a quake, magnitude then place, so it can fall back to the magnitude */
  label?: string | null
  /** Ranked labels share the width quota (strongest first); unranked ones are always tried */
  labelRank?: number
  /** Hovered or selected: always labelled */
  pinned?: boolean
}

export interface GeoTrackPoint {
  lon: number
  lat: number
  color: string
}

export function gridSize(width: number, height: number) {
  return { columns: Math.floor(width / DOT_PITCH), rows: Math.floor(height / DOT_PITCH) }
}

/** Top-left of the dot grid, centred in the space the whole dots leave over. */
export function gridOffset(width: number, height: number): ScreenPoint {
  const { columns, rows } = gridSize(width, height)
  return [Math.floor((width - columns * DOT_PITCH) / 2), Math.floor((height - rows * DOT_PITCH) / 2)]
}

export function createProjection(kind: GeoKind, width: number, height: number, options: { rotation?: Rotation; bbox?: BBox }): GeoProjection {
  const projection = kind === 'globe' ? geoOrthographic().rotate(options.rotation ?? [0, 0]).clipAngle(90) : geoEquirectangular()
  const { bbox } = options
  if (bbox) {
    return projection.fitExtent([[0, 0], [width, height]], { type: 'MultiPoint', coordinates: [[bbox[0], bbox[1]], [bbox[2], bbox[3]]] })
  }
  return projection.fitSize([width, height], { type: 'Sphere' })
}

export type MaskCell = 'land' | 'rim' | 'graticule' | null

/** The mask is painted with pure red land, green globe rim and blue graticule; land wins overlaps. */
export function maskCellAt(pixels: Uint8ClampedArray, cellIndex: number): MaskCell {
  const offset = cellIndex * 4
  if (pixels[offset] > 110) return 'land'
  if (pixels[offset + 1] > 90) return 'rim'
  if (pixels[offset + 2] > 70) return 'graticule'
  return null
}

export function isOnVisibleHemisphere(rotation: Rotation, lon: number, lat: number) {
  return geoDistance([lon, lat], [-rotation[0], -rotation[1]]) < GLOBE_VISIBLE_RADIANS
}

/**
 * Longitude/latitude under a screen point, or null in the empty margins around the projected world.
 * The inverse projection wraps longitudes, so a point is kept only if it projects back onto itself.
 */
export function invertInsideWorld(projection: GeoProjection, pointer: ScreenPoint): [number, number] | null {
  const lonLat = projection.invert?.(pointer)
  if (!lonLat) return null
  const back = projection(lonLat)
  if (!back || Math.hypot(back[0] - pointer[0], back[1] - pointer[1]) > 0.5) return null
  return lonLat
}

/** Index of the marker closest to the pointer within the hit radius, or null. */
export function nearestMarkerIndex(markers: GeoMarker[], project: (lonLat: [number, number]) => ScreenPoint | null, pointer: ScreenPoint, radius = HIT_RADIUS) {
  let bestIndex: number | null = null
  let bestDistance = radius
  markers.forEach((marker, index) => {
    const screen = project([marker.lon, marker.lat])
    if (!screen) return
    const distance = Math.hypot(screen[0] - pointer[0], screen[1] - pointer[1])
    if (distance < bestDistance) {
      bestDistance = distance
      bestIndex = index
    }
  })
  return bestIndex
}

export function dragRotation(start: Rotation, deltaX: number, deltaY: number): Rotation {
  const latitude = start[1] - deltaY * DRAG_DEGREES_PER_PIXEL
  return [start[0] + deltaX * DRAG_DEGREES_PER_PIXEL, Math.max(-MAX_TILT, Math.min(MAX_TILT, latitude))]
}

export function autoRotateStep(rotation: Rotation): Rotation {
  return [rotation[0] + AUTO_ROTATE_STEP, rotation[1]]
}

/** Eases the globe so the focus point drifts to the center, taking the short way around. */
export function easeRotationToward(rotation: Rotation, lon: number, lat: number, easing = FOLLOW_EASING): Rotation {
  const longitudeGap = ((((-lon - rotation[0] + 540) % 360) + 360) % 360) - 180
  return [rotation[0] + longitudeGap * easing, rotation[1] + (-lat - rotation[1]) * easing]
}
