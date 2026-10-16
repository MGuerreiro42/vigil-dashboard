import { useEffect, useRef, useState } from 'react'

const TICK_MS = 1_000

/**
 * Calls `onDone` after `durationMs` and returns the elapsed fraction (0–1).
 * Restarts whenever `resetKey` changes; freezes while `paused`.
 */
export function useAutoAdvance(durationMs: number, resetKey: unknown, onDone: () => void, paused = false): number {
  // Progress is tagged with the key it belongs to, so a new key reads as 0 without a reset setState
  const [elapsed, setElapsed] = useState({ key: resetKey, ms: 0 })
  const onDoneRef = useRef(onDone)
  useEffect(() => { onDoneRef.current = onDone })

  useEffect(() => {
    if (paused) return
    const start = Date.now()
    const id = setInterval(() => {
      const ms = Date.now() - start
      setElapsed({ key: resetKey, ms })
      if (ms >= durationMs) {
        clearInterval(id)
        onDoneRef.current()
      }
    }, TICK_MS)
    return () => clearInterval(id)
  }, [durationMs, resetKey, paused])

  return elapsed.key === resetKey ? Math.min(elapsed.ms / durationMs, 1) : 0
}
