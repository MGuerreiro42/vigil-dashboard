import { useQuery } from '@tanstack/react-query'
import { fetchOk } from '@/lib/http'
import { queryKeys } from './queryKeys'
import type { WikiSummary, WikiLangCode } from './types/wikipedia'

async function fetchRandomArticle(lang: WikiLangCode, signal: AbortSignal): Promise<WikiSummary> {
  const response = await fetchOk(
    `https://${lang}.wikipedia.org/api/rest_v1/page/random/summary`,
    'Wikipedia',
    { headers: { Accept: 'application/json' }, signal },
  )
  return response.json() as Promise<WikiSummary>
}

export function useRandomWikipedia(lang: WikiLangCode, seed: number) {
  return useQuery<WikiSummary>({
    queryKey: queryKeys.wikipedia.random(lang, seed),
    queryFn: ({ signal }) => fetchRandomArticle(lang, signal),
    staleTime: Infinity,
    gcTime: 1000 * 60 * 30,
  })
}
