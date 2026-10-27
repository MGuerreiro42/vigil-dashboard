import type { ReactNode } from 'react'
import { tabId, tabPanelId } from './tab-ids'

export interface TabItem<Id extends string> {
  id: Id
  label: ReactNode
}

interface TabsProps<Id extends string> {
  items: TabItem<Id>[]
  value: Id
  onChange: (id: Id) => void
  /** underline: panel sub-views · text: sort, filter and language toggles */
  variant?: 'underline' | 'text'
  label: string
  /** Prefix for tab/panel ids, so each tab can point at its panel with aria-controls */
  idBase?: string
  className?: string
}

const VARIANT = {
  underline: {
    list: 'flex flex-wrap gap-x-[18px] gap-y-[4px] border-b border-line',
    tab: 'mb-[-1px] border-b-2 pt-[2px] pb-[6px] focus-visible:px-[4px] focus-visible:text-text',
    active: 'border-ok text-ok',
    idle: 'border-transparent text-dim',
  },
  text: {
    list: 'flex flex-wrap gap-x-[16px] gap-y-[2px]',
    tab: '',
    active: 'text-ok',
    idle: 'text-dim',
  },
}

/** ARIA tabs; ←/→ moves between them through the global keyboard handler. */
export function Tabs<Id extends string>({ items, value, onChange, variant = 'underline', label, idBase, className = '' }: TabsProps<Id>) {
  const style = VARIANT[variant]
  return (
    <div role="tablist" aria-label={label} className={`${style.list} ${className}`}>
      {items.map((item) => {
        const selected = item.id === value
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={idBase && tabId(idBase, item.id)}
            aria-controls={idBase && tabPanelId(idBase, item.id)}
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(item.id)}
            className={`${style.tab} ${selected ? style.active : style.idle}`}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
