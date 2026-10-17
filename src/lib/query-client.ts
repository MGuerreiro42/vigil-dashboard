import { QueryClient } from '@tanstack/react-query'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { removeOldestQuery, type PersistQueryClientOptions } from '@tanstack/react-query-persist-client'
import { classifyError, HttpError, type ErrorCode } from './http'

const MAX_RETRIES = 2
// How long a cached answer may stand in for a failing source, across reloads
const CACHE_MAX_AGE_MS = 24 * 60 * 60_000

const BASE_DELAY_MS = 1_000
const MAX_DELAY_MS = 30_000
// Without a Retry-After a rate limit usually spans a minute window: back off well past the normal pace
const RATE_LIMIT_BASE_DELAY_MS = 15_000

// A rejected request or a payload the parser cannot read will come back the same on a retry
const NO_RETRY: ErrorCode[] = ['rejected', 'invalid_payload']

export function shouldRetry(failureCount: number, error: Error): boolean {
  return failureCount < MAX_RETRIES && !NO_RETRY.includes(classifyError(error).code)
}

/** Exponential backoff; a rate limit waits for its Retry-After, or backs off longer. */
export function retryDelay(failureCount: number, error: Error): number {
  if (classifyError(error).code === 'rate_limited') {
    const retryAfterMs = error instanceof HttpError ? error.retryAfterMs : null
    return retryAfterMs ?? RATE_LIMIT_BASE_DELAY_MS * 2 ** failureCount
  }
  return Math.min(BASE_DELAY_MS * 2 ** failureCount, MAX_DELAY_MS)
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      // Kept as long as the persisted copy, or it would be dropped from storage on the next save
      gcTime: CACHE_MAX_AGE_MS,
      retry: shouldRetry,
      retryDelay,
      refetchOnWindowFocus: false,
    },
  },
})

export const persistOptions: Omit<PersistQueryClientOptions, 'queryClient'> = {
  persister: createSyncStoragePersister({
    storage: typeof window === 'undefined' ? undefined : window.localStorage,
    key: 'vigil-query-cache',
    // Full localStorage: drop the oldest answers rather than stop persisting
    retry: removeOldestQuery,
  }),
  maxAge: CACHE_MAX_AGE_MS,
  // Bump when a parsed payload changes shape, so old entries are not restored into new code
  buster: '2',
}
