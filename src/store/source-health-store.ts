import { create } from 'zustand'
import type { SocketStatus } from '@/lib/reconnecting-socket'

/** Why the last request to a source failed: an HTTP status, or a failure before any response. */
export type FailureCause = number | 'timeout' | 'network'

export type StreamState = 'connecting' | 'live' | 'reconnecting' | 'error'

export interface SourceHealth {
  /** Latency of the last successful request, in ms */
  latencyMs: number | null
  lastSuccessAt: number | null
  lastFailure: FailureCause | null
  lastFailureAt: number | null
}

export interface StreamHealth {
  state: StreamState
  /** 1-based reconnect attempt, 0 while live */
  attempt: number
  lostAt: number | null
  nextRetryAt: number | null
  /** Set for a few seconds after a reconnect, to show how long the stream was down */
  recoveredAfterMs: number | null
  recoveredAt: number | null
}

interface SourceHealthState {
  sources: Record<string, SourceHealth>
  streams: Record<string, StreamHealth>
  recordSuccess: (source: string, latencyMs: number) => void
  recordFailure: (source: string, cause: FailureCause) => void
  setStream: (stream: string, patch: Partial<StreamHealth>) => void
}

const EMPTY_SOURCE: SourceHealth = { latencyMs: null, lastSuccessAt: null, lastFailure: null, lastFailureAt: null }
const EMPTY_STREAM: StreamHealth = { state: 'connecting', attempt: 0, lostAt: null, nextRetryAt: null, recoveredAfterMs: null, recoveredAt: null }

export const useSourceHealthStore = create<SourceHealthState>((set) => ({
  sources: {},
  streams: {},
  recordSuccess: (source, latencyMs) =>
    set((state) => ({
      sources: {
        ...state.sources,
        [source]: { ...EMPTY_SOURCE, latencyMs: Math.round(latencyMs), lastSuccessAt: Date.now() },
      },
    })),
  recordFailure: (source, cause) =>
    set((state) => ({
      sources: {
        ...state.sources,
        [source]: { ...(state.sources[source] ?? EMPTY_SOURCE), lastFailure: cause, lastFailureAt: Date.now() },
      },
    })),
  setStream: (stream, patch) =>
    set((state) => ({ streams: { ...state.streams, [stream]: { ...(state.streams[stream] ?? EMPTY_STREAM), ...patch } } })),
}))

/** Mirrors a reconnecting stream's status, tracking when it dropped and how long it stayed down. */
export function reportStreamStatus(stream: string, { state, attempt, nextRetryAt }: SocketStatus) {
  const { streams, setStream } = useSourceHealthStore.getState()
  const now = Date.now()
  const lostAt = streams[stream]?.lostAt ?? null
  if (state === 'live') {
    setStream(stream, { state, attempt, nextRetryAt, lostAt: null, recoveredAfterMs: lostAt ? now - lostAt : null, recoveredAt: lostAt ? now : null })
  } else {
    setStream(stream, { state, attempt, nextRetryAt, lostAt: state === 'connecting' ? null : lostAt ?? now })
  }
}

export type SourceStatus = 'ok' | 'degraded' | 'error'

/** ok after a success; degraded when the last request failed but older data exists; error with nothing to show. */
export function sourceStatus(health: SourceHealth): SourceStatus {
  if (health.lastFailure === null) return 'ok'
  return health.lastSuccessAt === null ? 'error' : 'degraded'
}

export function countSourceStatuses(sources: Record<string, SourceHealth>): Record<SourceStatus, number> {
  const counts: Record<SourceStatus, number> = { ok: 0, degraded: 0, error: 0 }
  for (const health of Object.values(sources)) counts[sourceStatus(health)] += 1
  return counts
}
