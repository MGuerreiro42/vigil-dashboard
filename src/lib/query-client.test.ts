import { expect, it } from 'vitest'
import { HttpError } from './http'
import { shouldRetry } from './query-client'

it('does not retry client errors', () => {
  expect(shouldRetry(0, new HttpError('CoinGecko', 429))).toBe(false)
  expect(shouldRetry(0, new HttpError('GitHub', 404))).toBe(false)
})

it('retries server and network errors up to twice', () => {
  const serverError = new HttpError('USGS', 503)
  expect([0, 1, 2].map((failures) => shouldRetry(failures, serverError))).toEqual([true, true, false])
  expect(shouldRetry(0, new TypeError('Failed to fetch'))).toBe(true)
})
