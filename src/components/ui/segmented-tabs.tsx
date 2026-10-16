export interface TabOption<T extends string> {
  id: T
  label: string
  disabled?: boolean
}

interface Props<T extends string> {
  tabs: TabOption<T>[]
  active: T
  onChange: (id: T) => void
  accent: string
}

export function SegmentedTabs<T extends string>({ tabs, active, onChange, accent }: Props<T>) {
  return (
    <div role="tablist" className="flex gap-1 flex-shrink-0 flex-wrap">
      {tabs.map((tab) => {
        const selected = tab.id === active
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={selected}
            disabled={tab.disabled}
            onClick={() => onChange(tab.id)}
            className="px-3 py-1 rounded-lg text-xs font-medium transition-all disabled:opacity-30 disabled:cursor-default"
            style={{
              background: selected ? accent + '20' : 'transparent',
              color: selected ? accent : 'rgba(255,255,255,0.35)',
              border: `1px solid ${selected ? accent + '50' : 'transparent'}`,
            }}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
