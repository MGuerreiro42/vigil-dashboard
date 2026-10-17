import { useSourceHealthStore } from '@/store/source-health-store'

// Past this a panel turns from loading into an error, so the request is not left hanging either
export const REQUEST_TIMEOUT_MS = 10_000

/**
 * Closed set of reasons a source can fail, shared by panels, [1.2], the brief and the retry policy.
 * Mirrors the `error.code` a future BFF `Section<T>` envelope would carry.
 */
export type ErrorCode = 'timeout' | 'network' | 'rate_limited' | 'unavailable' | 'rejected' | 'invalid_payload' | 'stream_lost'

export interface Failure {
  code: ErrorCode
  /** HTTP status when the source answered, shown next to the code ("erro 503") */
  status: number | null
}

// A source asking for hours would leave its panel frozen; check back sooner and let it answer 429 again
export const MAX_RETRY_AFTER_MS = 5 * 60_000

/** Parses a Retry-After header (delta-seconds or HTTP date) into a wait in ms, capped. */
export function parseRetryAfter(header: string | null, now = Date.now()): number | null {
  const value = header?.trim()
  if (!value) return null
  const waitMs = /^\d+$/.test(value) ? Number(value) * 1_000 : Date.parse(value) - now
  return Number.isNaN(waitMs) ? null : Math.min(Math.max(0, waitMs), MAX_RETRY_AFTER_MS)
}

export class HttpError extends Error {
  readonly status: number
  readonly retryAfterMs: number | null

  constructor(source: string, status: number, retryAfterMs: number | null = null) {
    super(`${source}: ${status}`)
    this.status = status
    this.retryAfterMs = retryAfterMs
  }
}

/** Thrown by a parser when a payload does not have the shape it expects. */
export class PayloadError extends Error {}

/** fetch() rejecting before any response: DNS, CORS, offline. */
export class NetworkError extends Error {}

function httpCode(status: number): ErrorCode {
  if (status === 429) return 'rate_limited'
  if (status >= 500) return 'unavailable'
  return 'rejected'
}

export function classifyError(error: unknown): Failure {
  if (error instanceof HttpError) return { code: httpCode(error.status), status: error.status }
  if (error instanceof DOMException && error.name === 'TimeoutError') return { code: 'timeout', status: null }
  if (error instanceof NetworkError) return { code: 'network', status: null }
  // Request failures are all tagged above, so anything else (SyntaxError from .json(), PayloadError, a parser
  // tripping on a missing field) broke while reading the payload
  return { code: 'invalid_payload', status: null }
}

export async function fetchOk(url: string, source: string, init?: RequestInit): Promise<Response> {
  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  const signal = init?.signal ? AbortSignal.any([init.signal, timeout]) : timeout
  const health = useSourceHealthStore.getState()
  const startedAt = performance.now()
  try {
    const response = await fetch(url, { ...init, signal }).catch((error: unknown) => {
      throw error instanceof TypeError ? new NetworkError(`${source}: ${error.message}`, { cause: error }) : error
    })
    if (!response.ok) throw new HttpError(source, response.status, parseRetryAfter(response.headers.get('Retry-After')))
    health.recordSuccess(source, performance.now() - startedAt)
    return response
  } catch (error) {
    // A caller cancelling (unmount, newer query) says nothing about the source
    if (!init?.signal?.aborted) health.recordFailure(source, classifyError(error))
    throw error
  }
}
