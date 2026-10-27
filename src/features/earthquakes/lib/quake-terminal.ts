import type { Tone } from '@/lib/terminal-format'
import type { Earthquake } from '@/features/earthquakes/types'

export type QuakeBand = 'severe' | 'strong' | 'moderate' | 'minor'
export const QUAKE_BANDS: QuakeBand[] = ['minor', 'moderate', 'strong', 'severe']

export function quakeBand(magnitude: number): QuakeBand {
  if (magnitude >= 6) return 'severe'
  if (magnitude >= 4.5) return 'strong'
  if (magnitude >= 3) return 'moderate'
  return 'minor'
}

const BAND_GLYPH: Record<QuakeBand, string> = { severe: '@', strong: 'O', moderate: 'o', minor: '·' }
const BAND_TONE: Record<QuakeBand, Tone> = { severe: 'err', strong: 'warn', moderate: 'text', minor: 'text' }

export const quakeGlyph = (magnitude: number) => BAND_GLYPH[quakeBand(magnitude)]
export const quakeTone = (magnitude: number) => BAND_TONE[quakeBand(magnitude)]

export type QuakeSort = 'recent' | 'magnitudeDown' | 'magnitudeUp'

export function sortQuakes(quakes: Earthquake[], sort: QuakeSort): Earthquake[] {
  const compare: Record<QuakeSort, (left: Earthquake, right: Earthquake) => number> = {
    recent: (left, right) => right.time - left.time,
    magnitudeDown: (left, right) => right.magnitude - left.magnitude,
    magnitudeUp: (left, right) => left.magnitude - right.magnitude,
  }
  return [...quakes].sort(compare[sort])
}

export const DEPTH_RANGES = [[0, 35], [35, 70], [70, 300], [300, Infinity]] as const
const SHALLOW_KM = 70

export function depthHistogram(quakes: Earthquake[]) {
  return DEPTH_RANGES.map(([from, to]) => {
    const inRange = quakes.filter((quake) => quake.depth >= from && quake.depth < to)
    const meanMagnitude = inRange.length ? inRange.reduce((sum, quake) => sum + quake.magnitude, 0) / inRange.length : null
    return { from, to, count: inRange.length, meanMagnitude }
  })
}

export function shallowShare(quakes: Earthquake[]): number {
  return quakes.length ? Math.round((quakes.filter((quake) => quake.depth < SHALLOW_KM).length / quakes.length) * 100) : 0
}

/** "76 km NE of Ozernovskiy, RU" → "Ozernovskiy"; "off the coast of Ecuador" → "Ecuador". */
export function shortPlace(place: string): string {
  const afterOf = place.split(' of ').pop() ?? place
  return afterOf.split(',')[0].trim()
}

/** "23.5S 46.6W" */
export function formatLonLat(lon: number, lat: number): string {
  return `${Math.abs(lat).toFixed(1)}${lat >= 0 ? 'N' : 'S'} ${Math.abs(lon).toFixed(1)}${lon >= 0 ? 'E' : 'W'}`
}
