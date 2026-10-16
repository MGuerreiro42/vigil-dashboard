import { useQuery } from '@tanstack/react-query'
import { fetchOk } from '@/lib/http'
import { queryKeys } from '@/lib/query-keys'
import type { NearEarthObject } from '@/features/space/types'

// DEMO_KEY allows ~10 requests/hour per IP; set VITE_NASA_API_KEY to a free key (api.nasa.gov) for 1,000/hour
const NASA_API_KEY = import.meta.env.VITE_NASA_API_KEY ?? 'DEMO_KEY'

type RawApproach = {
  close_approach_date_full: string
  epoch_date_close_approach: number
  miss_distance: { lunar: string; kilometers: string }
  relative_velocity: { kilometers_per_second: string }
}
type RawNeo = {
  id: string
  name: string
  nasa_jpl_url: string
  is_potentially_hazardous_asteroid: boolean
  estimated_diameter: { meters: { estimated_diameter_min: number; estimated_diameter_max: number } }
  close_approach_data: RawApproach[]
}

export function parseNeoFeed(raw: { near_earth_objects?: Record<string, RawNeo[]> }): NearEarthObject[] {
  return Object.values(raw.near_earth_objects ?? {})
    .flat()
    .filter((neo) => neo.close_approach_data.length > 0)
    .map((neo) => {
      const approach = neo.close_approach_data[0]
      return {
        id: neo.id,
        // "(2026 TA3)" → "2026 TA3"
        name: neo.name.replace(/^\((.*)\)$/, '$1'),
        diameterMinMeters: neo.estimated_diameter.meters.estimated_diameter_min,
        diameterMaxMeters: neo.estimated_diameter.meters.estimated_diameter_max,
        hazardous: neo.is_potentially_hazardous_asteroid,
        closestApproach: new Date(approach.epoch_date_close_approach).toISOString(),
        missDistanceLunar: Number(approach.miss_distance.lunar),
        missDistanceKm: Number(approach.miss_distance.kilometers),
        velocityKmS: Number(approach.relative_velocity.kilometers_per_second),
        url: neo.nasa_jpl_url,
      }
    })
    .sort((first, second) => first.missDistanceLunar - second.missDistanceLunar)
}

export function useNearEarthObjects() {
  return useQuery({
    queryKey: queryKeys.space.asteroids(new Date().toISOString().slice(0, 10)),
    queryFn: async ({ signal }) =>
      parseNeoFeed(await (await fetchOk(`https://api.nasa.gov/neo/rest/v1/feed/today?api_key=${NASA_API_KEY}`, 'NASA NeoWs', { signal })).json()),
    // The feed is per day (the date is in the key) and NeoWs is slow with a tight DEMO_KEY quota:
    // fetch once per day instead of polling
    staleTime: Infinity,
  })
}
