import { useQuery } from '@tanstack/react-query'
import type { ISSPosition, ISSCoordinates, ISSFuturePosition, ISSTLE } from './types/iss'

const BASE = 'https://api.wheretheiss.at/v1'

// ─── helpers ──────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizePosition(raw: any): ISSPosition {
  return {
    lat: raw.latitude,
    lng: raw.longitude,
    altitude: raw.altitude,
    velocity: raw.velocity,
    visibility: raw.visibility,
    timestamp: raw.timestamp,
    footprint: raw.footprint,
    solarLat: raw.solar_lat,
    solarLng: raw.solar_lon,
    daynum: raw.daynum,
  }
}

/** Parse key orbital elements from TLE Line 1 and Line 2.
 *  Field positions follow the standard two-line element set format. */
function parseTLE(line1: string, line2: string): Partial<ISSTLE> {
  // --- Line 1 ---
  // Epoch: positions 18–32  → "YYDDD.FFFFFFFF"
  const epochRaw = line1.substring(18, 32).trim()
  const twoDigitYear = parseInt(epochRaw.substring(0, 2), 10)
  const epochYear = twoDigitYear >= 57 ? 1900 + twoDigitYear : 2000 + twoDigitYear
  const epochDay = parseFloat(epochRaw.substring(2))

  // BSTAR drag term: positions 53–61  → e.g. "40606-3" → 0.40606e-3
  const bstarRaw = line1.substring(53, 61).trim()
  const bstarSign = bstarRaw.startsWith('-') ? -1 : 1
  const bstarClean = bstarRaw.replace(/^[+-]/, '')
  const bstarParts = bstarClean.split('-')
  const bstar = bstarParts.length === 2
    ? bstarSign * parseFloat('0.' + bstarParts[0]) * Math.pow(10, -parseInt(bstarParts[1], 10))
    : parseFloat(bstarRaw)

  // --- Line 2 ---
  const inclination = parseFloat(line2.substring(8, 16))
  const raan = parseFloat(line2.substring(17, 25))
  const eccentricity = parseFloat('0.' + line2.substring(26, 33).trim())
  const argPerigee = parseFloat(line2.substring(34, 42))
  const meanAnomaly = parseFloat(line2.substring(43, 51))
  const meanMotion = parseFloat(line2.substring(52, 63))

  return { inclination, raan, eccentricity, argPerigee, meanAnomaly, meanMotion, epochYear, epochDay, bstar }
}

// ─── hooks ────────────────────────────────────────────────────────────────────

/** Current ISS position — polls every 5 s. */
export function useISSPosition() {
  return useQuery({
    queryKey: ['iss', 'position'],
    queryFn: async (): Promise<ISSPosition> => {
      const res = await fetch(`${BASE}/satellites/25544`)
      if (!res.ok) throw new Error(`ISS API: ${res.status}`)
      return normalizePosition(await res.json())
    },
    staleTime: 4_000,
    refetchInterval: 5_000,
    placeholderData: (prev) => prev,
  })
}

/** Country / timezone at the ISS position — refreshes every 25 s.
 *  Query key uses 1-decimal precision so it re-runs when the ISS moves ~0.1°. */
export function useISSCoordinates(lat: number | undefined, lng: number | undefined) {
  const latKey = lat != null ? lat.toFixed(1) : null
  const lngKey = lng != null ? lng.toFixed(1) : null

  return useQuery({
    queryKey: ['iss', 'coordinates', latKey, lngKey],
    queryFn: async (): Promise<ISSCoordinates> => {
      const res = await fetch(`${BASE}/coordinates/${lat!.toFixed(4)},${lng!.toFixed(4)}`)
      if (!res.ok) throw new Error(`ISS Coords: ${res.status}`)
      const raw = await res.json()
      return {
        lat: raw.latitude,
        lng: raw.longitude,
        timezoneId: raw.timezone_id,
        offset: raw.offset,
        countryCode: raw.country_code ?? null,
        mapUrl: raw.map_url,
      }
    },
    enabled: lat != null && lng != null,
    staleTime: 25_000,
    refetchInterval: 25_000,
    placeholderData: (prev) => prev,
  })
}

/** Future trajectory — 10 positions spread over the next 90 min.
 *  Refreshes every 5 min (orbit prediction doesn't change quickly). */
export function useISSFuturePath(currentTimestamp: number | undefined) {
  return useQuery({
    queryKey: ['iss', 'future-path', currentTimestamp ? Math.floor(currentTimestamp / 300) : null],
    queryFn: async (): Promise<ISSFuturePosition[]> => {
      const now = currentTimestamp ?? Math.floor(Date.now() / 1000)
      // 10 points every 9 min → covers 90 min (≈ 1 full orbit)
      const timestamps = Array.from({ length: 10 }, (_, i) => now + (i + 1) * 540)
      const params = new URLSearchParams({ timestamps: timestamps.join(','), units: 'kilometers' })
      const res = await fetch(`${BASE}/satellites/25544/positions?${params}`)
      if (!res.ok) throw new Error(`ISS FuturePath: ${res.status}`)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (await res.json()).map((p: any): ISSFuturePosition => ({
        lat: p.latitude,
        lng: p.longitude,
        altitude: p.altitude,
        timestamp: p.timestamp,
        visibility: p.visibility,
      }))
    },
    enabled: currentTimestamp != null,
    staleTime: 5 * 60_000,
    refetchInterval: 5 * 60_000,
    placeholderData: (prev) => prev,
  })
}

/** TLE (Two-Line Element) data — refreshes every hour. */
export function useISSTLE() {
  return useQuery({
    queryKey: ['iss', 'tle'],
    queryFn: async (): Promise<ISSTLE> => {
      const res = await fetch(`${BASE}/satellites/25544/tles`)
      if (!res.ok) throw new Error(`ISS TLE: ${res.status}`)
      const raw = await res.json()
      const parsed = parseTLE(raw.line1 as string, raw.line2 as string)
      return {
        requestedTimestamp: raw.requested_timestamp,
        tleTimestamp: raw.tle_timestamp,
        id: raw.id,
        name: raw.name,
        header: raw.header,
        line1: raw.line1,
        line2: raw.line2,
        ...parsed,
      } as ISSTLE
    },
    staleTime: 60 * 60_000,
    refetchInterval: 60 * 60_000,
  })
}
