import { useId, type KeyboardEvent, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { Tone } from '@/lib/terminal-format'
import { TONE_CLASS } from './tone'

// Phones use one 12px rhythm between groups whatever the desktop gap
const GAP_CLASS = { 6: 'gap-[6px]', 8: 'gap-[8px]', 10: 'gap-[10px]', 12: 'gap-[12px]', 14: 'gap-[14px]' } as const

export interface PanelProps {
  /** "2.1", or "2" on the overview cards */
  id: string
  title: string
  meta?: ReactNode
  metaTone?: Tone
  gap?: keyof typeof GAP_CLASS
  /** Makes the whole panel open a screen, as on the overview cards */
  onOpen?: () => void
  className?: string
  children: ReactNode
}

const LABEL = 'm-0 overflow-hidden text-ellipsis whitespace-nowrap bg-bg px-[6px] font-normal'

/** Bordered box with `[n.m] title` cut into the top border and an optional meta on the right. */
export function Panel({ id, title, meta, metaTone = 'dim', gap = 10, onOpen, className = '', children }: PanelProps) {
  const { t } = useTranslation()
  const headingId = useId()
  const rightLabel = meta ?? (onOpen ? t('terminal.panel.open') : null)

  const openProps = onOpen && {
    role: 'link',
    tabIndex: 0,
    onClick: onOpen,
    onKeyDown: (event: KeyboardEvent) => {
      if (event.target === event.currentTarget && event.key === 'Enter') onOpen()
    },
  }

  return (
    <section
      aria-labelledby={headingId}
      className={`relative flex min-w-0 flex-col border border-line px-[16px] pt-[18px] pb-[14px] ${GAP_CLASS[gap]} max-sm:gap-[12px] ${onOpen ? 'cursor-pointer hover:border-rim focus-visible:bg-transparent' : ''} ${className}`}
      {...openProps}
    >
      {/* The title keeps its width; the right label truncates before the two can touch */}
      <div className="absolute inset-x-[12px] -top-[10px] flex gap-[12px] leading-[1.55]">
        <h2 id={headingId} className={`${LABEL} max-w-full shrink-0 text-ok`}>[{id}] {title}</h2>
        {rightLabel && (
          // Plain source labels make room on phones; status labels stay because they carry state
          <span className={`${LABEL} ml-auto min-w-0 ${TONE_CLASS[metaTone]} ${metaTone === 'dim' ? 'max-sm:hidden' : ''}`}>{rightLabel}</span>
        )}
      </div>
      {children}
    </section>
  )
}

/** In-panel section divider. */
export function PanelDivider({ tight = false, className = '', children }: { tight?: boolean; className?: string; children: ReactNode }) {
  return <div className={`border-t border-line-subtle ${tight ? 'pt-[6px]' : 'pt-[8px]'} ${className}`}>{children}</div>
}
