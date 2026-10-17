import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BracketButton, Level } from '@/components/terminal/text'
import { useAlertsStore } from '@/store/alerts-store'

/** `[alertas n]` toggle and its popover; closes on Escape and outside click (the shell remounts it on navigation). */
export function AlertsMenu() {
  const { t } = useTranslation()
  const alerts = useAlertsStore((state) => state.alerts)
  const markAllRead = useAlertsStore((state) => state.markAllRead)
  const dismiss = useAlertsStore((state) => state.dismiss)
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    markAllRead()
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false) }
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onPointer)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onPointer)
    }
  }, [open, markAllRead])

  return (
    <div ref={rootRef} className="contents">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="alerts-popover"
        onClick={() => setOpen((isOpen) => !isOpen)}
        className="text-warn"
      >
        [{t('terminal.alerts.toggle')} {alerts.length}]{open ? ' ×' : ''}
      </button>
      {open && (
        <div
          id="alerts-popover"
          className="absolute top-[28px] right-0 z-[5] flex w-[min(340px,calc(100vw-32px))] flex-col gap-[6px] border border-line bg-bg px-[16px] py-[14px] text-text max-sm:right-[-8px]"
        >
          <span className="text-dim">{t('terminal.alerts.active', { count: alerts.length })}</span>
          {alerts.length === 0 ? (
            <>
              <span>{t('terminal.alerts.empty')}</span>
              <span className="text-dim">{t('terminal.alerts.emptyHint')}</span>
            </>
          ) : (
            alerts.map((alert) => (
              <div key={alert.id} className="flex flex-col gap-[6px]">
                <span><Level severity={alert.severity} /> {alert.title}</span>
                <span className="text-dim">{alert.body}</span>
                <span><BracketButton onClick={() => dismiss(alert.id)}>{t('terminal.alerts.dismiss')}</BracketButton></span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
