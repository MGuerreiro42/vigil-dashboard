import { geoPath, type GeoProjection } from 'd3-geo'
import { DOT_PITCH, maskCellAt, type GeoMarker, type GeoTrackPoint, type ScreenPoint } from './dot-grid'
import { LABEL_FONT, MARKER_FONT, type ColorResolver } from './dot-palette'
import { layoutLabels, type LabelRequest } from './marker-labels'
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
  /** Where the dot grid starts inside the canvas, so it sits centred */
  offset?: ScreenPoint
}

function drawGlyph(context: CanvasRenderingContext2D, x: number, y: number, glyph: string, color: string, background: string) {
  context.font = MARKER_FONT
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillStyle = background
  context.fillRect(x - 5, y - 7, 10, 14)
  context.fillStyle = color
  context.fillText(glyph, x, y + 0.5)
}

export function drawDotGeo(context: CanvasRenderingContext2D, scene: GeoScene, resolveColor: ColorResolver) {
  const { columns, rows, projection } = scene
  const background = resolveColor('--color-bg')
  const cellColors = { land: resolveColor(scene.landColor), rim: resolveColor('--color-rim'), graticule: resolveColor('--color-grat') }

  context.fillStyle = background
  context.fillRect(0, 0, scene.width, scene.height)
  const [offsetX, offsetY] = scene.offset ?? [0, 0]
  context.save()
  context.translate(offsetX, offsetY)

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


  for (const point of scene.track) {
    if (!scene.isVisible(point.lon, point.lat)) continue
    const screen = projection([point.lon, point.lat])
    if (!screen) continue
    context.fillStyle = resolveColor(point.color)
    context.fillRect(screen[0] - 1.2, screen[1] - 1.2, 2.4, 2.4)
  }

  context.restore()

  if (scene.crosshair) {
    context.fillStyle = resolveColor('--color-cross')
    context.fillRect(0, scene.crosshair[1], scene.width, 1)
    context.fillRect(scene.crosshair[0], 0, 1, scene.height)
  }

  const labels: LabelRequest[] = []
  for (const marker of scene.markers) {
    if (!scene.isVisible(marker.lon, marker.lat)) continue
    const screen = projection([marker.lon, marker.lat])
    if (!screen) continue
    const x = screen[0] + offsetX
    const y = screen[1] + offsetY
    const color = resolveColor(marker.color)
    drawGlyph(context, x, y, marker.glyph, color, background)
    if (marker.label) labels.push({ x, y, text: marker.label, color, rank: marker.labelRank, pinned: marker.pinned })
  }

  // Labels go on top of every marker, each on its own background box
  context.font = LABEL_FONT
  context.textAlign = 'left'
  context.textBaseline = 'middle'
  for (const label of layoutLabels(labels, (text) => context.measureText(text).width, scene.width)) {
    context.fillStyle = background
    context.fillRect(label.box.left, label.box.top, label.box.width, label.box.height)
    context.fillStyle = label.color
    context.fillText(label.text, label.textX, label.y + 0.5)
  }
}
