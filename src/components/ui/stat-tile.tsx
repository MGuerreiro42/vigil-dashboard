import type { ReactNode } from 'react'

interface Props {
  label: ReactNode
  value: ReactNode
  caption?: ReactNode
  /** Tints the surface and the value; label and caption stay neutral for contrast */
  color?: string
  /** Colors only the value on a neutral tile */
  valueColor?: string
  /** Overrides the value's size/font, e.g. for text values */
  valueClassName?: string
  className?: string
}

export function StatTile({ label, value, caption, color, valueColor, valueClassName = 'text-[22px] font-mono font-bold', className = '' }: Props) {
  return (
    <div
      className={`flex flex-col justify-between px-3 py-2.5 rounded-xl border flex-shrink-0 min-w-[68px] ${color ? '' : 'bg-white/[0.04] border-white/[0.06]'} ${className}`}
      style={color ? { background: color + '12', borderColor: color + '40' } : undefined}
    >
      <span className="text-[10px] uppercase tracking-widest leading-none text-fg-subtle">
        {label}
      </span>
      <span className={`${valueClassName} leading-none mt-1.5 text-white/85`} style={color || valueColor ? { color: color ?? valueColor } : undefined}>
        {value}
      </span>
      {caption && (
        <span className="text-[10px] mt-1 leading-none truncate text-fg-subtle">
          {caption}
        </span>
      )}
    </div>
  )
}
