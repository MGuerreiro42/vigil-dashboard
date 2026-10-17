import { expect, it, vi } from 'vitest'
import { reportStreamStatus, useSourceHealthStore } from './source-health-store'

it('keeps the moment a stream dropped across attempts and reports the downtime on recovery', () => {
  vi.useFakeTimers({ now: 10_000 })
  reportStreamStatus('test sse', { state: 'live', attempt: 0, nextRetryAt: null })
  reportStreamStatus('test sse', { state: 'reconnecting', attempt: 1, nextRetryAt: 11_000 })
  vi.advanceTimersByTime(3_000)
  reportStreamStatus('test sse', { state: 'reconnecting', attempt: 2, nextRetryAt: 15_000 })
  expect(useSourceHealthStore.getState().streams['test sse']).toMatchObject({ attempt: 2, lostAt: 10_000 })

  vi.advanceTimersByTime(2_000)
  reportStreamStatus('test sse', { state: 'live', attempt: 0, nextRetryAt: null })
  expect(useSourceHealthStore.getState().streams['test sse']).toMatchObject({ state: 'live', lostAt: null, recoveredAfterMs: 5_000, recoveredAt: 15_000 })
  vi.useRealTimers()
})
