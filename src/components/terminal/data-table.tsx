import type { CSSProperties, ReactNode } from 'react'
import { PRIORITY_CLASS, type Priority } from './priority'

interface DataTableProps {
  /** grid-template-columns, as authored per panel */
  columns: string
  /** Template below 600px, when p2 columns drop out there */
  phoneColumns?: string
  /** CSS gap, "row col" */
  gap?: string
  /** Header labels; `right` aligns numeric columns */
  header?: { label: ReactNode; right?: boolean; priority?: Priority }[]
  className?: string
  children: ReactNode
}

/** A CSS-grid table: rows are `display: contents`, so cells line up on one grid. */
export function DataTable({ columns, phoneColumns = columns, gap = '2px 10px', header, className = '', children }: DataTableProps) {
  const style = { '--columns': columns, '--phone-columns': phoneColumns, gap } as CSSProperties
  return (
    <div role="table" className={`grid grid-cols-(--columns) max-sm:grid-cols-(--phone-columns) ${className}`} style={style}>
      {header && (
        <div role="row" className="contents text-dim">
          {header.map((cell, index) => (
            <span key={index} role="columnheader" className={`min-w-0 overflow-hidden text-ellipsis whitespace-nowrap ${cell.right ? 'text-right' : ''} ${PRIORITY_CLASS[cell.priority ?? 'p1']}`}>{cell.label}</span>
          ))}
        </div>
      )}
      {children}
    </div>
  )
}

export function TableRow({ priority = 'p1', children }: { priority?: Priority; children: ReactNode }) {
  return <div role="row" className={`contents ${PRIORITY_CLASS[priority]}`}>{children}</div>
}

interface CellProps {
  right?: boolean
  truncate?: boolean
  priority?: Priority
  title?: string
  className?: string
  children: ReactNode
}

export function Cell({ right = false, truncate = false, priority = 'p1', title, className = '', children }: CellProps) {
  return (
    <span role="cell" title={title} className={`min-w-0 ${right ? 'text-right' : ''} ${truncate ? 'overflow-hidden text-ellipsis whitespace-nowrap' : ''} ${PRIORITY_CLASS[priority]} ${className}`}>
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
      className={`grid w-full items-center px-[8px] py-[3px] max-sm:min-h-[32px] hover:bg-row-selected focus-visible:bg-row-selected focus-visible:outline-offset-[-1px] ${selected ? 'bg-row-selected [&>*:first-child]:text-ok' : ''}`}
      style={{ gridTemplateColumns: columns, gap }}
    >
      {children}
    </button>
  )
}
