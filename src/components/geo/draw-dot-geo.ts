import { geoPath, type GeoProjection } from 'd3-geo'
import { DOT_PITCH, maskCellAt, type GeoMarker, type GeoTrackPoint, type ScreenPoint } from './dot-grid'
import { LABEL_FONT, MARKER_FONT, type ColorResolver } from './dot-palette'
import { rainBandForIntensity, type RainBand, type RainSampler } from './rain-raster'
import type { LandLayers } from './land-layers'

const RAIN_COLORS: Record<RainBand, string> = {
  weak: '--color-rain-weak',
  moderate: '--color-info',
  strong: '--color-warn',
  extreme: '--color-err',
}

/** Renders the geography at one pixel per dot and reads it back as the dot mask. */
export function rasterizeMask(projection: GeoProjection, columns: number, rows: number, layers: LandLayers, options: { graticule: boolean; sphere: boolean }) {
  const canvas = document.createElement('canvas')
  canvas.width = columns
  canvas.height = rows
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) return new Uint8ClampedArray(columns * rows * 4)
  const path = geoPath(projection, context)
  if (options.graticule) {
    context.strokeStyle = 'rgb(0,0,255)'
    context.lineWidth = 0.7
    context.beginPath()
    path(layers.graticule)
    context.stroke()
  }
  context.fillStyle = 'rgb(255,0,0)'
  context.beginPath()
  path(layers.land)
  context.fill()
  if (options.sphere) {
    context.strokeStyle = 'rgb(0,255,0)'
    context.lineWidth = 1
    context.beginPath()
    path({ type: 'Sphere' })
    context.stroke()
  }
  return context.getImageData(0, 0, columns, rows).data
}

export interface GeoScene {
  width: number
  height: number
  columns: number
  rows: number
  mask: Uint8ClampedArray
  /** Fitted to columns × rows dots in CSS px, the same one used for hit-testing */
  projection: GeoProjection
  isVisible: (lon: number, lat: number) => boolean
  landColor: string
  markers: GeoMarker[]
  track: GeoTrackPoint[]
  rain?: RainSampler | null
  crosshair?: ScreenPoint | null
}

function drawMarker(context: CanvasRenderingContext2D, x: number, y: number, marker: GeoMarker, color: string, background: string) {
  context.font = MARKER_FONT
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillStyle = background
  context.fillRect(x - 5, y - 7, 10, 14)
  context.fillStyle = color
  context.fillText(marker.glyph, x, y + 0.5)
  if (!marker.label) return
  context.font = LABEL_FONT
  context.textAlign = 'left'
  const textWidth = context.measureText(marker.label).width
  context.fillStyle = background
  context.fillRect(x + 8, y - 8, textWidth + 6, 16)
  context.fillStyle = color
  context.fillText(marker.label, x + 11, y + 0.5)
}

export function drawDotGeo(context: CanvasRenderingContext2D, scene: GeoScene, resolveColor: ColorResolver) {
  const { columns, rows, projection } = scene
  const background = resolveColor('--color-bg')
  const cellColors = { land: resolveColor(scene.landColor), rim: resolveColor('--color-rim'), graticule: resolveColor('--color-grat') }

  context.fillStyle = background
  context.fillRect(0, 0, scene.width, scene.height)

  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const cell = maskCellAt(scene.mask, row * columns + column)
      if (!cell) continue
      context.fillStyle = cellColors[cell]
      context.fillRect(column * DOT_PITCH + 1.2, row * DOT_PITCH + 1.2, 1.7, 1.7)
    }
  }

  if (scene.rain && projection.invert) {
    for (let row = 0; row < rows; row++) {
      for (let column = 0; column < columns; column++) {
        const lonLat = projection.invert([column * DOT_PITCH + 2, row * DOT_PITCH + 2])
        if (!lonLat) continue
        const band = rainBandForIntensity(scene.rain(lonLat[0], lonLat[1]))
        if (!band) continue
        context.fillStyle = resolveColor(RAIN_COLORS[band])
        context.fillRect(column * DOT_PITCH + 0.6, row * DOT_PITCH + 0.6, 2.9, 2.9)
      }
    }
  }

  if (scene.crosshair) {
    context.fillStyle = resolveColor('--color-cross')
    context.fillRect(0, scene.crosshair[1], scene.width, 1)
    context.fillRect(scene.crosshair[0], 0, 1, scene.height)
  }

  for (const point of scene.track) {
    if (!scene.isVisible(point.lon, point.lat)) continue
    const screen = projection([point.lon, point.lat])
    if (!screen) continue
    context.fillStyle = resolveColor(point.color)
    context.fillRect(screen[0] - 1.2, screen[1] - 1.2, 2.4, 2.4)
  }

  for (const marker of scene.markers) {
    if (!scene.isVisible(marker.lon, marker.lat)) continue
    const screen = projection([marker.lon, marker.lat])
    if (!screen) continue
    drawMarker(context, screen[0], screen[1], marker, resolveColor(marker.color), background)
  }
}
