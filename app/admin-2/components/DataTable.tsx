'use client'

import { useState } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { colors } from '../design-system'

export interface Column<T> {
  key: string
  label: string
  render?: (row: T) => React.ReactNode
  className?: string
}

interface DataTableProps<T extends Record<string, unknown>> {
  columns: Column<T>[]
  rows: T[]
  onRowClick?: (row: T) => void
}

export function DataTable<T extends Record<string, unknown>>({ columns, rows, onRowClick }: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
            {columns.map((col) => (
              <th
                key={col.key}
                className="text-left px-4 py-3 cursor-pointer select-none group"
                style={{
                  color: colors.textTertiary,
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
                onClick={() => handleSort(col.key)}
              >
                <div className="flex items-center gap-1">
                  {col.label}
                  <span className="opacity-0 group-hover:opacity-60 transition-opacity">
                    {sortKey === col.key && sortDir === 'desc'
                      ? <ChevronDown className="w-3 h-3" />
                      : <ChevronUp className="w-3 h-3" />
                    }
                  </span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              onClick={() => onRowClick?.(row)}
              className="transition-colors duration-100"
              style={{
                borderBottom: `1px solid ${colors.border}`,
                cursor: onRowClick ? 'pointer' : 'default',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = colors.elevated }}
              onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'transparent' }}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`px-4 py-3 ${col.className ?? ''}`}
                  style={{ color: colors.textSecondary }}
                >
                  {col.render ? col.render(row) : String(row[col.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && (
        <div className="py-16 text-center" style={{ color: colors.textTertiary }}>
          <p className="text-sm">No records found</p>
        </div>
      )}
    </div>
  )
}
