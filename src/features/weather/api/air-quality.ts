import { useQuery } from '@tanstack/react-query'
import { fetchOk } from '@/lib/http'
import { DEFAULT_COORDS } from './open-meteo'
import { queryKeys } from '@/lib/query-keys'
import type { AirQuality, AQICategory } from '@/features/weather/types'

// Open-Meteo Air Quality API: no key, CORS-enabled
const BASE = 'https://air-quality-api.open-meteo.com/v1/air-quality'

function usAqiToCategory(aqi: number): AQICategory {
  if (aqi <= 50) return 'good'
  if (aqi <= 100) return 'moderate'
  if (aqi <= 150) return 'unhealthy-sensitive'
  if (aqi <= 200) return 'unhealthy'
  if (aqi <= 300) return 'very-unhealthy'
  return 'hazardous'
}

type RawAirQuality = { hourly?: Record<string, (number | null)[] | string[] | undefined> }

export function normalizeAirMeteo(raw: RawAirQuality, lat: number, lng: number, now: number): AirQuality {
  const hourly = raw.hourly ?? {}
  const times = (hourly.time ?? []) as string[]
  // Latest hour that isn't in the future (the response also includes forecast hours)
  let currentIndex = times.length - 1
  for (let index = times.length - 1; index >= 0; index--) {
    if (new Date(times[index]).getTime() <= now) {
      currentIndex = index
      break
    }
  }

  // Sensors report gaps as null: walk back to the most recent reading
  const latest = (key: string): number => {
    const values = (hourly[key] ?? []) as (number | null)[]
    for (let index = currentIndex; index >= 0; index--) {
      const value = values[index]
      if (value != null) return value
    }
    return 0
  }

  const pm25 = latest('pm2_5')
  const pm10 = latest('pm10')
  const no2  = latest('nitrogen_dioxide')
  const o3   = latest('ozone')
  const aqi  = latest('us_aqi') || latest('european_aqi') || 0

  return {
    location: { lat, lng },
    aqi: Math.round(aqi),
    pm25,
    pm10,
    no2,
    o3,
    category: usAqiToCategory(aqi),
    updatedAt: now,
  }
}

async function fetchAirQuality(lat: number, lng: number, signal: AbortSignal): Promise<AirQuality> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    hourly: 'pm10,pm2_5,nitrogen_dioxide,ozone,us_aqi,european_aqi',
    timezone: 'auto',
    forecast_days: '1',
    past_days: '1',
  })
  const response = await fetchOk(`${BASE}?${params}`, 'Open-Meteo AQ', { signal })
  return normalizeAirMeteo(await response.json(), lat, lng, Date.now())
}

export function useAirQuality(coords?: { lat: number; lng: number }) {
  const { lat, lng } = coords ?? DEFAULT_COORDS
  return useQuery({
    queryKey: queryKeys.airQuality(lat, lng),
    queryFn: ({ signal }) => fetchAirQuality(lat, lng, signal),
    staleTime: 10 * 60_000,
    refetchInterval: 20 * 60_000,
  })
}
