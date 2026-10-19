import type { ReactNode } from 'react'
import { useNow } from '@/hooks/use-now'

/** Re-renders only its own text every second, so a ticking age or countdown does not redraw the panel around it. */
export function Clock({ children }: { children: (now: number) => ReactNode }) {
  return <>{children(useNow(1_000))}</>
}
