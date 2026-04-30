'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { Table, TableRow, TableCell } from '../components/Table'
import { DetailSidebar } from '../components/DetailSidebar'
import { cssColors as colors, radius } from '../design-system'
import type { DropoffRow } from './page'

const SLOTS = [
  { value: '8:15', label: '8:15 – 8:30 AM', color: '#38BDF8', bg: 'rgba(56,189,248,0.1)', border: 'rgba(56,189,248,0.25)' },
  { value: '8:30', label: '8:30 – 8:45 AM', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)' },
  { value: '8:45', label: '8:45 – 9:00 AM', color: '#22C55E', bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.25)' },
] as const

function slotConfig(value: string) {
  return SLOTS.find((s) => s.value === value) ?? SLOTS[0]
}

function SlotBadge({ slot }: { slot: string }) {
  const cfg = slotConfig(slot)
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full whitespace-nowrap"
      style={{ color: cfg.color, backgroundColor: cfg.bg, border: `1px solid ${cfg.border}` }}
    >
      {cfg.label}
    </span>
  )
}

function kidAge(dob_year: string | null): number | null {
  if (!dob_year) return null
  const year = parseInt(dob_year, 10)
  if (isNaN(year)) return null
  return new Date().getFullYear() - year
}

function formatUpdated(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function DropoffsClient({ rows }: { rows: DropoffRow[] }) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<DropoffRow | null>(null)

  const filtered = rows.filter((r) => {
    const q = search.toLowerCase()
    return !q || r.parent_name?.toLowerCase().includes(q) || r.parent_email?.toLowerCase().includes(q)
  })

  return (
    <>
      {/* Slot summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {SLOTS.map(({ value, label, color }) => {
          const slotRows = rows.filter((r) => r.slot === value)
          return (
            <div
              key={value}
              className="px-4 py-4 rounded-xl"
              style={{
                backgroundColor: colors.surface,
                border: `1px solid ${colors.border}`,
                borderLeft: `3px solid ${color}`,
              }}
            >
              <p className="text-xs font-semibold mb-1" style={{ color }}>{label}</p>
              <p className="text-2xl font-bold mb-1" style={{ color: colors.textPrimary }}>
                {slotRows.length}
              </p>
              <p
                className="text-xs leading-relaxed line-clamp-2"
                style={{ color: colors.textTertiary }}
              >
                {slotRows.length === 0
                  ? 'No families yet'
                  : slotRows.map((r) => r.parent_name ?? 'Unknown').join(', ')}
              </p>
            </div>
          )
        })}
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
          style={{ color: colors.textTertiary }}
        />
        <input
          type="text"
          placeholder="Search families…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg outline-none"
          style={{
            backgroundColor: colors.surface,
            border: `1px solid ${colors.border}`,
            color: colors.textPrimary,
            borderRadius: radius.md,
          }}
        />
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div
          className="py-12 text-center rounded-xl text-sm"
          style={{ color: colors.textTertiary, backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}
        >
          No drop-off submissions found.
        </div>
      ) : (
        <Table headers={['Parent', 'Slot', 'Kids', 'Updated']}>
          {filtered.map((row, i) => (
            <TableRow key={row.parent_id} index={i} onClick={() => setSelected(row)}>
              <TableCell>
                <div className="font-medium" style={{ color: colors.textPrimary }}>
                  {row.parent_name ?? '—'}
                </div>
                <div className="text-xs mt-0.5" style={{ color: colors.textTertiary }}>
                  {row.parent_email ?? '—'}
                </div>
              </TableCell>
              <TableCell>
                <SlotBadge slot={row.slot} />
              </TableCell>
              <TableCell>
                {row.kids.length === 0 ? (
                  <span style={{ color: colors.textTertiary }}>—</span>
                ) : (
                  <div className="space-y-0.5">
                    {row.kids.map((k) => {
                      const age = kidAge(k.dob_year)
                      return (
                        <div key={k.id} style={{ color: colors.textSecondary }}>
                          {k.name ?? 'Unknown'}
                          {k.grade && (
                            <span className="ml-1.5 text-xs" style={{ color: colors.textTertiary }}>
                              Grade {k.grade}
                            </span>
                          )}
                          {age !== null && (
                            <span className="ml-1 text-xs" style={{ color: colors.textTertiary }}>
                              · {age}y
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </TableCell>
              <TableCell>{formatUpdated(row.updated_at)}</TableCell>
            </TableRow>
          ))}
        </Table>
      )}

      {/* Detail sidebar */}
      <DetailSidebar
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.parent_name ?? 'Parent'}
      >
        {selected && (
          <div className="flex flex-col gap-6">
            {/* Parent info */}
            <div
              className="rounded-xl p-4 flex flex-col gap-3"
              style={{ backgroundColor: colors.elevated, border: `1px solid ${colors.border}` }}
            >
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textTertiary }}>
                Parent
              </p>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                  {selected.parent_name ?? '—'}
                </p>
                <p className="text-xs" style={{ color: colors.textTertiary }}>
                  {selected.parent_email ?? '—'}
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textTertiary }}>
                  Drop-Off Slot
                </p>
                <SlotBadge slot={selected.slot} />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textTertiary }}>
                  Submitted
                </p>
                <p className="text-sm" style={{ color: colors.textSecondary }}>
                  {formatUpdated(selected.updated_at)}
                </p>
              </div>
            </div>

            {/* Kids */}
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textTertiary }}>
                Children ({selected.kids.length})
              </p>
              {selected.kids.length === 0 ? (
                <p className="text-sm" style={{ color: colors.textTertiary }}>No children on record.</p>
              ) : (
                selected.kids.map((k) => {
                  const age = kidAge(k.dob_year)
                  return (
                    <div
                      key={k.id}
                      className="rounded-xl p-3 flex flex-col gap-1"
                      style={{ backgroundColor: colors.elevated, border: `1px solid ${colors.border}` }}
                    >
                      <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                        {k.name ?? 'Unknown'}
                      </p>
                      <div className="flex items-center gap-3 text-xs" style={{ color: colors.textTertiary }}>
                        {k.grade && <span>Grade {k.grade}</span>}
                        {age !== null && <span>{age} years old</span>}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}
      </DetailSidebar>
    </>
  )
}
