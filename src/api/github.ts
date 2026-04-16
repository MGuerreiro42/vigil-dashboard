import { useQuery } from '@tanstack/react-query'
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

async function fetchTrendingRepos(language?: string): Promise<GithubRepo[]> {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const q = language ? `created:>${since} language:${language}` : `created:>${since}`
  const params = new URLSearchParams({
    q,
    sort: 'stars',
    order: 'desc',
    per_page: '15',
  })
  const res = await fetch(`${BASE}/search/repositories?${params}`, {
    headers: { Accept: 'application/vnd.github.v3+json' },
  })
  if (!res.ok) throw new Error(`GitHub: ${res.status}`)
  const raw = await res.json()
  return (raw.items ?? []).map(normalizeRepo)
}

export function useTrendingRepos(language?: string) {
  return useQuery({
    queryKey: ['github', 'trending', language],
    queryFn: () => fetchTrendingRepos(language),
    staleTime: 15 * 60_000,
    refetchInterval: 30 * 60_000,
  })
}
