import { useQuery } from '@tanstack/react-query'
import type { WikiSummary, WikiLangCode } from './types/wikipedia'

async function fetchRandomArticle(lang: WikiLangCode): Promise<WikiSummary> {
  const res = await fetch(
    `https://${lang}.wikipedia.org/api/rest_v1/page/random/summary`,
    { headers: { Accept: 'application/json' } },
  )
  if (!res.ok) throw new Error(`Wikipedia API ${res.status}`)
  return res.json() as Promise<WikiSummary>
}

export function useRandomWikipedia(lang: WikiLangCode, seed: number) {
  return useQuery<WikiSummary>({
    queryKey: ['wikipedia-random', lang, seed],
    queryFn: () => fetchRandomArticle(lang),
    staleTime: Infinity,
    gcTime: 1000 * 60 * 30,
  })
}
