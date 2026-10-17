import { describe, expect, it } from 'vitest'
import { HttpError } from '@/lib/http'
import { combineQueries, panelStatus, type PanelQuery } from './panel-state'

const query = (patch: Partial<PanelQuery<unknown>>): PanelQuery<unknown> => ({
  data: undefined, error: null, isError: false, dataUpdatedAt: 0, errorUpdatedAt: 0, refetch: () => {}, ...patch,
})

describe('panelStatus', () => {
  it('waits up to the request timeout, then reports one', () => {
    expect(panelStatus(query({}), 0, 9_999).phase).toBe('loading')
    expect(panelStatus(query({}), 0, 10_000)).toEqual({ phase: 'error', failure: { code: 'timeout', status: null } })
  })

  it('names the last attempt when still retrying past the timeout', () => {
    expect(panelStatus(query({ failureReason: new HttpError('coingecko', 429) }), 0, 10_000))
      .toEqual({ phase: 'error', failure: { code: 'rate_limited', status: 429 } })
  })

  it('serves cache when a refetch fails and errors without data', () => {
    const error = new HttpError('nasa neows', 429)
    const failure = { code: 'rate_limited', status: 429 }
    expect(panelStatus(query({ isError: true, error, data: [1] }), 0, 0)).toEqual({ phase: 'degraded', failure })
    expect(panelStatus(query({ isError: true, error }), 0, 0)).toEqual({ phase: 'error', failure })
    expect(panelStatus(query({ data: [] }), 0, 60_000).phase).toBe('ready')
  })

  it('reports an unreadable payload as such, not as a network failure', () => {
    expect(panelStatus(query({ isError: true, error: new SyntaxError('Unexpected token <') }), 0, 0).failure).toEqual({ code: 'invalid_payload', status: null })
  })
})

it('combines queries: ready when all have data, failing when any fails', () => {
  const error = new HttpError('bcb', 503)
  const ready = combineQueries(query({ data: 1, dataUpdatedAt: 5 }), query({ data: 'a', dataUpdatedAt: 3 }))
  expect(ready).toMatchObject({ data: [1, 'a'], isError: false, dataUpdatedAt: 3 })
  expect(combineQueries(query({ data: 1 }), query({})).data).toBeUndefined()
  expect(combineQueries(query({ data: 1 }), query({ isError: true, error, errorUpdatedAt: 9 }))).toMatchObject({ isError: true, error, errorUpdatedAt: 9 })
})
