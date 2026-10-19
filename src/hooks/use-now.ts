import { useEffect, useState } from 'react'

/** Current time in ms, refreshed every `intervalMs` (`null` pauses it). Mount it as low in the tree as possible. */
export function useNow(intervalMs: number | null = 1_000): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (intervalMs === null) return
    const timer = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(timer)
  }, [intervalMs])
  return now
}
