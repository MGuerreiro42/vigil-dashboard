import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { useSourceHealthStore } from '@/store/source-health-store'
import { classifyError, fetchOk, HttpError, MAX_RETRY_AFTER_MS, NetworkError, parseRetryAfter, PayloadError } from './http'

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
  expect(health('nasa neows')).toMatchObject({ lastFailure: { code: 'rate_limited', status: 429 }, lastSuccessAt: expect.any(Number) })
})

it('names timeouts and network failures', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new DOMException('slow', 'TimeoutError')))
  await expect(fetchOk('https://x', 'gdacs')).rejects.toThrow()
  expect(health('gdacs').lastFailure).toEqual({ code: 'timeout', status: null })

  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
  await expect(fetchOk('https://x', 'gdacs')).rejects.toThrow()
  expect(health('gdacs').lastFailure).toEqual({ code: 'network', status: null })
})

it('ignores requests the caller cancelled', async () => {
  const controller = new AbortController()
  controller.abort()
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new DOMException('aborted', 'AbortError')))
  await expect(fetchOk('https://x', 'hn', { signal: controller.signal })).rejects.toThrow()
  expect(health('hn')).toBeUndefined()
})

it('keeps the Retry-After of a rate-limited answer', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 429, headers: { 'Retry-After': '30' } })))
  await expect(fetchOk('https://x', 'coingecko')).rejects.toMatchObject({ status: 429, retryAfterMs: 30_000 })
})

it('classifies every failure into a closed code', async () => {
  const badJson: unknown = await new Response('<html>').json().catch((error: unknown) => error)
  const cases: [unknown, string, number | null][] = [
    [new DOMException('slow', 'TimeoutError'), 'timeout', null],
    [new NetworkError('dns'), 'network', null],
    [new HttpError('nasa', 429), 'rate_limited', 429],
    [new HttpError('usgs', 503), 'unavailable', 503],
    [new HttpError('github', 404), 'rejected', 404],
    [badJson, 'invalid_payload', null],
    [new PayloadError('missing near_earth_objects'), 'invalid_payload', null],
    [new TypeError("Cannot read properties of undefined (reading 'map')"), 'invalid_payload', null],
  ]
  for (const [error, code, status] of cases) expect(classifyError(error)).toEqual({ code, status })
})

it('parses Retry-After as seconds or an HTTP date', () => {
  const now = Date.parse('2026-10-17T12:00:00Z')
  expect(parseRetryAfter('120', now)).toBe(120_000)
  expect(parseRetryAfter('Sat, 17 Oct 2026 12:00:45 GMT', now)).toBe(45_000)
  expect(parseRetryAfter('Sat, 17 Oct 2026 11:00:00 GMT', now)).toBe(0)
  expect(parseRetryAfter('86400', now)).toBe(MAX_RETRY_AFTER_MS)
  expect([null, '', 'soon'].map((header) => parseRetryAfter(header, now))).toEqual([null, null, null])
})
