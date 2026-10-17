import type { CSSProperties, ReactNode } from 'react'

interface DataTableProps {
  /** grid-template-columns, as authored per panel */
  columns: string
  /** CSS gap, "row col" */
  gap?: string
  /** Header labels; `right` aligns numeric columns */
  header?: { label: ReactNode; right?: boolean }[]
  className?: string
  children: ReactNode
}

/** A CSS-grid table: rows are `display: contents`, so cells line up on one grid. */
export function DataTable({ columns, gap = '2px 10px', header, className = '', children }: DataTableProps) {
  const style: CSSProperties = { gridTemplateColumns: columns, gap }
  return (
    <div role="table" className={`grid ${className}`} style={style}>
      {header && (
        <div role="row" className="contents text-dim">
          {header.map((cell, index) => (
            <span key={index} role="columnheader" className={cell.right ? 'text-right' : ''}>{cell.label}</span>
          ))}
        </div>
      )}
      {children}
    </div>
  )
}

export function TableRow({ children }: { children: ReactNode }) {
  return <div role="row" className="contents">{children}</div>
}

export function Cell({ right = false, truncate = false, className = '', children }: { right?: boolean; truncate?: boolean; className?: string; children: ReactNode }) {
  return (
    <span role="cell" className={`min-w-0 ${right ? 'text-right' : ''} ${truncate ? 'overflow-hidden text-ellipsis whitespace-nowrap' : ''} ${className}`}>
      {children}
    </span>
  )
}

interface SelectableRowProps {
  selected: boolean
  onSelect: () => void
  /** Same template as the table header */
  columns: string
  gap?: string
  children: ReactNode
}

/** Full-width clickable row of a list (coins, repos, quakes): a button laid out on the parent's columns. */
export function SelectableRow({ selected, onSelect, columns, gap = '0 10px', children }: SelectableRowProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={`grid w-full px-[8px] py-[3px] hover:bg-row-selected focus-visible:bg-row-selected focus-visible:outline-offset-[-1px] ${selected ? 'bg-row-selected [&>*:first-child]:text-ok' : ''}`}
      style={{ gridTemplateColumns: columns, gap }}
    >
      {children}
    </button>
  )
}
