import { describe, expect, it } from 'vitest'
import type { GithubRepo } from '@/features/github/types'
import { meanForkRatio, median, repoLanguages, repoSummary, sortRepos, starBuckets, starsByLanguage } from './github-terminal'

const repo = (name: string, language: string | null, stars: number, forks: number): GithubRepo => ({
  id: stars, name, fullName: `owner/${name}`, description: '', language, stars, forks, url: '', topics: [],
})

const repos = [repo('beta', 'Rust', 1_200, 300), repo('alpha', 'Go', 4_800, 240), repo('gamma', 'Rust', 90, 0), repo('delta', null, 5_000, 1_000)]

describe('github terminal', () => {
  it('sorts by stars, forks and name', () => {
    expect(sortRepos(repos, 'starsDesc').map((item) => item.name)).toEqual(['delta', 'alpha', 'beta', 'gamma'])
    expect(sortRepos(repos, 'starsAsc')[0].name).toBe('gamma')
    expect(sortRepos(repos, 'forks')[0].name).toBe('delta')
    expect(sortRepos(repos, 'name')[0].name).toBe('alpha')
  })

  it('summarises the list and its languages', () => {
    expect(repoLanguages(repos)).toEqual(['Rust', 'Go'])
    expect(repoSummary(repos)).toEqual({ count: 4, stars: 11_090, forks: 1_540, topLanguage: 'Rust', topLanguageCount: 2 })
    expect(starsByLanguage(repos)).toEqual([
      { language: null, stars: 5_000 }, { language: 'Go', stars: 4_800 }, { language: 'Rust', stars: 1_290 },
    ])
  })

  it('buckets stars with the upper bound exclusive', () => {
    expect(starBuckets(repos).map((bucket) => bucket.count)).toEqual([1, 0, 0, 2, 1])
  })

  it('takes the median and mean fork ratio, skipping repos without stars', () => {
    expect(median([3, 1, 2])).toBe(2)
    expect(median([4, 1, 2, 3])).toBe(2.5)
    expect(median([])).toBe(0)
    expect(meanForkRatio([repo('a', null, 100, 20), repo('b', null, 100, 40), repo('c', null, 0, 5)])).toBeCloseTo(0.3)
  })
})
