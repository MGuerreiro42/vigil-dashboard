import type { BBox } from './dot-grid'

export type RainBand = 'weak' | 'moderate' | 'strong' | 'extreme'
/** Rain intensity 0..1 at a coordinate; below 0.18 nothing is drawn. */
export type RainSampler = (lon: number, lat: number) => number

const TILE_SIZE = 256
// RainViewer serves radar tiles up to zoom 7
const MAX_ZOOM = 7

// Representative intensity per band, inside the renderer's .18/.38/.6/.85 thresholds
export const RAIN_BAND_INTENSITY: Record<RainBand, number> = { weak: 0.28, moderate: 0.5, strong: 0.72, extreme: 0.92 }

export function rainBandForIntensity(intensity: number): RainBand | null {
  if (intensity > 0.85) return 'extreme'
  if (intensity > 0.6) return 'strong'
  if (intensity > 0.38) return 'moderate'
  if (intensity >= 0.18) return 'weak'
  return null
}

/**
 * Bands for RainViewer color scheme 2 (Universal Blue): translucent grey for drizzle,
 * dark to light blue up to ~35 dBZ, yellow/orange for heavy rain, red/pink/white above ~55 dBZ.
 */
export function rainBandFromColor(red: number, green: number, blue: number, alpha: number): RainBand | null {
  if (alpha < 128) return null
  if (blue > red) return green >= 140 ? 'moderate' : 'weak'
  if (red > 200 && blue > 200) return 'extreme'
  if (red >= 200 && green >= 100 && blue < 80) return 'strong'
  if (red >= 150 && blue < 80) return 'extreme'
  return 'weak'
}

/** About two tiles across the bbox: enough pixels for one sample per 4px dot on wide screens. */
export function zoomForBbox(bbox: BBox) {
  const longitudeSpan = Math.max(0.01, bbox[2] - bbox[0])
  return Math.max(0, Math.min(MAX_ZOOM, Math.ceil(Math.log2(720 / longitudeSpan))))
}

/** Web Mercator pixel of a coordinate in the whole-world image at that zoom. */
export function lonLatToWorldPixel(lon: number, lat: number, zoom: number): [x: number, y: number] {
  const worldSize = TILE_SIZE * 2 ** zoom
  const latitudeRadians = (Math.max(-85.0511, Math.min(85.0511, lat)) * Math.PI) / 180
  const mercatorY = Math.log(Math.tan(latitudeRadians) + 1 / Math.cos(latitudeRadians))
  return [((lon + 180) / 360) * worldSize, ((1 - mercatorY / Math.PI) / 2) * worldSize]
}

export function tileRangeForBbox(bbox: BBox, zoom: number) {
  const tileCount = 2 ** zoom
  const [westX, northY] = lonLatToWorldPixel(bbox[0], bbox[3], zoom)
  const [eastX, southY] = lonLatToWorldPixel(bbox[2], bbox[1], zoom)
  const clampTile = (pixel: number) => Math.max(0, Math.min(tileCount - 1, Math.floor(pixel / TILE_SIZE)))
  return { minX: clampTile(westX), maxX: clampTile(eastX), minY: clampTile(northY), maxY: clampTile(southY) }
}

export type RainRasterResult =
  | { ok: true; sample: RainSampler }
  | { ok: false; reason: 'load' | 'tainted' }

function loadTile(url: string, signal?: AbortSignal) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    // Without CORS the pixels cannot be read back, so ask for it up front
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`tile failed: ${url}`))
    signal?.addEventListener('abort', () => { image.src = ''; reject(signal.reason) }, { once: true })
    image.src = url
  })
}

/**
 * Loads the radar tiles covering the bbox and returns a sampler for the dot renderer.
 * A failed load or a tainted canvas resolves with `ok: false` so the caller can fall back to an
 * image overlay; an abort rejects.
 */
export async function loadRainSampler(tileUrl: string, bbox: BBox, signal?: AbortSignal): Promise<RainRasterResult> {
  const zoom = zoomForBbox(bbox)
  const range = tileRangeForBbox(bbox, zoom)
  const tiles: { x: number; y: number; url: string }[] = []
  for (let tileY = range.minY; tileY <= range.maxY; tileY++) {
    for (let tileX = range.minX; tileX <= range.maxX; tileX++) {
      tiles.push({ x: tileX, y: tileY, url: tileUrl.replace('{z}', String(zoom)).replace('{x}', String(tileX)).replace('{y}', String(tileY)) })
    }
  }

  let images: HTMLImageElement[]
  try {
    images = await Promise.all(tiles.map((tile) => loadTile(tile.url, signal)))
  } catch (error) {
    if (signal?.aborted) throw error
    return { ok: false, reason: 'load' }
  }

  const width = (range.maxX - range.minX + 1) * TILE_SIZE
  const height = (range.maxY - range.minY + 1) * TILE_SIZE
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) return { ok: false, reason: 'tainted' }
  images.forEach((image, index) => {
    context.drawImage(image, (tiles[index].x - range.minX) * TILE_SIZE, (tiles[index].y - range.minY) * TILE_SIZE)
  })

  let pixels: Uint8ClampedArray
  try {
    pixels = context.getImageData(0, 0, width, height).data
  } catch {
    return { ok: false, reason: 'tainted' }
  }

  const originX = range.minX * TILE_SIZE
  const originY = range.minY * TILE_SIZE
  const sample: RainSampler = (lon, lat) => {
    const [worldX, worldY] = lonLatToWorldPixel(lon, lat, zoom)
    const pixelX = Math.floor(worldX - originX)
    const pixelY = Math.floor(worldY - originY)
    if (pixelX < 0 || pixelY < 0 || pixelX >= width || pixelY >= height) return 0
    const offset = (pixelY * width + pixelX) * 4
    const band = rainBandFromColor(pixels[offset], pixels[offset + 1], pixels[offset + 2], pixels[offset + 3])
    return band ? RAIN_BAND_INTENSITY[band] : 0
  }
  return { ok: true, sample }
}
