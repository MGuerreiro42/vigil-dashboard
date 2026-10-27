import { describe, expect, it } from 'vitest'
import type { SourceHealth, StreamHealth } from '@/store/source-health-store'
import { sourceRow, type SourceEntry } from './source-registry'

const rest: SourceEntry = { label: 'nasa neows', short: 'nasa', screen: 4, fetchNames: ['NASA NeoWs'] }
const stream: SourceEntry = { label: 'binance ws', short: 'binance', screen: 2, stream: 'binance ws' }
const health = (patch: Partial<SourceHealth>): SourceHealth => ({ latencyMs: 40, lastSuccessAt: 1_000, lastFailure: null, lastFailureAt: null, ...patch })
const noCache = { updatedAt: 0, hasData: false }
const now = 10_000

describe('sourceRow', () => {
  it('reports latency and data age of a healthy source', () => {
    expect(sourceRow(rest, [health({})], undefined, noCache, now)).toMatchObject({ status: 'ok', latency: 40, ageMs: 9_000 })
  })

  it('is degraded while failing with cached data, showing the failure instead of latency', () => {
    const failing = health({ lastSuccessAt: null, lastFailure: 429, lastFailureAt: 9_000 })
    expect(sourceRow(rest, [failing], undefined, { updatedAt: 2_000, hasData: true }, now)).toMatchObject({ status: 'degraded', latency: 429, ageMs: 8_000 })
  })

  it('is an error when failing with nothing cached', () => {
    const failing = health({ lastSuccessAt: null, lastFailure: 'timeout', lastFailureAt: 9_000 })
    expect(sourceRow(rest, [failing], undefined, noCache, now)).toMatchObject({ status: 'error', latency: 'timeout', ageMs: null })
  })

  it('waits for a source this device never reached', () => {
    expect(sourceRow(rest, [undefined], undefined, noCache, now).status).toBe('waiting')
  })

  it('shows a connected stream as live and a dropped one as reconnecting', () => {
    const live: StreamHealth = { state: 'live', attempt: 0, lostAt: null, nextRetryAt: null, recoveredAfterMs: null, recoveredAt: null }
    expect(sourceRow(stream, [], live, noCache, now)).toMatchObject({ status: 'ok', latency: 'live' })
    expect(sourceRow(stream, [], { ...live, state: 'reconnecting', attempt: 2, lostAt: 6_000 }, noCache, now)).toMatchObject({ status: 'reconnecting', ageMs: 4_000 })
  })
})
