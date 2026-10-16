import { useQuery } from '@tanstack/react-query'
import { fetchOk } from '@/lib/http'
import { queryKeys } from '@/lib/query-keys'
import type { Launch } from '@/features/space/types'

// Anonymous Launch Library 2 allows 15 requests/hour, so this refreshes slowly
const LAUNCHES_URL = 'https://ll.thespacedevs.com/2.3.0/launches/upcoming/?limit=8&mode=normal&hide_recent_previous=true'

type RawLaunch = {
  id: string
  name: string
  net: string
  status?: { abbrev?: string }
  image?: { thumbnail_url?: string; image_url?: string } | null
  launch_service_provider?: { name?: string } | null
  pad?: { location?: { name?: string } } | null
  mission?: { name?: string; description?: string; orbit?: { abbrev?: string } | null } | null
}

export function parseLaunches(raw: { results?: RawLaunch[] }): Launch[] {
  return (raw.results ?? []).map((launch) => {
    // Names read "Rocket | Mission"
    const [rocket, ...missionParts] = launch.name.split(' | ')
    const orbit = launch.mission?.orbit?.abbrev
    const description = launch.mission?.description
    return {
      id: launch.id,
      name: launch.name,
      rocket,
      mission: launch.mission?.name ?? (missionParts.join(' | ') || launch.name),
      missionDescription: description && description !== 'Details TBD.' ? description : null,
      provider: launch.launch_service_provider?.name ?? null,
      pad: launch.pad?.location?.name ?? null,
      orbit: orbit && orbit !== 'N/A' ? orbit : null,
      net: launch.net,
      status: launch.status?.abbrev ?? 'TBD',
      image: launch.image?.thumbnail_url ?? launch.image?.image_url ?? null,
    }
  })
}

export function useUpcomingLaunches() {
  return useQuery({
    queryKey: queryKeys.space.launches(),
    queryFn: async ({ signal }) => parseLaunches(await (await fetchOk(LAUNCHES_URL, 'Launch Library', { signal })).json()),
    staleTime: 30 * 60_000,
    refetchInterval: 30 * 60_000,
  })
}
