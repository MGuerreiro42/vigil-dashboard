import { describe, expect, it } from 'vitest'
import type { SourceHealth, StreamHealth } from '@/store/source-health-store'
import { phoneListedRows, sourceRow, type SourceEntry, type SourceRow } from './source-registry'

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
    const failing = health({ lastSuccessAt: null, lastFailure: { code: 'rate_limited', status: 429 }, lastFailureAt: 9_000 })
    expect(sourceRow(rest, [failing], undefined, { updatedAt: 2_000, hasData: true }, now)).toMatchObject({ status: 'degraded', failure: { code: 'rate_limited', status: 429 }, ageMs: 8_000 })
  })

  it('is an error when failing with nothing cached', () => {
    const failing = health({ lastSuccessAt: null, lastFailure: { code: 'timeout', status: null }, lastFailureAt: 9_000 })
    expect(sourceRow(rest, [failing], undefined, noCache, now)).toMatchObject({ status: 'error', failure: { code: 'timeout', status: null }, ageMs: null })
  })

  it('is an error when the request succeeded but its payload was unreadable', () => {
    const answered = health({ lastSuccessAt: 9_000 })
    const unreadable = health({ latencyMs: null, lastSuccessAt: null, lastFailure: { code: 'invalid_payload', status: null }, lastFailureAt: 9_000 })
    expect(sourceRow(rest, [answered, unreadable], undefined, noCache, now)).toMatchObject({ status: 'error', failure: { code: 'invalid_payload', status: null } })
  })

  it('is ok again once another endpoint of the source answers after a failure', () => {
    const search = health({ latencyMs: null, lastSuccessAt: null, lastFailure: { code: 'network', status: null }, lastFailureAt: 2_000 })
    expect(sourceRow(rest, [health({ lastSuccessAt: 9_000 }), search], undefined, noCache, now)).toMatchObject({ status: 'ok', failure: null })
    expect(sourceRow(rest, [health({ lastSuccessAt: 1_000 }), search], undefined, noCache, now)).toMatchObject({ status: 'error' })
  })

  it('shows data restored from the persisted cache as cache until a request this session', () => {
    const restored = { updatedAt: 4_000, hasData: true }
    expect(sourceRow(rest, [undefined], undefined, restored, now)).toMatchObject({ status: 'ok', latency: 'cache', ageMs: 6_000 })
    expect(sourceRow(rest, [health({ lastSuccessAt: 9_500 })], undefined, restored, now)).toMatchObject({ status: 'ok', latency: 40, ageMs: 500 })
  })

  it('names a stream that gave up as stream_lost', () => {
    const lost: StreamHealth = { state: 'error', attempt: 5, lostAt: 1_000, nextRetryAt: null, recoveredAfterMs: null, recoveredAt: null }
    expect(sourceRow(stream, [], lost, noCache, now)).toMatchObject({ status: 'error', failure: { code: 'stream_lost', status: null } })
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

describe('phoneListedRows', () => {
  const row = (label: string, status: SourceRow['status']): SourceRow => ({ entry: { ...rest, label }, status, latency: null, failure: null, ageMs: null, failingSince: null })
  const rows = [row('usgs', 'ok'), row('nasa neows', 'degraded'), row('gdacs', 'ok'), row('wikimedia feed', 'error')]

  it('lists only the sources that are not ok while collapsed', () => {
    expect(phoneListedRows(rows, false).map((listed) => listed.entry.label)).toEqual(['nasa neows', 'wikimedia feed'])
  })

  it('lists nothing when every source is ok, and everything once expanded', () => {
    expect(phoneListedRows([row('usgs', 'ok')], false)).toEqual([])
    expect(phoneListedRows(rows, true)).toEqual(rows)
  })
})
