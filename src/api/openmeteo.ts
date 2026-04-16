import { useQuery } from '@tanstack/react-query'
import type { WeatherData, HourlyPoint } from './types/weather'

const BASE = 'https://api.open-meteo.com/v1/forecast'

const DEFAULT_COORDS = { lat: -23.5505, lng: -46.6333 }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeWeather(raw: any, coords: { lat: number; lng: number }): WeatherData {
  const c = raw.current
  const d = raw.daily
  const h = raw.hourly
  const forecastDays = d.time?.length ?? 0

  // Pegar as próximas 24h a partir da hora atual
  const nowIso = new Date().toISOString().slice(0, 13) // "2024-04-14T15"
  const hourlyTimes: string[] = h.time ?? []
  const startIdx = Math.max(0, hourlyTimes.findIndex((t: string) => t >= nowIso))
  const hourly: HourlyPoint[] = hourlyTimes.slice(startIdx, startIdx + 24).map((_: string, i: number) => ({
    time: hourlyTimes[startIdx + i],
    temp: h.temperature_2m?.[startIdx + i] ?? 0,
    precipProb: h.precipitation_probability?.[startIdx + i] ?? 0,
    windSpeed: h.wind_speed_10m?.[startIdx + i] ?? 0,
  }))

  return {
    location: coords,
    current: {
      temp: c.temperature_2m ?? 0,
      feelsLike: c.apparent_temperature ?? 0,
      humidity: c.relative_humidity_2m ?? 0,
      windSpeed: c.wind_speed_10m ?? 0,
      weatherCode: c.weather_code ?? 0,
      isDay: c.is_day === 1,
    },
    forecast: Array.from({ length: forecastDays }, (_, i) => ({
      date: d.time[i],
      tempMax: d.temperature_2m_max[i] ?? 0,
      tempMin: d.temperature_2m_min[i] ?? 0,
      precipitationProb: d.precipitation_probability_max[i] ?? 0,
      weatherCode: d.weather_code[i] ?? 0,
      sunrise: d.sunrise?.[i] ?? '',
      sunset: d.sunset?.[i] ?? '',
      uvIndexMax: d.uv_index_max?.[i] ?? 0,
    })),
    hourly,
  }
}

async function fetchWeather(lat: number, lng: number): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    current: 'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day',
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code,sunrise,sunset,uv_index_max',
    hourly: 'temperature_2m,precipitation_probability,wind_speed_10m',
    timezone: 'auto',
    forecast_days: '7',
  })
  const res = await fetch(`${BASE}?${params}`)
  if (!res.ok) throw new Error(`Open-Meteo: ${res.status}`)
  const raw = await res.json()
  return normalizeWeather(raw, { lat, lng })
}

export function useWeather(coords?: { lat: number; lng: number }) {
  const { lat, lng } = coords ?? DEFAULT_COORDS
  return useQuery({
    queryKey: ['weather', lat, lng],
    queryFn: () => fetchWeather(lat, lng),
    staleTime: 10 * 60_000,
    refetchInterval: 15 * 60_000,
  })
}
