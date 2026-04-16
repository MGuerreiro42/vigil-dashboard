import { useQuery } from '@tanstack/react-query'
import type { HNStory } from './types/hackernews'

const BASE = 'https://hacker-news.firebaseio.com/v0'

async function fetchStory(id: number): Promise<HNStory | null> {
  const res = await fetch(`${BASE}/item/${id}.json`)
  if (!res.ok) return null
  const raw = await res.json()
  if (!raw || raw.deleted || raw.dead) return null
  return {
    id: raw.id,
    title: raw.title ?? '',
    url: raw.url ?? null,
    score: raw.score ?? 0,
    descendants: raw.descendants ?? 0,
    by: raw.by ?? '',
    time: raw.time ?? 0,
    type: raw.type ?? 'story',
  }
}

async function fetchTopStories(limit = 15): Promise<HNStory[]> {
  const res = await fetch(`${BASE}/topstories.json`)
  if (!res.ok) throw new Error(`HackerNews: ${res.status}`)
  const ids: number[] = await res.json()
  const stories = await Promise.all(ids.slice(0, limit).map(fetchStory))
  return stories.filter((s): s is HNStory => s !== null)
}

export function useTopStories(limit = 15) {
  return useQuery({
    queryKey: ['hn', 'top', limit],
    queryFn: () => fetchTopStories(limit),
    staleTime: 10 * 60_000,
    refetchInterval: 15 * 60_000,
  })
}
