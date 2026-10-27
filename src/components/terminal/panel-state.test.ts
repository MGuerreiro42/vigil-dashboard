import { describe, expect, it } from 'vitest'
import { HttpError } from '@/lib/http'
import { causeKey, panelStatus, type PanelQuery } from './panel-state'

const query = (patch: Partial<PanelQuery<unknown>>): PanelQuery<unknown> => ({
  data: undefined, error: null, isError: false, dataUpdatedAt: 0, errorUpdatedAt: 0, refetch: () => {}, ...patch,
})

describe('panelStatus', () => {
  it('waits up to the request timeout, then reports one', () => {
    expect(panelStatus(query({}), 0, 9_999).phase).toBe('loading')
    expect(panelStatus(query({}), 0, 10_000)).toEqual({ phase: 'error', cause: 'timeout' })
  })

  it('serves cache when a refetch fails and errors without data', () => {
    const error = new HttpError('nasa neows', 429)
    expect(panelStatus(query({ isError: true, error, data: [1] }), 0, 0)).toEqual({ phase: 'degraded', cause: 429 })
    expect(panelStatus(query({ isError: true, error }), 0, 0)).toEqual({ phase: 'error', cause: 429 })
    expect(panelStatus(query({ data: [] }), 0, 60_000).phase).toBe('ready')
  })
})

it('maps causes to reasons', () => {
  expect([429, 403, 404, 503, 418, 'timeout', 'network'].map((cause) => causeKey(cause as never)))
    .toEqual(['rateLimit', 'unauthorized', 'notFound', 'server', 'other', 'timeout', 'network'])
})
