import { useQuery } from '@tanstack/react-query'
import { fetchOk } from '@/lib/http'
import { queryKeys } from '@/lib/query-keys'
import type { RadarFrame } from '@/features/weather/types'

type RawFrame = { time: number; path: string }
type RawWeatherMaps = { host: string; radar: { past?: RawFrame[]; nowcast?: RawFrame[] } }

// 256px tiles, color scheme 2 (Universal Blue), smoothed, with snow
export function parseRadarFrames(raw: RawWeatherMaps): RadarFrame[] {
  return [...(raw.radar.past ?? []), ...(raw.radar.nowcast ?? [])].map((frame) => ({
    time: frame.time,
    tileUrl: `${raw.host}${frame.path}/256/{z}/{x}/{y}/2/1_1.png`,
  }))
}

/** The last two hours of radar in 10-minute frames; RainViewer publishes a new one every 10 minutes. */
export function useRadarFrames() {
  return useQuery({
    queryKey: queryKeys.radarFrames(),
    queryFn: async ({ signal }) => parseRadarFrames(await (await fetchOk('https://api.rainviewer.com/public/weather-maps.json', 'RainViewer', { signal })).json()),
    staleTime: 5 * 60_000,
    refetchInterval: 5 * 60_000,
  })
}
