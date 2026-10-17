import { failureCause, REQUEST_TIMEOUT_MS } from '@/lib/http'
import type { FailureCause } from '@/store/source-health-store'

export type PanelPhase = 'loading' | 'error' | 'degraded' | 'ready'

/** The slice of a TanStack query result a panel reads. */
export interface PanelQuery<Data> {
  data: Data | undefined
  error: Error | null
  isError: boolean
  dataUpdatedAt: number
  errorUpdatedAt: number
  refetch: () => unknown
}

export interface PanelStatus {
  phase: PanelPhase
  cause: FailureCause | null
}

/** Loading turns into an error after the request timeout even if the query is still retrying. */
export function panelStatus(query: PanelQuery<unknown>, waitingSince: number, now: number): PanelStatus {
  const hasData = query.data !== undefined
  if (query.isError) return { phase: hasData ? 'degraded' : 'error', cause: failureCause(query.error) }
  if (hasData) return { phase: 'ready', cause: null }
  if (now - waitingSince >= REQUEST_TIMEOUT_MS) return { phase: 'error', cause: 'timeout' }
  return { phase: 'loading', cause: null }
}

export type CauseKey = 'timeout' | 'network' | 'rateLimit' | 'unauthorized' | 'notFound' | 'server' | 'other'

export function causeKey(cause: FailureCause): CauseKey {
  if (cause === 'timeout' || cause === 'network') return cause
  if (cause === 429) return 'rateLimit'
  if (cause === 401 || cause === 403) return 'unauthorized'
  if (cause === 404) return 'notFound'
  if (cause >= 500) return 'server'
  return 'other'
}

type QueryData<Queries> = { [Index in keyof Queries]: Queries[Index] extends PanelQuery<infer Data> ? Data : never }

/** One panel fed by several queries: ready once all have data, failing when any fails. */
export function combineQueries<Queries extends PanelQuery<unknown>[]>(...queries: Queries): PanelQuery<QueryData<Queries>> {
  const failed = queries.find((query) => query.isError)
  return {
    data: queries.every((query) => query.data !== undefined) ? (queries.map((query) => query.data) as QueryData<Queries>) : undefined,
    error: failed?.error ?? null,
    isError: Boolean(failed),
    dataUpdatedAt: Math.min(...queries.map((query) => query.dataUpdatedAt)),
    errorUpdatedAt: Math.max(...queries.map((query) => query.errorUpdatedAt)),
    refetch: () => queries.forEach((query) => query.refetch()),
  }
}
