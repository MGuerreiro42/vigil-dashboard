import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

/** Phone-only toggle that shows the list of a list+detail panel. */
export function PickerButton({ open, onToggle, controls, children }: { open: boolean; onToggle: () => void; controls: string; children: ReactNode }) {
  const { t } = useTranslation()
  return (
    <button
      type="button"
      aria-expanded={open}
      aria-controls={controls}
      onClick={onToggle}
      className="flex min-h-touch flex-[1_1_100%] items-center justify-between gap-[12px] border border-line px-[12px]"
    >
      <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">{children}</span>
      <span className="text-ok">{t(open ? 'terminal.picker.close' : 'terminal.picker.change')}</span>
    </button>
  )
}
