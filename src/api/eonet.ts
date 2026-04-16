import { useQuery } from '@tanstack/react-query'
import type { NaturalEvent, NaturalEventTrackPoint } from './types/eonet'

const BASE = 'https://eonet.gsfc.nasa.gov/api/v3'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeEvent(raw: any): NaturalEvent | null {
  const geometry: any[] = raw.geometry ?? []
  if (!geometry.length) return null

  // Build full track (all geometry points in order)
  const track: NaturalEventTrackPoint[] = geometry.map(g => ({
    lat: g.coordinates?.[1] ?? 0,
    lng: g.coordinates?.[0] ?? 0,
    date: g.date ?? '',
    magnitude: g.magnitudeValue ?? null,
  }))

  // Latest position
  const latest = geometry[geometry.length - 1]
  const coords = latest?.coordinates ?? [0, 0]

  // Best magnitude: last geometry point with a value
  const withMag = [...geometry].reverse().find(g => g.magnitudeValue != null)

  return {
    id: raw.id,
    title: raw.title ?? '',
    categoryId: raw.categories?.[0]?.id ?? 'unknown',
    categoryTitle: raw.categories?.[0]?.title ?? 'Unknown',
    status: raw.closed ? 'closed' : 'open',
    date: latest?.date ?? new Date().toISOString(),
    lat: coords[1],
    lng: coords[0],
    sourceUrl: raw.sources?.[0]?.url ?? null,
    magnitude: withMag?.magnitudeValue ?? null,
    magnitudeUnit: withMag?.magnitudeUnit ?? null,
    description: raw.description ?? null,
    track,
  }
}

async function fetchNaturalEvents(): Promise<NaturalEvent[]> {
  const params = new URLSearchParams({ status: 'open', days: '20', limit: '200' })
  const res = await fetch(`${BASE}/events?${params}`)
  if (!res.ok) throw new Error(`EONET: ${res.status}`)
  const data = await res.json()
  return (data.events ?? [])
    .map(normalizeEvent)
    .filter(Boolean) as NaturalEvent[]
}

export function useNaturalEvents() {
  return useQuery({
    queryKey: ['eonet', 'events'],
    queryFn: fetchNaturalEvents,
    staleTime: 5 * 60_000,
    refetchInterval: 10 * 60_000,
  })
}
