import { useQuery } from '@tanstack/react-query'
import { fetchOk } from '@/lib/http'
import { queryKeys } from '@/lib/query-keys'
import type { HackerNewsStory } from '@/features/hacker-news/types'

type RawHit = {
  objectID: string
  title: string
  url?: string | null
  author: string
  points: number | null
  num_comments: number | null
  created_at_i: number
}

export function parseFrontPage(raw: { hits?: RawHit[] }): HackerNewsStory[] {
  return (raw.hits ?? []).map((hit) => ({
    id: hit.objectID,
    title: hit.title,
    url: hit.url || null,
    domain: hit.url && URL.canParse(hit.url) ? new URL(hit.url).hostname.replace(/^www\./, '') : null,
    author: hit.author,
    points: hit.points ?? 0,
    comments: hit.num_comments ?? 0,
    createdAt: hit.created_at_i,
    discussionUrl: `https://news.ycombinator.com/item?id=${hit.objectID}`,
  }))
}

const FRONT_PAGE_URL = 'https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=30&attributesToRetrieve=title,url,author,points,num_comments,created_at_i&attributesToHighlight=none'

export function useHackerNewsFrontPage() {
  return useQuery({
    queryKey: queryKeys.hackerNews(),
    queryFn: async ({ signal }) => parseFrontPage(await (await fetchOk(FRONT_PAGE_URL, 'Hacker News', { signal })).json()),
    staleTime: 5 * 60_000,
    refetchInterval: 10 * 60_000,
  })
}
