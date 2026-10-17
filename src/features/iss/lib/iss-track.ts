import { degreesLat, degreesLong, eciToGeodetic, gstime, jday, propagate, sunPos, twoline2satrec, type EciVec3 } from 'satellite.js'

export interface TrackSample {
  /** Minutes from the reference time; negative is the past */
  minutes: number
  lon: number
  lat: number
  /** In the Earth's shadow (umbra), i.e. night as seen from the station */
  eclipsed: boolean
}

const EARTH_RADIUS_KM = 6371

/** Cylindrical shadow model: behind the Earth as seen from the Sun and within one Earth radius of the Sun line. */
export function isInEarthShadow(satellite: EciVec3<number>, sunDirection: number[]): boolean {
  const length = Math.hypot(sunDirection[0], sunDirection[1], sunDirection[2])
  const [sunX, sunY, sunZ] = sunDirection.map((component) => component / length)
  const along = satellite.x * sunX + satellite.y * sunY + satellite.z * sunZ
  if (along >= 0) return false
  return Math.hypot(satellite.x - along * sunX, satellite.y - along * sunY, satellite.z - along * sunZ) < EARTH_RADIUS_KM
}

/**
 * Ground track propagated with SGP4 from a TLE, one sample every `stepMinutes` from `fromMinutes` up to
 * `toMinutes` around `atMs`. Samples SGP4 cannot compute are skipped.
 */
export function propagateTrack(line1: string, line2: string, atMs: number, fromMinutes: number, toMinutes: number, stepMinutes: number): TrackSample[] {
  const satrec = twoline2satrec(line1, line2)
  const samples: TrackSample[] = []
  // Integer steps (with a little slack) so float drift never drops a sample that lands on `toMinutes`
  const count = Math.floor((toMinutes - fromMinutes) / stepMinutes + 1e-9)
  for (let step = 0; step <= count; step++) {
    const minutes = fromMinutes + step * stepMinutes
    const date = new Date(atMs + minutes * 60_000)
    const state = propagate(satrec, date)
    // SGP4 reports a failed step with a falsy position
    if (!state?.position) continue
    const ground = eciToGeodetic(state.position, gstime(date))
    samples.push({
      minutes,
      lon: degreesLong(ground.longitude),
      lat: degreesLat(ground.latitude),
      eclipsed: isInEarthShadow(state.position, sunPos(jday(date)).rsun),
    })
  }
  return samples
}

/** Share of samples in daylight, 0–100. */
export function daylightShare(samples: TrackSample[]): number {
  return samples.length ? Math.round((samples.filter((sample) => !sample.eclipsed).length / samples.length) * 100) : 0
}

/** Orbital period in minutes from the mean motion (revolutions per day). */
export const orbitalPeriodMinutes = (meanMotion: number) => (24 * 60) / meanMotion

export type IssRegion = 'brazil' | 'usa' | 'india' | 'china' | 'russia' | 'australia' | 'africa' | 'europe' | 'southAmerica' | 'indianOcean' | 'pacificOcean' | 'atlanticOcean'

// [west, south, east, north]; first match wins, so Brazil comes before South America
const REGION_BOXES: [IssRegion, number, number, number, number][] = [
  ['brazil', -74, -34, -34, 5],
  ['usa', -125, 25, -66, 49],
  ['india', 68, 7, 90, 30],
  ['china', 90, 20, 122, 45],
  ['russia', 40, 50, 180, 75],
  ['australia', 113, -39, 154, -11],
  ['africa', -17, -35, 51, 35],
  ['europe', -10, 36, 40, 60],
  ['southAmerica', -82, -55, -34, 12],
]

/** Coarse region under the ISS, used when the coordinates lookup has no country (oceans) or has not answered. */
export function issRegion(lon: number, lat: number): IssRegion {
  const box = REGION_BOXES.find(([, west, south, east, north]) => lon >= west && lon <= east && lat >= south && lat <= north)
  if (box) return box[0]
  if (lon > 20 && lon < 120 && lat < 25) return 'indianOcean'
  if (lon >= 120 || lon < -70) return 'pacificOcean'
  return 'atlanticOcean'
}

/** "UTC+4" · "UTC−3" from the solar time zone of a longitude. */
export function utcOffsetLabel(lon: number): string {
  const offset = Math.round(lon / 15)
  return `UTC${offset >= 0 ? '+' : '−'}${Math.abs(offset)}`
}

/** "0.577° S" */
export function formatHemisphere(value: number, positive: string, negative: string, digits = 3): string {
  return `${Math.abs(value).toFixed(digits)}° ${value >= 0 ? positive : negative}`
}
