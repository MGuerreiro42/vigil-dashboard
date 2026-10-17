import { QueryClient } from '@tanstack/react-query'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { removeOldestQuery, type PersistQueryClientOptions } from '@tanstack/react-query-persist-client'
import { HttpError } from './http'

const MAX_RETRIES = 2
// How long a cached answer may stand in for a failing source, across reloads
const CACHE_MAX_AGE_MS = 24 * 60 * 60_000

// A 4xx (bad request, rate limit) won't succeed on an immediate retry
export function shouldRetry(failureCount: number, error: Error): boolean {
  if (error instanceof HttpError && error.status >= 400 && error.status < 500) return false
  return failureCount < MAX_RETRIES
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      // Kept as long as the persisted copy, or it would be dropped from storage on the next save
      gcTime: CACHE_MAX_AGE_MS,
      retry: shouldRetry,
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
