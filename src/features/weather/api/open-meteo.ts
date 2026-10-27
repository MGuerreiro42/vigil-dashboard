import { useQuery } from '@tanstack/react-query'
import { fetchOk } from '@/lib/http'
import { queryKeys } from '@/lib/query-keys'
import type { WeatherData, HourlyPoint } from '@/features/weather/types'

const BASE = 'https://api.open-meteo.com/v1/forecast'

// São Paulo, shown until (or instead of) the user's location
export const DEFAULT_COORDS = { lat: -23.5505, lng: -46.6333 }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeWeather(raw: any, coords: { lat: number; lng: number }): WeatherData {
  const currentRaw = raw.current
  const dailyRaw = raw.daily
  const hourlyRaw = raw.hourly
  const forecastDays = dailyRaw.time?.length ?? 0

  // 25 points so the 24 h chart spans a whole day with a label every 4 h at both ends
  const nowIso = new Date().toISOString().slice(0, 13) // "2024-04-14T15"
  const hourlyTimes: string[] = hourlyRaw.time ?? []
  const startIdx = Math.max(0, hourlyTimes.findIndex((time: string) => time >= nowIso))
  const hourly: HourlyPoint[] = hourlyTimes.slice(startIdx, startIdx + 25).map((_: string, i: number) => ({
    time: hourlyTimes[startIdx + i],
    temp: hourlyRaw.temperature_2m?.[startIdx + i] ?? 0,
    precipProb: hourlyRaw.precipitation_probability?.[startIdx + i] ?? 0,
    windSpeed: hourlyRaw.wind_speed_10m?.[startIdx + i] ?? 0,
  }))

  return {
    location: coords,
    current: {
      temp: currentRaw.temperature_2m ?? 0,
      feelsLike: currentRaw.apparent_temperature ?? 0,
      humidity: currentRaw.relative_humidity_2m ?? 0,
      windSpeed: currentRaw.wind_speed_10m ?? 0,
      weatherCode: currentRaw.weather_code ?? 0,
      isDay: currentRaw.is_day === 1,
    },
    forecast: Array.from({ length: forecastDays }, (_, i) => ({
      date: dailyRaw.time[i],
      tempMax: dailyRaw.temperature_2m_max[i] ?? 0,
      tempMin: dailyRaw.temperature_2m_min[i] ?? 0,
      precipitationProb: dailyRaw.precipitation_probability_max[i] ?? 0,
      weatherCode: dailyRaw.weather_code[i] ?? 0,
      sunrise: dailyRaw.sunrise?.[i] ?? '',
      sunset: dailyRaw.sunset?.[i] ?? '',
      uvIndexMax: dailyRaw.uv_index_max?.[i] ?? 0,
    })),
    hourly,
  }
}

async function fetchWeather(lat: number, lng: number, signal: AbortSignal): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    current: 'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day',
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code,sunrise,sunset,uv_index_max',
    hourly: 'temperature_2m,precipitation_probability,wind_speed_10m',
    timezone: 'auto',
    forecast_days: '7',
  })
  const response = await fetchOk(`${BASE}?${params}`, 'Open-Meteo', { signal })
  return normalizeWeather(await response.json(), { lat, lng })
}

export function useWeather(coords?: { lat: number; lng: number }) {
  const { lat, lng } = coords ?? DEFAULT_COORDS
  return useQuery({
    queryKey: queryKeys.weather(lat, lng),
    queryFn: ({ signal }) => fetchWeather(lat, lng, signal),
    staleTime: 10 * 60_000,
    refetchInterval: 15 * 60_000,
  })
}
