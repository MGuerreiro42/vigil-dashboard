import { useQuery } from '@tanstack/react-query'
import { fetchOk } from '@/lib/http'
import { queryKeys } from './queryKeys'
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
export function parseTLE(line1: string, line2: string): Partial<ISSTLE> {
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
    queryKey: queryKeys.iss.position(),
    queryFn: async ({ signal }): Promise<ISSPosition> => {
      const response = await fetchOk(`${BASE}/satellites/25544`, 'ISS', { signal })
      return normalizePosition(await response.json())
    },
    staleTime: 4_000,
    refetchInterval: 5_000,
    placeholderData: (previous) => previous,
  })
}

const COORDINATES_WINDOW_S = 25

/** Country / timezone under the ISS, looked up once per 25 s window of its position. */
export function useISSCoordinates(position: ISSPosition | undefined) {
  // Keyed by time, not lat/lng: the ISS moves ~0.35° per 5 s poll, so a coordinate key changed every poll
  const timeWindow = position ? Math.floor(position.timestamp / COORDINATES_WINDOW_S) : null

  return useQuery({
    queryKey: queryKeys.iss.coordinates(timeWindow),
    queryFn: async ({ signal }): Promise<ISSCoordinates> => {
      const { lat, lng } = position!
      const response = await fetchOk(`${BASE}/coordinates/${lat.toFixed(4)},${lng.toFixed(4)}`, 'ISS coordinates', { signal })
      const raw = await response.json()
      return {
        lat: raw.latitude,
        lng: raw.longitude,
        timezoneId: raw.timezone_id,
        offset: raw.offset,
        countryCode: raw.country_code ?? null,
        mapUrl: raw.map_url,
      }
    },
    enabled: position != null,
    staleTime: Infinity,
    gcTime: 60_000,
    placeholderData: (previous) => previous,
  })
}

/** Future trajectory — 10 positions spread over the next 90 min.
 *  Refreshes every 5 min (orbit prediction doesn't change quickly). */
export function useISSFuturePath(currentTimestamp: number | undefined) {
  return useQuery({
    queryKey: queryKeys.iss.futurePath(currentTimestamp ? Math.floor(currentTimestamp / 300) : null),
    queryFn: async ({ signal }): Promise<ISSFuturePosition[]> => {
      const now = currentTimestamp ?? Math.floor(Date.now() / 1000)
      // 10 points every 9 min → covers 90 min (≈ 1 full orbit)
      const timestamps = Array.from({ length: 10 }, (_, i) => now + (i + 1) * 540)
      const params = new URLSearchParams({ timestamps: timestamps.join(','), units: 'kilometers' })
      const response = await fetchOk(`${BASE}/satellites/25544/positions?${params}`, 'ISS future path', { signal })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (await response.json()).map((point: any): ISSFuturePosition => ({
        lat: point.latitude,
        lng: point.longitude,
        altitude: point.altitude,
        timestamp: point.timestamp,
        visibility: point.visibility,
      }))
    },
    enabled: currentTimestamp != null,
    staleTime: 5 * 60_000,
    refetchInterval: 5 * 60_000,
    placeholderData: (previous) => previous,
  })
}

/** TLE (Two-Line Element) data — refreshes every hour. */
export function useISSTLE() {
  return useQuery({
    queryKey: queryKeys.iss.tle(),
    queryFn: async ({ signal }): Promise<ISSTLE> => {
      const response = await fetchOk(`${BASE}/satellites/25544/tles`, 'ISS TLE', { signal })
      const raw = await response.json()
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
