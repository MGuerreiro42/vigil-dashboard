import { QueryClient } from '@tanstack/react-query'
import { expect, it } from 'vitest'
import { HttpError, NetworkError, PayloadError } from './http'
import { retryDelay, shouldPersist, shouldRetry } from './query-client'

it('does not retry rejected requests or unreadable payloads', () => {
  expect(shouldRetry(0, new HttpError('GitHub', 404))).toBe(false)
  expect(shouldRetry(0, new PayloadError('bad shape'))).toBe(false)
  expect(shouldRetry(0, new SyntaxError('Unexpected token <'))).toBe(false)
})

it('retries timeouts, network, rate limits and server errors up to twice', () => {
  const serverError = new HttpError('USGS', 503)
  expect([0, 1, 2].map((failures) => shouldRetry(failures, serverError))).toEqual([true, true, false])
  expect(shouldRetry(0, new NetworkError('Failed to fetch'))).toBe(true)
  expect(shouldRetry(0, new DOMException('slow', 'TimeoutError'))).toBe(true)
  expect(shouldRetry(0, new HttpError('CoinGecko', 429))).toBe(true)
})

it('backs off exponentially, honoring Retry-After on a rate limit', () => {
  expect([0, 1, 2].map((failures) => retryDelay(failures, new HttpError('USGS', 503)))).toEqual([1_000, 2_000, 4_000])
  expect(retryDelay(0, new HttpError('CoinGecko', 429, 7_000))).toBe(7_000)
  expect([0, 1].map((failures) => retryDelay(failures, new HttpError('CoinGecko', 429)))).toEqual([15_000, 30_000])
})

it('persists answers but not live positions or searches', () => {
  const client = new QueryClient()
  const persisted = (queryKey: unknown[]) => {
    client.setQueryData(queryKey, 1)
    return shouldPersist(client.getQueryCache().find({ queryKey, exact: true })!)
  }
  expect(persisted(['iss', 'tle'])).toBe(true)
  expect(persisted(['iss', 'position'])).toBe(false)
  expect(persisted(['iss', 'coordinates', 7])).toBe(false)
  expect(persisted(['city-search', 'pt', 'lisboa'])).toBe(false)
})
