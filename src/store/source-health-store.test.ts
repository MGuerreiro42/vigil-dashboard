import { expect, it } from 'vitest'
import { countSourceStatuses, type SourceHealth } from './source-health-store'

const source = (patch: Partial<SourceHealth>): SourceHealth => ({ latencyMs: 40, lastSuccessAt: 1, lastFailure: null, lastFailureAt: null, ...patch })

it('splits sources into ok, degraded (has data) and error (no data)', () => {
  expect(countSourceStatuses({
    usgs: source({}),
    neows: source({ lastFailure: 429, lastFailureAt: 2 }),
    launches: source({ lastSuccessAt: null, latencyMs: null, lastFailure: 'timeout', lastFailureAt: 2 }),
  })).toEqual({ ok: 1, degraded: 1, error: 1 })
})
