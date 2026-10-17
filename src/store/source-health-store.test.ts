import { expect, it, vi } from 'vitest'
import { countSourceStatuses, reportStreamStatus, useSourceHealthStore, type SourceHealth } from './source-health-store'

const source = (patch: Partial<SourceHealth>): SourceHealth => ({ latencyMs: 40, lastSuccessAt: 1, lastFailure: null, lastFailureAt: null, ...patch })

it('splits sources into ok, degraded (has data) and error (no data)', () => {
  expect(countSourceStatuses({
    usgs: source({}),
    neows: source({ lastFailure: 429, lastFailureAt: 2 }),
    launches: source({ lastSuccessAt: null, latencyMs: null, lastFailure: 'timeout', lastFailureAt: 2 }),
  })).toEqual({ ok: 1, degraded: 1, error: 1 })
})

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
