import { expect, it } from 'vitest'
import { summarizeEdits, toLiveEdit, type RawRecentChange } from './wiki-edits'
import { parseBlueskyTrends } from '@/features/pulse/api/bluesky-trends'

const change = (overrides: Partial<RawRecentChange>): RawRecentChange => ({
  id: 1, type: 'edit', namespace: 0, title: 'Curitiba', user: 'Alice', bot: false,
  server_name: 'pt.wikipedia.org', length: { old: 100, new: 140 }, ...overrides,
})

it('keeps Wikipedia article edits and builds a link when the stream omits one', () => {
  expect(toLiveEdit(change({ title: 'São Paulo' }), 50)).toEqual({
    id: 1, title: 'São Paulo', url: 'https://pt.wikipedia.org/wiki/S%C3%A3o_Paulo', user: 'Alice',
    isBot: false, isNewArticle: false, language: 'pt', byteDelta: 40, receivedAt: 50,
  })
  expect(toLiveEdit(change({ type: 'new', length: { new: 900 } }), 50)).toMatchObject({ isNewArticle: true, byteDelta: 900 })
})

it('drops other wikis, other namespaces and non-edit events', () => {
  expect(toLiveEdit(change({ server_name: 'www.wikidata.org' }), 0)).toBeNull()
  expect(toLiveEdit(change({ namespace: 14 }), 0)).toBeNull()
  expect(toLiveEdit(change({ type: 'categorize' }), 0)).toBeNull()
})

it('summarizes the window into rate, bot share, languages and per-second buckets', () => {
  const now = 1000
  const edits = [
    toLiveEdit(change({ id: 1 }), now - 0.5),
    toLiveEdit(change({ id: 2, bot: true }), now - 0.2),
    toLiveEdit(change({ id: 3, server_name: 'en.wikipedia.org', type: 'new' }), now - 59.5),
  ].filter((edit) => edit !== null)
  const summary = summarizeEdits(edits, now)
  expect(summary).toMatchObject({ perMinute: 3, newArticles: 1 })
  expect(summary.botShare).toBeCloseTo(1 / 3)
  expect(summary.topLanguages).toEqual([{ language: 'pt', count: 2 }, { language: 'en', count: 1 }])
  expect(summary.perSecond[59]).toBe(2)
  expect(summary.perSecond[0]).toBe(1)
})

it('maps Bluesky topics with an absolute link', () => {
  expect(parseBlueskyTrends({ topics: [
    { topic: 'No Kings protests', displayName: 'No Kings protests October 17', description: 'Rallies urging early voting.', link: '/profile/did:plc:x/feed/05af' },
    { topic: 'fallback name', description: '', link: '/profile/did:plc:x/feed/08b1' },
  ] })).toEqual([
    { id: '/profile/did:plc:x/feed/05af', name: 'No Kings protests October 17', description: 'Rallies urging early voting.', url: 'https://bsky.app/profile/did:plc:x/feed/05af' },
    { id: '/profile/did:plc:x/feed/08b1', name: 'fallback name', description: null, url: 'https://bsky.app/profile/did:plc:x/feed/08b1' },
  ])
})
