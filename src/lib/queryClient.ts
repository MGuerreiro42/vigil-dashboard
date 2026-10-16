import { QueryClient } from '@tanstack/react-query'
import { HttpError } from './http'

const MAX_RETRIES = 2

// A 4xx (bad request, rate limit) won't succeed on an immediate retry
export function shouldRetry(failureCount: number, error: Error): boolean {
  if (error instanceof HttpError && error.status >= 400 && error.status < 500) return false
  return failureCount < MAX_RETRIES
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: shouldRetry,
      refetchOnWindowFocus: false,
    },
  },
})
