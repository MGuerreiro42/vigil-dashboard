import { useEffect, useState } from 'react'

export type FlashDirection = 'up' | 'down' | null

const FLASH_MS = 500

/** Direction of the last price change, cleared after a short flash. `undefined` (no live price) never flashes. */
export function usePriceFlash(price: number | undefined): FlashDirection {
  const [previous, setPrevious] = useState(price)
  const [direction, setDirection] = useState<FlashDirection>(null)

  if (price !== previous) {
    setPrevious(price)
    if (price != null && previous != null) setDirection(price > previous ? 'up' : 'down')
  }

  useEffect(() => {
    if (!direction) return
    const timer = setTimeout(() => setDirection(null), FLASH_MS)
    return () => clearTimeout(timer)
  }, [direction, previous])

  return direction
}

export function flashColor(direction: FlashDirection, idle?: string): string | undefined {
  if (direction === 'up') return '#10b981'
  if (direction === 'down') return '#f43f5e'
  return idle
}
