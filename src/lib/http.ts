import { useSourceHealthStore, type FailureCause } from '@/store/source-health-store'

// Past this a panel turns from loading into an error, so the request is not left hanging either
export const REQUEST_TIMEOUT_MS = 10_000

export class HttpError extends Error {
  readonly status: number

  constructor(source: string, status: number) {
    super(`${source}: ${status}`)
    this.status = status
  }
}

/** The cause a panel names when a request fails: HTTP status, timeout or network. */
export function failureCause(error: unknown): FailureCause {
  if (error instanceof HttpError) return error.status
  if (error instanceof DOMException && error.name === 'TimeoutError') return 'timeout'
  return 'network'
}

export async function fetchOk(url: string, source: string, init?: RequestInit): Promise<Response> {
  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  const signal = init?.signal ? AbortSignal.any([init.signal, timeout]) : timeout
  const health = useSourceHealthStore.getState()
  const startedAt = performance.now()
  try {
    const response = await fetch(url, { ...init, signal })
    if (!response.ok) throw new HttpError(source, response.status)
    health.recordSuccess(source, performance.now() - startedAt)
    return response
  } catch (error) {
    // A caller cancelling (unmount, newer query) says nothing about the source
    if (!init?.signal?.aborted) health.recordFailure(source, failureCause(error))
    throw error
  }
}
