import { useQuery } from '@tanstack/react-query'
import type { AirQuality, AQICategory } from './types/air'

// Open-Meteo Air Quality API — sem chave, sem CORS
const BASE = 'https://air-quality-api.open-meteo.com/v1/air-quality'

function usAqiToCategory(aqi: number): AQICategory {
  if (aqi <= 50) return 'good'
  if (aqi <= 100) return 'moderate'
  if (aqi <= 150) return 'unhealthy-sensitive'
  if (aqi <= 200) return 'unhealthy'
  if (aqi <= 300) return 'very-unhealthy'
  return 'hazardous'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeAirMeteo(raw: any, lat: number, lng: number): AirQuality {
  const hourly = raw.hourly ?? {}
  // Pegar o índice da hora mais recente com dado disponível
  const times: string[] = hourly.time ?? []
  const now = Date.now()
  let bestIdx = times.length - 1
  for (let i = times.length - 1; i >= 0; i--) {
    if (new Date(times[i]).getTime() <= now) {
      bestIdx = i
      break
    }
  }

  const get = (key: string): number => {
    const arr: number[] = hourly[key] ?? []
    // Busca para trás o primeiro valor não-nulo
    for (let i = bestIdx; i >= 0; i--) {
      if (arr[i] != null) return arr[i]
    }
    return 0
  }

  const pm25 = get('pm2_5')
  const pm10 = get('pm10')
  const no2  = get('nitrogen_dioxide')
  const o3   = get('ozone')
  const aqi  = get('us_aqi') || get('european_aqi') || 0

  return {
    location: { lat, lng },
    aqi: Math.round(aqi),
    pm25,
    pm10,
    no2,
    o3,
    category: usAqiToCategory(aqi),
    updatedAt: Date.now(),
  }
}

async function fetchAirQuality(lat: number, lng: number): Promise<AirQuality> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    hourly: 'pm10,pm2_5,nitrogen_dioxide,ozone,us_aqi,european_aqi',
    timezone: 'auto',
    forecast_days: '1',
    past_days: '1',
  })
  const res = await fetch(`${BASE}?${params}`)
  if (!res.ok) throw new Error(`Open-Meteo AQ: ${res.status}`)
  const raw = await res.json()
  return normalizeAirMeteo(raw, lat, lng)
}

export function useAirQuality(coords?: { lat: number; lng: number }) {
  const lat = coords?.lat ?? -23.5505
  const lng = coords?.lng ?? -46.6333
  return useQuery({
    queryKey: ['air', lat, lng],
    queryFn: () => fetchAirQuality(lat, lng),
    staleTime: 10 * 60_000,
    refetchInterval: 20 * 60_000,
  })
}
