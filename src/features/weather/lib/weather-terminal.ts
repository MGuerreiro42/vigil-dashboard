import type { BBox } from '@/components/geo/dot-grid'
import type { Tone } from '@/lib/terminal-format'
import type { AirQuality, AQICategory, RadarFrame } from '@/features/weather/types'

export type Pollutant = 'pm25' | 'pm10' | 'no2' | 'o3'

/** WHO 2021 guideline limits in µg/m³: 24 h means, except ozone's 8 h peak. */
export const WHO_LIMITS: Record<Pollutant, number> = { pm25: 15, pm10: 45, no2: 25, o3: 100 }
export const POLLUTANT_LABEL: Record<Pollutant, string> = { pm25: 'PM2.5', pm10: 'PM10', no2: 'NO₂', o3: 'O₃' }
export const POLLUTANTS = Object.keys(WHO_LIMITS) as Pollutant[]

/** The pollutant furthest above (or closest to) its WHO limit. */
export function worstPollutant(air: AirQuality): { pollutant: Pollutant; ratio: number } {
  return POLLUTANTS
    .map((pollutant) => ({ pollutant, ratio: air[pollutant] / WHO_LIMITS[pollutant] }))
    .reduce((worst, entry) => (entry.ratio > worst.ratio ? entry : worst))
}

export function aqiTone(category: AQICategory): Tone {
  if (category === 'good') return 'ok'
  if (category === 'moderate') return 'warn'
  return 'err'
}

export type UvBand = 'low' | 'moderate' | 'high' | 'veryHigh' | 'extreme'

export function uvBand(uv: number): UvBand {
  if (uv < 3) return 'low'
  if (uv < 6) return 'moderate'
  if (uv < 8) return 'high'
  if (uv < 11) return 'veryHigh'
  return 'extreme'
}

export const uvTone = (uv: number): Tone => (uv >= 8 ? 'err' : uv >= 6 ? 'warn' : 'text')
export const precipTone = (percent: number): Tone => (percent >= 80 ? 'info' : 'dim')

// The design frames São Paulo in 18° × 11°: wide enough for the state and the coast
const RADAR_HALF_LON = 9
const RADAR_HALF_LAT = 5.5

export function radarBbox(lon: number, lat: number): BBox {
  return [lon - RADAR_HALF_LON, lat - RADAR_HALF_LAT, lon + RADAR_HALF_LON, lat + RADAR_HALF_LAT]
}

/** The last two hours of radar: RainViewer's past frames, oldest first, at most 13 (−120 … now). */
export const RADAR_FRAME_COUNT = 13

export function pastRadarFrames(frames: RadarFrame[], nowSeconds: number): RadarFrame[] {
  return frames.filter((frame) => frame.time <= nowSeconds).slice(-RADAR_FRAME_COUNT)
}

/** Minutes before the newest frame: −120, −110 … 0. */
export function frameOffsets(frames: RadarFrame[]): number[] {
  const newest = frames[frames.length - 1]?.time ?? 0
  return frames.map((frame) => Math.round((frame.time - newest) / 60))
}
