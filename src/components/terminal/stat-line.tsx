import type { ReactNode } from 'react'

/** Summary strip at the top of big panels: dim labels, values in text colour. */
export function StatLine({ wide = true, children }: { wide?: boolean; children: ReactNode }) {
  return <div className={`flex flex-wrap gap-y-[4px] text-dim ${wide ? 'gap-x-[28px]' : 'gap-x-[24px]'}`}>{children}</div>
}

export function Stat({ label, children }: { label: ReactNode; children: ReactNode }) {
  return <span>{label} <span className="text-text">{children}</span></span>
}
