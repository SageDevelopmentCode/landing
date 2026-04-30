'use client'

import { useMemo } from 'react'
import { cssColors as colors, radius } from '../design-system'
import type { PaystubWithTeacher } from '@/app/actions/paystubs'
import { fmtMoney, formatHours, type TeacherRate } from './PayrollClient'

interface Props {
  paystubs: PaystubWithTeacher[]
  teachers: TeacherRate[]
}

export function TeacherOverviewTab({ paystubs, teachers }: Props) {
  const teacherStats = useMemo(() => {
    const map = new Map<string, {
      teacher_id: string
      teacher_name: string | null
      teacher_email: string
      totalPaidGross: number
      totalPaidHours: number
      pendingGross: number
      pendingCount: number
      currentRate: number | null
    }>()

    for (const t of teachers) {
      map.set(t.id, {
        teacher_id: t.id,
        teacher_name: t.full_name,
        teacher_email: t.email,
        totalPaidGross: 0,
        totalPaidHours: 0,
        pendingGross: 0,
        pendingCount: 0,
        currentRate: t.hourly_rate,
      })
    }

    for (const s of paystubs) {
      const entry = map.get(s.teacher_id)
      if (!entry) continue
      if (s.status === 'paid') {
        entry.totalPaidGross += s.gross_pay
        entry.totalPaidHours += s.total_hours
      } else {
        entry.pendingGross += s.gross_pay
        entry.pendingCount += 1
      }
    }

    return Array.from(map.values()).sort((a, b) => {
      if (b.pendingCount !== a.pendingCount) return b.pendingCount - a.pendingCount
      return (a.teacher_name ?? '').localeCompare(b.teacher_name ?? '')
    })
  }, [paystubs, teachers])

  if (teacherStats.length === 0) {
    return (
      <p className="text-sm text-center py-12" style={{ color: colors.textTertiary }}>
        No teacher data found.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {teacherStats.map((t) => (
        <div
          key={t.teacher_id}
          className="rounded-xl p-4 flex flex-col gap-3"
          style={{
            background: colors.elevated,
            border: `1px solid ${colors.border}`,
            borderRadius: radius.lg,
          }}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: colors.textPrimary }}>
                {t.teacher_name ?? '—'}
              </p>
              <p className="text-xs truncate mt-0.5" style={{ color: colors.textSecondary }}>
                {t.teacher_email}
              </p>
            </div>
            {t.pendingCount > 0 ? (
              <span
                className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border"
                style={{ color: colors.warning, backgroundColor: colors.warningBg, borderColor: colors.warningBorder }}
              >
                {t.pendingCount} pending
              </span>
            ) : (
              <span
                className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border"
                style={{ color: colors.textTertiary, backgroundColor: 'transparent', borderColor: colors.border }}
              >
                All clear
              </span>
            )}
          </div>

          {/* Stats */}
          <div
            className="rounded-lg divide-y text-xs"
            style={{ border: `1px solid ${colors.border}` }}
          >
            {[
              { label: 'Total Paid', value: fmtMoney(t.totalPaidGross), highlight: false },
              { label: 'Hours Paid', value: formatHours(t.totalPaidHours), highlight: false },
              {
                label: 'Awaiting Payment',
                value: fmtMoney(t.pendingGross),
                highlight: t.pendingGross > 0,
              },
              {
                label: 'Current Rate',
                value: t.currentRate != null ? `$${t.currentRate}/hr` : '—',
                highlight: false,
              },
            ].map(({ label, value, highlight }) => (
              <div
                key={label}
                className="flex justify-between items-center px-3 py-2"
                style={highlight ? { backgroundColor: colors.warningBg } : undefined}
              >
                <span style={{ color: colors.textSecondary }}>{label}</span>
                <span
                  className="font-semibold"
                  style={{ color: highlight ? colors.warning : colors.textPrimary }}
                >
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
