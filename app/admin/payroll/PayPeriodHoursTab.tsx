'use client'

import { useMemo, useState } from 'react'
import { cssColors as colors, radius } from '../design-system'
import { Table, TableRow, TableCell } from '../components/Table'
import type { PaystubWithTeacher } from '@/app/actions/paystubs'
import { fmtDate, fmtMoney, formatHours, StatusBadge } from './PayrollClient'

interface Props {
  paystubs: PaystubWithTeacher[]
}

export function PayPeriodHoursTab({ paystubs }: Props) {
  const periods = useMemo(() => {
    const map = new Map<string, {
      key: string
      period_start: string
      period_end: string
      rows: PaystubWithTeacher[]
    }>()

    for (const s of paystubs) {
      const key = `${s.period_start}|${s.period_end}`
      if (!map.has(key)) {
        map.set(key, { key, period_start: s.period_start, period_end: s.period_end, rows: [] })
      }
      map.get(key)!.rows.push(s)
    }

    return Array.from(map.values())
      .sort((a, b) => b.period_start.localeCompare(a.period_start))
  }, [paystubs])

  const [selectedKey, setSelectedKey] = useState<string | null>(() => periods[0]?.key ?? null)

  const selectedPeriod = periods.find((p) => p.key === selectedKey) ?? null

  const sortedRows = useMemo(
    () =>
      selectedPeriod
        ? [...selectedPeriod.rows].sort((a, b) =>
            (a.teacher_name ?? '').localeCompare(b.teacher_name ?? '')
          )
        : [],
    [selectedPeriod]
  )

  const periodTotals = useMemo(
    () => ({
      hours: sortedRows.reduce((s, r) => s + r.total_hours, 0),
      gross: sortedRows.reduce((s, r) => s + r.gross_pay, 0),
    }),
    [sortedRows]
  )

  if (periods.length === 0) {
    return (
      <p className="text-sm text-center py-12" style={{ color: colors.textTertiary }}>
        No pay period data found.
      </p>
    )
  }

  return (
    <div className="flex gap-4" style={{ minHeight: '400px' }}>
      {/* Left panel — period selector */}
      <div
        className="shrink-0 overflow-y-auto flex flex-col gap-1"
        style={{
          width: '220px',
          maxHeight: '600px',
        }}
      >
        {periods.map((p) => {
          const active = p.key === selectedKey
          return (
            <button
              key={p.key}
              onClick={() => setSelectedKey(p.key)}
              className="w-full text-left px-3 py-2.5 rounded-lg transition-colors"
              style={{
                borderRadius: radius.md,
                backgroundColor: active ? colors.accentLight : 'transparent',
                border: `1px solid ${active ? 'transparent' : colors.border}`,
              }}
            >
              <p
                className="text-xs font-semibold"
                style={{ color: active ? colors.accent : colors.textPrimary }}
              >
                {fmtDate(p.period_start)}
              </p>
              <p
                className="text-xs"
                style={{ color: active ? colors.accent : colors.textSecondary }}
              >
                → {fmtDate(p.period_end)}
              </p>
              <p
                className="text-[10px] mt-0.5"
                style={{ color: active ? colors.accent : colors.textTertiary }}
              >
                {p.rows.length} teacher{p.rows.length !== 1 ? 's' : ''}
              </p>
            </button>
          )
        })}
      </div>

      {/* Right panel — hours table */}
      <div className="flex-1 flex flex-col gap-3">
        {selectedPeriod ? (
          <>
            <Table headers={['Teacher', 'Hours', 'Rate', 'Gross Pay', 'Status']}>
              {sortedRows.map((row, i) => (
                <TableRow key={row.id} index={i}>
                  <TableCell style={{ color: colors.textPrimary, fontWeight: 500 }}>
                    {row.teacher_name ?? '—'}
                  </TableCell>
                  <TableCell>{formatHours(row.total_hours)}</TableCell>
                  <TableCell>${row.hourly_rate_snapshot}/hr</TableCell>
                  <TableCell style={{ color: colors.textPrimary, fontWeight: 500 }}>
                    {fmtMoney(row.gross_pay)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={row.status} />
                  </TableCell>
                </TableRow>
              ))}
            </Table>

            {/* Totals footer */}
            <div
              className="flex justify-end gap-6 px-4 py-2.5 rounded-lg text-xs"
              style={{
                background: colors.elevated,
                border: `1px solid ${colors.border}`,
                borderRadius: radius.md,
              }}
            >
              <span style={{ color: colors.textSecondary }}>
                Total hours:{' '}
                <span className="font-semibold" style={{ color: colors.textPrimary }}>
                  {formatHours(periodTotals.hours)}
                </span>
              </span>
              <span style={{ color: colors.textSecondary }}>
                Total gross:{' '}
                <span className="font-semibold" style={{ color: colors.textPrimary }}>
                  {fmtMoney(periodTotals.gross)}
                </span>
              </span>
            </div>
          </>
        ) : (
          <p className="text-sm text-center py-12" style={{ color: colors.textTertiary }}>
            Select a pay period.
          </p>
        )}
      </div>
    </div>
  )
}
