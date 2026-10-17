import { expect, it } from 'vitest'
import { readLastVisit, recordVisit } from './last-visit'

function memoryStorage() {
  const values = new Map<string, string>()
  return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value) } }
}

it('reads back the last recorded visit', () => {
  const storage = memoryStorage()
  expect(readLastVisit(storage)).toBeNull()
  recordVisit(1_760_000_000_000, storage)
  expect(readLastVisit(storage)).toBe(1_760_000_000_000)
})

it('treats unreadable or garbage storage as a first visit', () => {
  const broken = { getItem: () => { throw new Error('denied') }, setItem: () => { throw new Error('denied') } }
  expect(() => recordVisit(1, broken)).not.toThrow()
  expect(readLastVisit(broken)).toBeNull()
  const garbage = memoryStorage()
  garbage.setItem('vigil-last-visit', 'yesterday')
  expect(readLastVisit(garbage)).toBeNull()
})
