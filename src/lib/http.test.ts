import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { useSourceHealthStore } from '@/store/source-health-store'
import { fetchOk, HttpError } from './http'

const health = (source: string) => useSourceHealthStore.getState().sources[source]

beforeEach(() => useSourceHealthStore.setState({ sources: {}, streams: {} }))
afterEach(() => vi.unstubAllGlobals())

it('records latency on success', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}')))
  await fetchOk('https://x', 'usgs')
  expect(health('usgs')).toMatchObject({ lastFailure: null, latencyMs: expect.any(Number) })
})

it('records the HTTP status and keeps the last success', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(new Response('{}')).mockResolvedValueOnce(new Response('', { status: 429 })))
  await fetchOk('https://x', 'nasa neows')
  await expect(fetchOk('https://x', 'nasa neows')).rejects.toBeInstanceOf(HttpError)
  expect(health('nasa neows')).toMatchObject({ lastFailure: 429, lastSuccessAt: expect.any(Number) })
})

it('names timeouts and network failures', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new DOMException('slow', 'TimeoutError')))
  await expect(fetchOk('https://x', 'gdacs')).rejects.toThrow()
  expect(health('gdacs').lastFailure).toBe('timeout')

  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
  await expect(fetchOk('https://x', 'gdacs')).rejects.toThrow()
  expect(health('gdacs').lastFailure).toBe('network')
})

it('ignores requests the caller cancelled', async () => {
  const controller = new AbortController()
  controller.abort()
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new DOMException('aborted', 'AbortError')))
  await expect(fetchOk('https://x', 'hn', { signal: controller.signal })).rejects.toThrow()
  expect(health('hn')).toBeUndefined()
})
