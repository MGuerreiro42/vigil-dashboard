import { useQuery } from '@tanstack/react-query'
import { fetchOk } from '@/lib/http'
import { queryKeys } from './queryKeys'
import type { GithubRepo } from './types/github'

const BASE = 'https://api.github.com'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeRepo(raw: any): GithubRepo {
  return {
    id: raw.id,
    name: raw.name,
    fullName: raw.full_name,
    description: raw.description ?? '',
    language: raw.language ?? null,
    stars: raw.stargazers_count ?? 0,
    forks: raw.forks_count ?? 0,
    url: raw.html_url,
    topics: raw.topics ?? [],
  }
}

async function fetchTrendingRepos(signal: AbortSignal, language?: string): Promise<GithubRepo[]> {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const query = language ? `created:>${since} language:${language}` : `created:>${since}`
  const params = new URLSearchParams({
    q: query,
    sort: 'stars',
    order: 'desc',
    per_page: '15',
  })
  const response = await fetchOk(`${BASE}/search/repositories?${params}`, 'GitHub', {
    headers: { Accept: 'application/vnd.github.v3+json' },
    signal,
  })
  return ((await response.json()).items ?? []).map(normalizeRepo)
}

export function useTrendingRepos(language?: string) {
  return useQuery({
    queryKey: queryKeys.github.trending(language),
    queryFn: ({ signal }) => fetchTrendingRepos(signal, language),
    staleTime: 15 * 60_000,
    refetchInterval: 30 * 60_000,
  })
}
