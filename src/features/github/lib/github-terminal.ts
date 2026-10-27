import type { GithubRepo } from '@/features/github/types'

export type RepoSort = 'starsDesc' | 'starsAsc' | 'forks' | 'name'

export function sortRepos(repos: GithubRepo[], sort: RepoSort): GithubRepo[] {
  const sorted = [...repos]
  if (sort === 'starsDesc') return sorted.sort((left, right) => right.stars - left.stars)
  if (sort === 'starsAsc') return sorted.sort((left, right) => left.stars - right.stars)
  if (sort === 'forks') return sorted.sort((left, right) => right.forks - left.forks)
  return sorted.sort((left, right) => left.name.localeCompare(right.name))
}

/** Languages present in the list, most repos first; repos without one are left out of the filter. */
export function repoLanguages(repos: GithubRepo[]): string[] {
  const counts = new Map<string, number>()
  for (const repo of repos) if (repo.language) counts.set(repo.language, (counts.get(repo.language) ?? 0) + 1)
  return [...counts].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0])).map(([language]) => language)
}

export function repoSummary(repos: GithubRepo[]) {
  const languages = repoLanguages(repos)
  const topLanguage = languages[0] ?? null
  return {
    count: repos.length,
    stars: repos.reduce((sum, repo) => sum + repo.stars, 0),
    forks: repos.reduce((sum, repo) => sum + repo.forks, 0),
    topLanguage,
    topLanguageCount: repos.filter((repo) => repo.language === topLanguage).length,
  }
}

/** Stars summed per language, biggest first; `null` collects repos without a language. */
export function starsByLanguage(repos: GithubRepo[]): { language: string | null; stars: number }[] {
  const sums = new Map<string | null, number>()
  for (const repo of repos) sums.set(repo.language, (sums.get(repo.language) ?? 0) + repo.stars)
  return [...sums].map(([language, stars]) => ({ language, stars })).sort((left, right) => right.stars - left.stars)
}

export const STAR_BUCKETS = [
  { id: 'tiny', label: '0–100', min: 0 },
  { id: 'small', label: '100–500', min: 100 },
  { id: 'medium', label: '500–1k', min: 500 },
  { id: 'large', label: '1k–5k', min: 1_000 },
  { id: 'huge', label: '5k+', min: 5_000 },
] as const

export function starBuckets(repos: GithubRepo[]) {
  return STAR_BUCKETS.map((bucket, index) => {
    const next = STAR_BUCKETS[index + 1]?.min ?? Infinity
    return { id: bucket.id, label: bucket.label, count: repos.filter((repo) => repo.stars >= bucket.min && repo.stars < next).length }
  })
}

export function median(values: number[]): number {
  if (!values.length) return 0
  const sorted = [...values].sort((left, right) => left - right)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

export function forkRatio(repo: Pick<GithubRepo, 'stars' | 'forks'>): number | null {
  return repo.stars ? repo.forks / repo.stars : null
}

export function meanForkRatio(repos: GithubRepo[]): number {
  const ratios = repos.map(forkRatio).filter((ratio) => ratio !== null)
  return ratios.length ? ratios.reduce((sum, ratio) => sum + ratio, 0) / ratios.length : 0
}
