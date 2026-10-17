import { classifyError, REQUEST_TIMEOUT_MS, type Failure } from '@/lib/http'

export type PanelPhase = 'loading' | 'error' | 'degraded' | 'ready'

/** The slice of a TanStack query result a panel reads. */
export interface PanelQuery<Data> {
  data: Data | undefined
  error: Error | null
  isError: boolean
  dataUpdatedAt: number
  errorUpdatedAt: number
  /** Error of the last attempt while the query is still retrying */
  failureReason?: Error | null
  refetch: () => unknown
}

export interface PanelStatus {
  phase: PanelPhase
  failure: Failure | null
}

/** Loading turns into an error after the request timeout even if the query is still retrying. */
export function panelStatus(query: PanelQuery<unknown>, waitingSince: number, now: number): PanelStatus {
  const hasData = query.data !== undefined
  if (query.isError) return { phase: hasData ? 'degraded' : 'error', failure: classifyError(query.error) }
  if (hasData) return { phase: 'ready', failure: null }
  if (now - waitingSince >= REQUEST_TIMEOUT_MS) {
    // Still retrying past the timeout: name what the last attempt hit, a timeout only if nothing answered
    return { phase: 'error', failure: query.failureReason ? classifyError(query.failureReason) : { code: 'timeout', status: null } }
  }
  return { phase: 'loading', failure: null }
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
    failureReason: queries.find((query) => query.failureReason)?.failureReason ?? null,
    refetch: () => queries.forEach((query) => query.refetch()),
  }
}
