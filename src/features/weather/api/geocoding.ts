import { useQuery } from '@tanstack/react-query'
import { fetchOk } from '@/lib/http'
import { queryKeys } from '@/lib/query-keys'
import { intlLocale } from '@/i18n'
import type { Place } from '@/features/weather/types'

type RawPlace = { id: number; name: string; latitude: number; longitude: number; country?: string; admin1?: string }

export function parsePlaces(raw: { results?: RawPlace[] }): Place[] {
  const places = (raw.results ?? []).map((place) => ({
    id: place.id,
    name: place.name,
    region: [place.admin1, place.country].filter(Boolean).join(', '),
    lat: place.latitude,
    lng: place.longitude,
  }))
  // The geocoder can list several places of one name in one region, indistinguishable in the picker: keep the first
  return places.filter((place, index) => places.findIndex((other) => other.name === place.name && other.region === place.region) === index)
}

export function useCitySearch(query: string) {
  const language = intlLocale().slice(0, 2)
  return useQuery({
    queryKey: queryKeys.citySearch(query, language),
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams({ name: query, count: '6', language, format: 'json' })
      return parsePlaces(await (await fetchOk(`https://geocoding-api.open-meteo.com/v1/search?${params}`, 'Open-Meteo Geocoding', { signal })).json())
    },
    enabled: query.length >= 2,
    staleTime: Infinity,
    // One entry per typed term: no need to keep them all for the day
    gcTime: 5 * 60_000,
  })
}
