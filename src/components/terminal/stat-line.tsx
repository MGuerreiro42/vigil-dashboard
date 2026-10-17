import type { ReactNode } from 'react'
import { PRIORITY_CLASS, type Priority } from './priority'

/**
 * Summary strip at the top of big panels: inline pairs from 600px, two columns of key-above-value below.
 * Panels mark pairs past the first four as p2 so phones show at most four.
 */
export function StatLine({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-x-[24px] gap-y-[4px] max-sm:gap-x-[16px] max-sm:gap-y-[12px]">{children}</div>
}

// The whitespace between key and value is dropped once the pair becomes a flex column
const PHONE_STACK = 'max-sm:flex max-sm:flex-[1_1_calc(50%-8px)] max-sm:flex-col max-sm:gap-[2px] max-sm:min-w-0'

export function Stat({ label, priority = 'p1', children }: { label: ReactNode; priority?: Priority; children: ReactNode }) {
  return (
    <span className={`sm:whitespace-nowrap ${priority === 'p1' ? PHONE_STACK : PRIORITY_CLASS[priority]}`}>
      <span className="text-dim">{label}</span> <span className="text-text">{children}</span>
    </span>
  )
}
