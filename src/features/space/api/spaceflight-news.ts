import { useQuery } from '@tanstack/react-query'
import { fetchOk } from '@/lib/http'
import { queryKeys } from '@/lib/query-keys'
import type { SpaceArticle } from '@/features/space/types'

type RawArticle = { id: number; title: string; url: string; image_url: string | null; news_site: string; summary: string; published_at: string }

export function parseSpaceArticles(raw: { results?: RawArticle[] }): SpaceArticle[] {
  return (raw.results ?? []).map((article) => ({
    id: article.id,
    title: article.title,
    site: article.news_site,
    url: article.url,
    image: article.image_url || null,
    publishedAt: article.published_at,
    summary: article.summary,
  }))
}

export function useSpaceNews() {
  return useQuery({
    queryKey: queryKeys.space.news(),
    queryFn: async ({ signal }) =>
      parseSpaceArticles(await (await fetchOk('https://api.spaceflightnewsapi.net/v4/articles/?limit=12', 'Spaceflight News', { signal })).json()),
    staleTime: 15 * 60_000,
    refetchInterval: 30 * 60_000,
  })
}
