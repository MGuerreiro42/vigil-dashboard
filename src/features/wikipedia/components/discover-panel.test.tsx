import { act, fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { WikiSummary } from '@/features/wikipedia/types'
import { DiscoverPanel } from './discover-panel'

// Each seed draws a new article, and a cached seed may come back as another one (refresh, GC, language)
let draws = 0
const article = (title: string) => ({ title, extract: '', timestamp: '2026-01-01', lang: 'pt', content_urls: { desktop: { page: '#' } } }) as unknown as WikiSummary
vi.mock('@/features/wikipedia/api/wikipedia', async () => {
  const { useMemo } = await import('react')
  return {
    useRandomWikipedia: (_lang: string, seed: number) => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const data = useMemo(() => article(`a${(draws += 1)}`), [seed])
      return { data, error: null, isError: false, isPlaceholderData: false, dataUpdatedAt: 1, errorUpdatedAt: 0, refetch: () => {} }
    },
  }
})

describe('DiscoverPanel', () => {
  it('goes back to the articles already shown and forward again', () => {
    const { container } = render(<DiscoverPanel />)
    const title = () => container.querySelector('.text-title')?.textContent
    const press = (key: string) => act(() => { fireEvent.keyDown(window, { key }) })
    expect(title()).toBe('a1')
    press('n')
    press('n')
    expect(title()).toBe('a3')
    press('p')
    press('p')
    expect(title()).toBe('a1')
    press('n')
    expect(title()).toBe('a2')
    press('n')
    expect(title()).toBe('a3')
  })
})
