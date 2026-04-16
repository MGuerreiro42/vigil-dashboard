import { useQuery } from '@tanstack/react-query'
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

async function fetchEarthquakes(minMag = 2.5, limitDays = 7): Promise<Earthquake[]> {
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
  const res = await fetch(`${BASE}?${params}`)
  if (!res.ok) throw new Error(`USGS: ${res.status}`)
  const raw = await res.json()
  return (raw.features ?? []).map(normalizeQuake)
}

export function useEarthquakes(minMag = 2.5) {
  return useQuery({
    queryKey: ['earthquakes', minMag],
    queryFn: () => fetchEarthquakes(minMag),
    staleTime: 2 * 60_000,
    refetchInterval: 5 * 60_000,
  })
}
