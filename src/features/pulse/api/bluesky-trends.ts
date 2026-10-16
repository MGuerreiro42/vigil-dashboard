import { useQuery } from '@tanstack/react-query'
import { fetchOk } from '@/lib/http'
import { queryKeys } from '@/lib/query-keys'
import type { BlueskyTrend } from '@/features/pulse/types'

type RawTopic = { topic: string; displayName?: string; description?: string; link: string }

export function parseBlueskyTrends(raw: { topics?: RawTopic[] }): BlueskyTrend[] {
  return (raw.topics ?? []).map((topic) => ({
    id: topic.link,
    name: topic.displayName ?? topic.topic,
    description: topic.description || null,
    url: `https://bsky.app${topic.link}`,
  }))
}

export function useBlueskyTrends() {
  return useQuery({
    queryKey: queryKeys.blueskyTrends(),
    // getTrends adds post counts but takes 30-60 s to answer; getTrendingTopics is sub-second
    queryFn: async ({ signal }) =>
      parseBlueskyTrends(await (await fetchOk('https://public.api.bsky.app/xrpc/app.bsky.unspecced.getTrendingTopics?limit=15', 'Bluesky', { signal })).json()),
    staleTime: 5 * 60_000,
    refetchInterval: 10 * 60_000,
  })
}
