import { useQuery } from '@tanstack/react-query'
import { fetchOk } from '@/lib/http'
import { queryKeys } from './queryKeys'
import type { Earthquake } from './types/earthquake'

const BASE = 'https://earthquake.usgs.gov/fdsnws/event/1/query'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeQuake(feature: any): Earthquake {
  const p = feature.properties
  const [lng, lat] = feature.geometry.coordinates
  return {
    id: feature.id,
    magnitude: p.mag ?? 0,
    place: p.place ?? 'Unknown',
    time: p.time ?? Date.now(),
    depth: feature.geometry.coordinates[2] ?? 0,
    location: { lat, lng },
    significance: p.sig ?? 0,
    url: p.url ?? '',
    tsunamiRisk: p.tsunami === 1,
  }
}

async function fetchEarthquakes(minMag: number, signal: AbortSignal, limitDays = 7): Promise<Earthquake[]> {
  const startTime = new Date(Date.now() - limitDays * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0]

  const params = new URLSearchParams({
    format: 'geojson',
    starttime: startTime,
    minmagnitude: String(minMag),
    orderby: 'time',
    limit: '100',
  })
  const response = await fetchOk(`${BASE}?${params}`, 'USGS', { signal })
  return ((await response.json()).features ?? []).map(normalizeQuake)
}

export function useEarthquakes(minMag = 2.5) {
  return useQuery({
    queryKey: queryKeys.earthquakes(minMag),
    queryFn: ({ signal }) => fetchEarthquakes(minMag, signal),
    staleTime: 2 * 60_000,
    refetchInterval: 5 * 60_000,
  })
}
