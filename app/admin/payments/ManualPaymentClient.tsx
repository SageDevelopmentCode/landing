'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Check, ChevronDown, CheckCircle2, Loader2 } from 'lucide-react'
import { createManualPayment, createManualSchoolYearPayment } from '@/app/actions/createManualPayment'
import {
  SCHOOL_YEAR_FUN_FRIDAY_MONTHS,
  FUN_FRIDAY_DROPIN_CENTS,
  FUN_FRIDAY_MONTHLY_CENTS,
  FUN_FRIDAY_SESSION_MONTHLY_CENTS,
  schoolYearFunFridayMonthCents,
  SCHOOL_YEAR_MONTHS as SHARED_SCHOOL_YEAR_MONTHS,
  HOMESCHOOL_TIERS,
  getGradeTier as sharedGetGradeTier,
  type HomeschoolTier,
} from '@/shared/billing/school-year'
import { cssColors as colors, radius, cssShadows as shadows } from '../design-system'
import type { EnrolledStudentOption, ExistingPayments, StudentProgram } from './page'

type FunFridayMonth = {
  key: string
  label: string
  shortLabel: string
  fridays: { label: string; date: string }[]
}

// ── Program data ──────────────────────────────────────────────────────────────

const SUMMER_WEEKS = [
  { week: 1, dates: 'May 26–28', days: ['tue', 'wed', 'thu'] },
  { week: 2, dates: 'Jun 1–4' },
  { week: 3, dates: 'Jun 8–11' },
  { week: 4, dates: 'Jun 15–18' },
  { week: 5, dates: 'Jun 22–25' },
  { week: 6, dates: 'Jun 29–Jul 2' },
  { week: 7, dates: 'Jul 6–9' },
  { week: 8, dates: 'Jul 13–16' },
  { week: 9, dates: 'Jul 20–23' },
  { week: 10, dates: 'Jul 27–30' },
  { week: 11, dates: 'Aug 3–6' },
  { week: 12, dates: 'Aug 10–13' },
]

const AFTERCARE_MONTHS = [
  {
    key: 'may', label: 'May 2026', shortLabel: 'May',
    days: [
      { label: 'Mon May 26', date: '2026-05-26' },
      { label: 'Tue May 27', date: '2026-05-27' },
      { label: 'Wed May 28', date: '2026-05-28' },
      { label: 'Thu May 29', date: '2026-05-29' },
    ],
  },
  {
    key: 'jun', label: 'June 2026', shortLabel: 'Jun',
    days: [
      { label: 'Mon Jun 1', date: '2026-06-01' },
      { label: 'Tue Jun 2', date: '2026-06-02' },
      { label: 'Wed Jun 3', date: '2026-06-03' },
      { label: 'Thu Jun 4', date: '2026-06-04' },
      { label: 'Mon Jun 8', date: '2026-06-08' },
      { label: 'Tue Jun 9', date: '2026-06-09' },
      { label: 'Wed Jun 10', date: '2026-06-10' },
      { label: 'Thu Jun 11', date: '2026-06-11' },
      { label: 'Mon Jun 15', date: '2026-06-15' },
      { label: 'Tue Jun 16', date: '2026-06-16' },
      { label: 'Wed Jun 17', date: '2026-06-17' },
      { label: 'Thu Jun 18', date: '2026-06-18' },
      { label: 'Mon Jun 22', date: '2026-06-22' },
      { label: 'Tue Jun 23', date: '2026-06-23' },
      { label: 'Wed Jun 24', date: '2026-06-24' },
      { label: 'Thu Jun 25', date: '2026-06-25' },
      { label: 'Mon Jun 29', date: '2026-06-29' },
      { label: 'Tue Jun 30', date: '2026-06-30' },
    ],
  },
  {
    key: 'jul', label: 'July 2026', shortLabel: 'Jul',
    days: [
      { label: 'Wed Jul 1', date: '2026-07-01' },
      { label: 'Thu Jul 2', date: '2026-07-02' },
      { label: 'Mon Jul 6', date: '2026-07-06' },
      { label: 'Tue Jul 7', date: '2026-07-07' },
      { label: 'Wed Jul 8', date: '2026-07-08' },
      { label: 'Thu Jul 9', date: '2026-07-09' },
      { label: 'Mon Jul 13', date: '2026-07-13' },
      { label: 'Tue Jul 14', date: '2026-07-14' },
      { label: 'Wed Jul 15', date: '2026-07-15' },
      { label: 'Thu Jul 16', date: '2026-07-16' },
      { label: 'Mon Jul 20', date: '2026-07-20' },
      { label: 'Tue Jul 21', date: '2026-07-21' },
      { label: 'Wed Jul 22', date: '2026-07-22' },
      { label: 'Thu Jul 23', date: '2026-07-23' },
      { label: 'Mon Jul 27', date: '2026-07-27' },
      { label: 'Tue Jul 28', date: '2026-07-28' },
      { label: 'Wed Jul 29', date: '2026-07-29' },
      { label: 'Thu Jul 30', date: '2026-07-30' },
    ],
  },
  {
    key: 'aug', label: 'August 2026', shortLabel: 'Aug',
    days: [
      { label: 'Mon Aug 3', date: '2026-08-03' },
      { label: 'Tue Aug 4', date: '2026-08-04' },
      { label: 'Wed Aug 5', date: '2026-08-05' },
      { label: 'Thu Aug 6', date: '2026-08-06' },
      { label: 'Mon Aug 10', date: '2026-08-10' },
      { label: 'Tue Aug 11', date: '2026-08-11' },
      { label: 'Wed Aug 12', date: '2026-08-12' },
      { label: 'Thu Aug 13', date: '2026-08-13' },
    ],
  },
]

const FUN_FRIDAY_MONTHS = [
  { key: 'may', label: 'May 2026', shortLabel: 'May', fridays: [{ label: 'Fri May 29', date: '2026-05-29' }] },
  {
    key: 'jun', label: 'June 2026', shortLabel: 'Jun',
    fridays: [
      { label: 'Fri Jun 5', date: '2026-06-05' },
      { label: 'Fri Jun 12', date: '2026-06-12' },
      { label: 'Fri Jun 19', date: '2026-06-19' },
      { label: 'Fri Jun 26', date: '2026-06-26' },
    ],
  },
  {
    key: 'jul', label: 'July 2026', shortLabel: 'Jul',
    fridays: [
      { label: 'Fri Jul 3', date: '2026-07-03' },
      { label: 'Fri Jul 10', date: '2026-07-10' },
      { label: 'Fri Jul 17', date: '2026-07-17' },
      { label: 'Fri Jul 24', date: '2026-07-24' },
      { label: 'Fri Jul 31', date: '2026-07-31' },
    ],
  },
  { key: 'aug', label: 'August 2026', shortLabel: 'Aug', fridays: [{ label: 'Fri Aug 7', date: '2026-08-07' }, { label: 'Fri Aug 14', date: '2026-08-14' }] },
] satisfies FunFridayMonth[]

const SCHOOL_YEAR_FUN_FRIDAY_MONTHS_MAPPED: FunFridayMonth[] = SCHOOL_YEAR_FUN_FRIDAY_MONTHS.map((m) => ({
  ...m,
  shortLabel: m.label.split(' ')[0].slice(0, 3),
}))

const ALL_FUN_FRIDAY_MONTHS: FunFridayMonth[] = [
  ...FUN_FRIDAY_MONTHS,
  ...SCHOOL_YEAR_FUN_FRIDAY_MONTHS_MAPPED,
]

const WEEKDAYS = [
  { key: 'mon', label: 'Mon' },
  { key: 'tue', label: 'Tue' },
  { key: 'wed', label: 'Wed' },
  { key: 'thu', label: 'Thu' },
]

const SCHOOL_YEAR_MONTHS = SHARED_SCHOOL_YEAR_MONTHS

type DropInProgramKey = 'summer_26' | 'school_year_26_27'

function deriveHomeschoolTier(dayCount: number): HomeschoolTier {
  if (dayCount <= 1) return 'dropin'
  if (dayCount === 2) return '2day'
  return '3day'
}

function weekdayKeysInSchoolYearMonth(monthIndex: number): string[] {
  const monthOffsets: [number, number][] = [
    [2026, 7], [2026, 8], [2026, 9], [2026, 10], [2026, 11],
    [2027, 0], [2027, 1], [2027, 2], [2027, 3], [2027, 4],
  ]
  const [year, month] = monthOffsets[monthIndex - 1]
  const seen = new Set<string>()
  const date = new Date(year, month, 1)
  while (date.getMonth() === month) {
    const dow = date.getDay()
    if (dow >= 1 && dow <= 4) {
      seen.add(['', 'mon', 'tue', 'wed', 'thu'][dow])
    }
    date.setDate(date.getDate() + 1)
  }
  return WEEKDAYS.map((d) => d.key).filter((k) => seen.has(k))
}

const SUPPLY_FEE_CENTS = 30000
const PRIMARY_TUITION_CENTS = 119500
const UPPER_TUITION_CENTS = 109500

// ── Helpers ───────────────────────────────────────────────────────────────────

function getGradeTier(grade: string | null): 'primary' | 'upper' {
  return sharedGetGradeTier(grade)
}

function formatCents(cents: number): string {
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

function summerFunFridayMonthCents(month: FunFridayMonth): number {
  return month.fridays.length >= 4
    ? FUN_FRIDAY_MONTHLY_CENTS
    : month.fridays.length * FUN_FRIDAY_SESSION_MONTHLY_CENTS
}

function findFunFridayMonth(key: string): FunFridayMonth | undefined {
  return ALL_FUN_FRIDAY_MONTHS.find((m) => m.key === key)
}

function estimateFunFridayTotalCents(
  months: FunFridayMonth[],
  selectedMonths: Set<string>,
  selectedFridays: Set<string>,
  isSchoolYear: boolean,
): number {
  const monthTotal = months
    .filter((m) => selectedMonths.has(m.key))
    .reduce(
      (sum, m) =>
        sum +
        (isSchoolYear
          ? schoolYearFunFridayMonthCents(m)
          : summerFunFridayMonthCents(m)),
      0,
    )
  const fridayTotal = selectedFridays.size * FUN_FRIDAY_DROPIN_CENTS
  return monthTotal + fridayTotal
}

function getInitials(name: string): string {
  return name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PaidChip() {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ backgroundColor: colors.pastelSage, color: colors.mistyForest }}
    >
      <CheckCircle2 className="w-3 h-3" /> Paid
    </span>
  )
}

function Checkbox({
  checked, onChange, disabled,
}: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center transition-all"
      style={{
        border: `2px solid ${checked ? colors.mistyForest : colors.border}`,
        backgroundColor: checked ? colors.mistyForest : 'transparent',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {checked && <Check className="w-3 h-3 text-white" />}
    </button>
  )
}

// ── Summer Picker ─────────────────────────────────────────────────────────────

function SummerPicker({
  paidWeeks,
  selectedWeeks,
  onToggle,
}: {
  paidWeeks: number[]
  selectedWeeks: Set<number>
  onToggle: (week: number) => void
}) {
  const paidSet = new Set(paidWeeks)
  const allUnpaidSelected = SUMMER_WEEKS.filter((w) => !paidSet.has(w.week)).every((w) => selectedWeeks.has(w.week))

  function toggleAll() {
    const unpaid = SUMMER_WEEKS.filter((w) => !paidSet.has(w.week)).map((w) => w.week)
    if (allUnpaidSelected) {
      unpaid.forEach((w) => selectedWeeks.has(w) && onToggle(w))
    } else {
      unpaid.forEach((w) => !selectedWeeks.has(w) && onToggle(w))
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium" style={{ color: colors.textTertiary }}>
          Select weeks to mark as paid
        </span>
        <button
          type="button"
          onClick={toggleAll}
          className="text-xs px-2 py-1 rounded-lg transition-colors"
          style={{
            color: colors.mistyForest,
            border: `1px solid ${colors.mistyForest}`,
            backgroundColor: 'transparent',
          }}
        >
          {allUnpaidSelected ? 'Deselect all' : 'Select all'}
        </button>
      </div>
      {SUMMER_WEEKS.map((w) => {
        const isPaid = paidSet.has(w.week)
        const isSelected = selectedWeeks.has(w.week)
        return (
          <div
            key={w.week}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
            style={{
              backgroundColor: isPaid ? colors.pastelSage : isSelected ? colors.accentLight : colors.elevated,
              border: `1px solid ${isPaid ? colors.mistyForest + '40' : isSelected ? colors.accent + '40' : colors.border}`,
            }}
          >
            {isPaid ? (
              <CheckCircle2 className="flex-shrink-0 w-5 h-5" style={{ color: colors.mistyForest }} />
            ) : (
              <Checkbox checked={isSelected} onChange={() => onToggle(w.week)} />
            )}
            <span className="flex-1 text-sm font-medium" style={{ color: colors.textPrimary }}>
              Week {w.week}
            </span>
            <span className="text-xs" style={{ color: colors.textTertiary }}>{w.dates}</span>
            {isPaid && <PaidChip />}
          </div>
        )
      })}
    </div>
  )
}

// ── Aftercare Picker ──────────────────────────────────────────────────────────

function AftercarePicker({
  paidMonths,
  paidDays,
  selectedMonths,
  selectedDays,
  onToggleMonth,
  onToggleDay,
}: {
  paidMonths: string[]
  paidDays: string[]
  selectedMonths: Set<string>
  selectedDays: Set<string>
  onToggleMonth: (key: string) => void
  onToggleDay: (date: string) => void
}) {
  const [activeMonthKey, setActiveMonthKey] = useState(AFTERCARE_MONTHS[0].key)
  const paidMonthSet = new Set(paidMonths)
  const paidDaySet = new Set(paidDays)
  const activeMonth = AFTERCARE_MONTHS.find((m) => m.key === activeMonthKey)!

  return (
    <div className="space-y-4">
      {/* Month tabs */}
      <div className="flex gap-2 flex-wrap">
        {AFTERCARE_MONTHS.map((m) => {
          const isPaid = paidMonthSet.has(m.key)
          const isSelected = selectedMonths.has(m.key)
          const isActive = m.key === activeMonthKey
          return (
            <button
              key={m.key}
              type="button"
              onClick={() => setActiveMonthKey(m.key)}
              className="px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5"
              style={{
                backgroundColor: isActive ? colors.mistyForest : isPaid ? colors.pastelSage : isSelected ? colors.accentLight : colors.elevated,
                color: isActive ? '#fff' : isPaid ? colors.mistyForest : isSelected ? colors.accent : colors.textSecondary,
                border: `1px solid ${isActive ? colors.mistyForest : isPaid ? colors.mistyForest + '40' : isSelected ? colors.accent + '40' : colors.border}`,
              }}
            >
              {m.shortLabel}
              {isPaid && <CheckCircle2 className="w-3 h-3" />}
            </button>
          )
        })}
      </div>

      {/* Active month details */}
      <div
        className="rounded-xl p-4 space-y-3"
        style={{ border: `1px solid ${colors.border}`, backgroundColor: colors.softCloud }}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
            {activeMonth.label}
          </span>
          {paidMonthSet.has(activeMonthKey) ? (
            <PaidChip />
          ) : (
            <button
              type="button"
              onClick={() => onToggleMonth(activeMonthKey)}
              className="text-xs px-2 py-1 rounded-lg transition-colors flex items-center gap-1"
              style={{
                color: selectedMonths.has(activeMonthKey) ? colors.mistyForest : colors.textTertiary,
                border: `1px solid ${selectedMonths.has(activeMonthKey) ? colors.mistyForest : colors.border}`,
                backgroundColor: selectedMonths.has(activeMonthKey) ? colors.pastelSage : 'transparent',
              }}
            >
              {selectedMonths.has(activeMonthKey) ? <><Check className="w-3 h-3" /> Entire month selected</> : 'Mark entire month'}
            </button>
          )}
        </div>

        {!paidMonthSet.has(activeMonthKey) && !selectedMonths.has(activeMonthKey) && (
          <div className="grid grid-cols-2 gap-2">
            {activeMonth.days.map((d) => {
              const isPaidDay = paidDaySet.has(d.date)
              const isSelected = selectedDays.has(d.date)
              return (
                <div
                  key={d.date}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg"
                  style={{
                    backgroundColor: isPaidDay ? colors.pastelSage : isSelected ? colors.accentLight : 'transparent',
                    border: `1px solid ${isPaidDay ? colors.mistyForest + '30' : isSelected ? colors.accent + '30' : colors.border}`,
                  }}
                >
                  {isPaidDay ? (
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: colors.mistyForest }} />
                  ) : (
                    <Checkbox checked={isSelected} onChange={() => onToggleDay(d.date)} />
                  )}
                  <span className="text-xs" style={{ color: isPaidDay ? colors.mistyForest : colors.textSecondary }}>
                    {d.label}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {selectedMonths.has(activeMonthKey) && !paidMonthSet.has(activeMonthKey) && (
          <p className="text-xs" style={{ color: colors.textTertiary }}>
            All {activeMonth.days.length} days in {activeMonth.shortLabel} will be marked paid.
          </p>
        )}
      </div>
    </div>
  )
}

// ── Fun Friday Picker ─────────────────────────────────────────────────────────

function FunFridayPicker({
  season,
  onSeasonChange,
  paidMonths,
  paidFridays,
  selectedMonths,
  selectedFridays,
  onToggleMonth,
  onToggleFriday,
}: {
  season: 'summer' | 'school_year'
  onSeasonChange: (season: 'summer' | 'school_year') => void
  paidMonths: string[]
  paidFridays: string[]
  selectedMonths: Set<string>
  selectedFridays: Set<string>
  onToggleMonth: (key: string) => void
  onToggleFriday: (date: string) => void
}) {
  const months = season === 'summer' ? FUN_FRIDAY_MONTHS : SCHOOL_YEAR_FUN_FRIDAY_MONTHS_MAPPED
  const [activeMonthKey, setActiveMonthKey] = useState(months[0].key)
  const paidMonthSet = new Set(paidMonths)
  const paidFridaySet = new Set(paidFridays)
  const activeMonth = months.find((m) => m.key === activeMonthKey) ?? months[0]

  const estimatedTotal = estimateFunFridayTotalCents(
    months,
    selectedMonths,
    selectedFridays,
    season === 'school_year',
  )

  function handleSeasonChange(next: 'summer' | 'school_year') {
    onSeasonChange(next)
    const nextMonths = next === 'summer' ? FUN_FRIDAY_MONTHS : SCHOOL_YEAR_FUN_FRIDAY_MONTHS_MAPPED
    setActiveMonthKey(nextMonths[0].key)
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(['summer', 'school_year'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => handleSeasonChange(s)}
            className="px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
            style={{
              backgroundColor: season === s ? colors.mistyForest : colors.elevated,
              color: season === s ? '#fff' : colors.textSecondary,
              border: `1px solid ${season === s ? colors.mistyForest : colors.border}`,
            }}
          >
            {s === 'summer' ? 'Summer 2026' : 'School Year 26–27'}
          </button>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        {months.map((m) => {
          const isPaid = paidMonthSet.has(m.key)
          const isSelected = selectedMonths.has(m.key)
          const isActive = m.key === activeMonthKey
          return (
            <button
              key={m.key}
              type="button"
              onClick={() => setActiveMonthKey(m.key)}
              className="px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5"
              style={{
                backgroundColor: isActive ? colors.mistyForest : isPaid ? colors.pastelSage : isSelected ? colors.accentLight : colors.elevated,
                color: isActive ? '#fff' : isPaid ? colors.mistyForest : isSelected ? colors.accent : colors.textSecondary,
                border: `1px solid ${isActive ? colors.mistyForest : isPaid ? colors.mistyForest + '40' : isSelected ? colors.accent + '40' : colors.border}`,
              }}
            >
              {m.shortLabel}
              {isPaid && <CheckCircle2 className="w-3 h-3" />}
            </button>
          )
        })}
      </div>

      <div
        className="rounded-xl p-4 space-y-3"
        style={{ border: `1px solid ${colors.border}`, backgroundColor: colors.softCloud }}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
            {activeMonth.label}
          </span>
          {paidMonthSet.has(activeMonthKey) ? (
            <PaidChip />
          ) : activeMonth.fridays.length > 1 ? (
            <button
              type="button"
              onClick={() => onToggleMonth(activeMonthKey)}
              className="text-xs px-2 py-1 rounded-lg transition-colors flex items-center gap-1"
              style={{
                color: selectedMonths.has(activeMonthKey) ? colors.mistyForest : colors.textTertiary,
                border: `1px solid ${selectedMonths.has(activeMonthKey) ? colors.mistyForest : colors.border}`,
                backgroundColor: selectedMonths.has(activeMonthKey) ? colors.pastelSage : 'transparent',
              }}
            >
              {selectedMonths.has(activeMonthKey) ? <><Check className="w-3 h-3" /> Entire month selected</> : 'Mark entire month'}
            </button>
          ) : null}
        </div>

        {!paidMonthSet.has(activeMonthKey) && !selectedMonths.has(activeMonthKey) && (
          <div className="space-y-2">
            {activeMonth.fridays.map((d) => {
              const isPaidDay = paidFridaySet.has(d.date)
              const isSelected = selectedFridays.has(d.date)
              return (
                <div
                  key={d.date}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg"
                  style={{
                    backgroundColor: isPaidDay ? colors.pastelSage : isSelected ? colors.accentLight : 'transparent',
                    border: `1px solid ${isPaidDay ? colors.mistyForest + '30' : isSelected ? colors.accent + '30' : colors.border}`,
                  }}
                >
                  {isPaidDay ? (
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: colors.mistyForest }} />
                  ) : (
                    <Checkbox checked={isSelected} onChange={() => onToggleFriday(d.date)} />
                  )}
                  <span className="text-xs" style={{ color: isPaidDay ? colors.mistyForest : colors.textSecondary }}>
                    {d.label}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {selectedMonths.has(activeMonthKey) && !paidMonthSet.has(activeMonthKey) && (
          <p className="text-xs" style={{ color: colors.textTertiary }}>
            All {activeMonth.fridays.length} Friday{activeMonth.fridays.length !== 1 ? 's' : ''} in {activeMonth.shortLabel} will be marked paid.
          </p>
        )}
      </div>

      {estimatedTotal > 0 && (
        <div
          className="px-4 py-3 rounded-xl text-sm"
          style={{ backgroundColor: colors.elevated, border: `1px solid ${colors.border}` }}
        >
          <span className="font-semibold" style={{ color: colors.textPrimary }}>
            Estimated total: {formatCents(estimatedTotal)}
          </span>
          <p className="text-xs mt-1" style={{ color: colors.textTertiary }}>
            Override with the optional Amount field below if needed.
          </p>
        </div>
      )}
    </div>
  )
}

// ── Homeschool Picker ─────────────────────────────────────────────────────────

function HomeschoolPicker({
  paidWeekDays,
  selectedWeekDays,
  onToggleDay,
}: {
  paidWeekDays: Record<number, string[]>
  selectedWeekDays: Record<number, Set<string>>
  onToggleDay: (week: number, day: string) => void
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs mb-3" style={{ color: colors.textTertiary }}>
        Select which days each week to mark as paid.
      </p>
      {SUMMER_WEEKS.map((w) => {
        const paidDays = new Set(paidWeekDays[w.week] ?? [])
        const selectedDays = selectedWeekDays[w.week] ?? new Set()
        const allPaid = WEEKDAYS.every((d) => paidDays.has(d.key))

        return (
          <div
            key={w.week}
            className="rounded-lg px-3 py-2.5"
            style={{
              border: `1px solid ${colors.border}`,
              backgroundColor: allPaid ? colors.pastelSage : colors.elevated,
            }}
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm font-medium flex-1" style={{ color: colors.textPrimary }}>
                Week {w.week}
              </span>
              <span className="text-xs" style={{ color: colors.textTertiary }}>{w.dates}</span>
              {allPaid && <PaidChip />}
            </div>
            <div className="flex gap-2">
              {WEEKDAYS.map((d) => {
                const isPaidDay = paidDays.has(d.key)
                const isSelected = selectedDays.has(d.key)
                return (
                  <button
                    key={d.key}
                    type="button"
                    disabled={isPaidDay}
                    onClick={() => onToggleDay(w.week, d.key)}
                    className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{
                      backgroundColor: isPaidDay
                        ? colors.mistyForest
                        : isSelected
                        ? colors.accent
                        : colors.surface,
                      color: isPaidDay || isSelected ? '#fff' : colors.textTertiary,
                      border: `1px solid ${isPaidDay ? colors.mistyForest : isSelected ? colors.accent : colors.border}`,
                      cursor: isPaidDay ? 'not-allowed' : 'pointer',
                      opacity: isPaidDay ? 0.7 : 1,
                    }}
                  >
                    {d.label}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── School Year Homeschool Picker ─────────────────────────────────────────────

function HomeschoolSchoolYearPicker({
  paidMonthDays,
  selectedMonthDays,
  tier,
  onToggleDay,
  onTierChange,
}: {
  paidMonthDays: Record<number, string[]>
  selectedMonthDays: Record<number, Set<string>>
  tier: HomeschoolTier
  onToggleDay: (monthIndex: number, day: string) => void
  onTierChange: (tier: HomeschoolTier) => void
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs mb-1" style={{ color: colors.textTertiary }}>
        Select which days each month to mark as paid.
      </p>
      <div>
        <label className="block text-xs font-semibold mb-1.5" style={{ color: colors.textSecondary }}>
          Schedule tier
        </label>
        <div className="flex gap-2 flex-wrap">
          {HOMESCHOOL_TIERS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => onTierChange(t.key)}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
              style={{
                backgroundColor: tier === t.key ? colors.mistyForest : colors.elevated,
                color: tier === t.key ? '#fff' : colors.textSecondary,
                border: `1px solid ${tier === t.key ? colors.mistyForest : colors.border}`,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      {SCHOOL_YEAR_MONTHS.map((month) => {
        const paidDays = new Set(paidMonthDays[month.index] ?? [])
        const selectedDays = selectedMonthDays[month.index] ?? new Set()
        const availableKeys = weekdayKeysInSchoolYearMonth(month.index)
        const allPaid = availableKeys.length > 0 && availableKeys.every((d) => paidDays.has(d))

        return (
          <div
            key={month.index}
            className="rounded-lg px-3 py-2.5"
            style={{
              border: `1px solid ${colors.border}`,
              backgroundColor: allPaid ? colors.pastelSage : colors.elevated,
            }}
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm font-medium flex-1" style={{ color: colors.textPrimary }}>
                {month.label}
              </span>
              {allPaid && <PaidChip />}
            </div>
            <div className="flex gap-2">
              {WEEKDAYS.filter((d) => availableKeys.includes(d.key)).map((d) => {
                const isPaidDay = paidDays.has(d.key)
                const isSelected = selectedDays.has(d.key)
                return (
                  <button
                    key={d.key}
                    type="button"
                    disabled={isPaidDay}
                    onClick={() => onToggleDay(month.index, d.key)}
                    className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{
                      backgroundColor: isPaidDay
                        ? colors.mistyForest
                        : isSelected
                        ? colors.accent
                        : colors.surface,
                      color: isPaidDay || isSelected ? '#fff' : colors.textTertiary,
                      border: `1px solid ${isPaidDay ? colors.mistyForest : isSelected ? colors.accent : colors.border}`,
                      cursor: isPaidDay ? 'not-allowed' : 'pointer',
                      opacity: isPaidDay ? 0.7 : 1,
                    }}
                  >
                    {d.label}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── School Year Picker ────────────────────────────────────────────────────────

function SchoolYearPicker({
  paidSupplyFee,
  paidMonths,
  includeSupplyFee,
  selectedMonths,
  gradeTier,
  useCustomTuitionAmount,
  customTuitionDollars,
  onToggleSupplyFee,
  onToggleMonth,
  onToggleCustomTuition,
  onCustomTuitionChange,
}: {
  paidSupplyFee: boolean
  paidMonths: number[]
  includeSupplyFee: boolean
  selectedMonths: Set<number>
  gradeTier: 'primary' | 'upper'
  useCustomTuitionAmount: boolean
  customTuitionDollars: string
  onToggleSupplyFee: () => void
  onToggleMonth: (index: number) => void
  onToggleCustomTuition: () => void
  onCustomTuitionChange: (value: string) => void
}) {
  const paidMonthSet = new Set(paidMonths)
  const tuitionRate = gradeTier === 'primary' ? PRIMARY_TUITION_CENTS : UPPER_TUITION_CENTS
  const unpaidMonths = SCHOOL_YEAR_MONTHS.filter((m) => !paidMonthSet.has(m.index))
  const allUnpaidSelected = unpaidMonths.length > 0 && unpaidMonths.every((m) => selectedMonths.has(m.index))
  const defaultTuitionPart = tuitionRate * selectedMonths.size
  const customTuitionPart =
    useCustomTuitionAmount && customTuitionDollars
      ? Math.round(parseFloat(customTuitionDollars) * 100) || 0
      : defaultTuitionPart
  const tuitionPart =
    useCustomTuitionAmount && customTuitionDollars ? customTuitionPart : defaultTuitionPart

  function toggleAllMonths() {
    if (allUnpaidSelected) {
      unpaidMonths.forEach((m) => selectedMonths.has(m.index) && onToggleMonth(m.index))
    } else {
      unpaidMonths.forEach((m) => !selectedMonths.has(m.index) && onToggleMonth(m.index))
    }
  }

  const supplyPart = includeSupplyFee && !paidSupplyFee ? SUPPLY_FEE_CENTS : 0
  const totalCents = supplyPart + tuitionPart

  return (
    <div className="space-y-5">
      {/* Supply fee */}
      <div>
        <span className="text-xs font-medium block mb-2" style={{ color: colors.textTertiary }}>
          Supply Fee ({formatCents(SUPPLY_FEE_CENTS)})
        </span>
        <div
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
          style={{
            border: `1px solid ${colors.border}`,
            backgroundColor: paidSupplyFee ? colors.pastelSage : colors.surface,
            opacity: paidSupplyFee ? 0.8 : 1,
          }}
        >
          {paidSupplyFee ? (
            <>
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: colors.mistyForest }} />
              <span className="text-sm" style={{ color: colors.mistyForest }}>Supply fee paid</span>
              <PaidChip />
            </>
          ) : (
            <>
              <Checkbox checked={includeSupplyFee} onChange={onToggleSupplyFee} />
              <span className="text-sm" style={{ color: colors.textPrimary }}>Mark supply fee as paid</span>
            </>
          )}
        </div>
      </div>

      {/* Tuition months */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium" style={{ color: colors.textTertiary }}>
            Tuition months ({formatCents(tuitionRate)}/mo)
          </span>
          {unpaidMonths.length > 0 && (
            <button
              type="button"
              onClick={toggleAllMonths}
              className="text-xs px-2 py-1 rounded-lg transition-colors"
              style={{ color: colors.accent, border: `1px solid ${colors.accent}40` }}
            >
              {allUnpaidSelected ? 'Deselect all' : 'Select all unpaid'}
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {SCHOOL_YEAR_MONTHS.map((m) => {
            const isPaid = paidMonthSet.has(m.index)
            const isSelected = selectedMonths.has(m.index)
            return (
              <div
                key={m.index}
                className="flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{
                  border: `1px solid ${isPaid ? colors.mistyForest + '40' : isSelected ? colors.accent + '40' : colors.border}`,
                  backgroundColor: isPaid ? colors.pastelSage : isSelected ? colors.accentLight : colors.surface,
                  opacity: isPaid ? 0.8 : 1,
                }}
              >
                {isPaid ? (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: colors.mistyForest }} />
                ) : (
                  <Checkbox checked={isSelected} onChange={() => onToggleMonth(m.index)} />
                )}
                <div className="flex-1 min-w-0">
                  <span className="text-sm block" style={{ color: isPaid ? colors.mistyForest : colors.textPrimary }}>
                    {m.short}
                  </span>
                  <span className="text-xs" style={{ color: colors.textTertiary }}>{m.label}</span>
                </div>
                {isPaid && <PaidChip />}
              </div>
            )
          })}
        </div>
      </div>

      {selectedMonths.size > 0 && (
        <div className="space-y-2">
          <div
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
            style={{ border: `1px solid ${colors.border}`, backgroundColor: colors.surface }}
          >
            <Checkbox checked={useCustomTuitionAmount} onChange={onToggleCustomTuition} />
            <span className="text-sm" style={{ color: colors.textPrimary }}>Use custom tuition amount</span>
          </div>
          {useCustomTuitionAmount && (
            <div
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl"
              style={{ border: `1px solid ${colors.border}`, backgroundColor: colors.elevated }}
            >
              <span className="text-sm" style={{ color: colors.textTertiary }}>$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder={(defaultTuitionPart / 100).toFixed(2)}
                value={customTuitionDollars}
                onChange={(e) => onCustomTuitionChange(e.target.value)}
                className="flex-1 bg-transparent outline-none text-sm"
                style={{ color: colors.textPrimary }}
              />
            </div>
          )}
        </div>
      )}

      {totalCents > 0 && (
        <div
          className="px-4 py-3 rounded-xl text-sm"
          style={{ backgroundColor: colors.elevated, border: `1px solid ${colors.border}` }}
        >
          <span className="font-semibold" style={{ color: colors.textPrimary }}>
            Total: {formatCents(totalCents)}
          </span>
          <div className="text-xs mt-1" style={{ color: colors.textTertiary }}>
            {includeSupplyFee && !paidSupplyFee && `Supply fee ${formatCents(SUPPLY_FEE_CENTS)}`}
            {includeSupplyFee && !paidSupplyFee && selectedMonths.size > 0 && ' + '}
            {selectedMonths.size > 0 && (
              useCustomTuitionAmount && customTuitionDollars
                ? `Custom tuition ${formatCents(tuitionPart)}`
                : `${selectedMonths.size} month${selectedMonths.size > 1 ? 's' : ''} ${formatCents(tuitionPart)}`
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

interface Props {
  enrolledStudents: EnrolledStudentOption[]
  existingPaymentsByStudent: Record<string, ExistingPayments>
}

type PaymentTypeKey = 'summer_tuition' | 'aftercare_tuition' | 'fun_friday_tuition' | 'homeschool_dropin' | 'school_year'

export function ManualPaymentClient({ enrolledStudents, existingPaymentsByStudent }: Props) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [activeProgram, setActiveProgram] = useState<PaymentTypeKey>('summer_tuition')
  const [activeDropInProgram, setActiveDropInProgram] = useState<DropInProgramKey | null>(null)

  // Summer state
  const [selectedWeeks, setSelectedWeeks] = useState<Set<number>>(new Set())

  // Aftercare state
  const [selectedAftercareMonths, setSelectedAftercareMonths] = useState<Set<string>>(new Set())
  const [selectedAftercareDays, setSelectedAftercareDays] = useState<Set<string>>(new Set())

  // Fun friday state
  const [funFridaySeason, setFunFridaySeason] = useState<'summer' | 'school_year'>('school_year')
  const [selectedFunFridayMonths, setSelectedFunFridayMonths] = useState<Set<string>>(new Set())
  const [selectedFridays, setSelectedFridays] = useState<Set<string>>(new Set())

  // Homeschool state
  const [selectedWeekDays, setSelectedWeekDays] = useState<Record<number, Set<string>>>({})
  const [selectedSchoolYearHomeschoolMonthDays, setSelectedSchoolYearHomeschoolMonthDays] = useState<
    Record<number, Set<string>>
  >({})
  const [schoolYearHomeschoolTier, setSchoolYearHomeschoolTier] = useState<HomeschoolTier>('dropin')

  // School year state
  const [includeSupplyFee, setIncludeSupplyFee] = useState(false)
  const [selectedSchoolYearMonths, setSelectedSchoolYearMonths] = useState<Set<number>>(new Set())
  const [useCustomTuitionAmount, setUseCustomTuitionAmount] = useState(false)
  const [customTuitionDollars, setCustomTuitionDollars] = useState('')

  // Form state
  const [amountDollars, setAmountDollars] = useState('')
  const [notes, setNotes] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [isPending, startTransition] = useTransition()

  const selectedStudent = useMemo(
    () => enrolledStudents.find((s) => s.studentId === selectedStudentId) ?? null,
    [enrolledStudents, selectedStudentId]
  )

  const emptyExistingPayments: ExistingPayments = {
    paidWeeks: [],
    paidAftercareMonths: [],
    paidAftercareDays: [],
    paidFunFridayMonths: [],
    paidFridays: [],
    paidHomeschoolSummerWeekDays: {},
    paidHomeschoolSchoolYearMonthDays: {},
    paidSupplyFee: false,
    paidSchoolYearMonths: [],
  }

  const existingPayments: ExistingPayments = selectedStudentId
    ? (existingPaymentsByStudent[selectedStudentId] ?? emptyExistingPayments)
    : emptyExistingPayments

  const filteredStudents = useMemo(() => {
    const q = search.toLowerCase()
    return enrolledStudents.filter(
      (s) =>
        s.studentName.toLowerCase().includes(q) ||
        (s.parentName ?? '').toLowerCase().includes(q)
    )
  }, [enrolledStudents, search])

  function selectStudent(s: EnrolledStudentOption) {
    setSelectedStudentId(s.studentId)
    setSearch(s.studentName)
    setShowDropdown(false)
    // Reset selections
    setSelectedWeeks(new Set())
    setSelectedAftercareMonths(new Set())
    setSelectedAftercareDays(new Set())
    setSelectedFunFridayMonths(new Set())
    setSelectedFridays(new Set())
    setSelectedWeekDays({})
    setSelectedSchoolYearHomeschoolMonthDays({})
    setSchoolYearHomeschoolTier('dropin')
    setIncludeSupplyFee(false)
    setSelectedSchoolYearMonths(new Set())
    setUseCustomTuitionAmount(false)
    setCustomTuitionDollars('')
    setFunFridaySeason(
      s.programs.some((p) => p.paymentType === 'school_year') ? 'school_year' : 'summer',
    )
    setSuccessMsg('')
    setErrorMsg('')
    // Default to first available program
    const first = s.programs[0]
    if (first) {
      setActiveProgram(first.paymentType)
      setActiveDropInProgram(
        first.paymentType === 'homeschool_dropin'
          ? (first.dropInProgram as DropInProgramKey | null) ?? 'summer_26'
          : null,
      )
    }
  }

  function resetSelections() {
    setSelectedWeeks(new Set())
    setSelectedAftercareMonths(new Set())
    setSelectedAftercareDays(new Set())
    setSelectedFunFridayMonths(new Set())
    setSelectedFridays(new Set())
    setSelectedWeekDays({})
    setSelectedSchoolYearHomeschoolMonthDays({})
    setSchoolYearHomeschoolTier('dropin')
    setIncludeSupplyFee(false)
    setSelectedSchoolYearMonths(new Set())
    setUseCustomTuitionAmount(false)
    setCustomTuitionDollars('')
    setAmountDollars('')
    setNotes('')
  }

  function toggleWeek(week: number) {
    setSelectedWeeks((prev) => {
      const next = new Set(prev)
      next.has(week) ? next.delete(week) : next.add(week)
      return next
    })
  }

  function toggleAftercareMonth(key: string) {
    setSelectedAftercareMonths((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
        // Remove individual day selections for this month
        const month = AFTERCARE_MONTHS.find((m) => m.key === key)
        if (month) {
          setSelectedAftercareDays((days) => {
            const nd = new Set(days)
            month.days.forEach((d) => nd.delete(d.date))
            return nd
          })
        }
      }
      return next
    })
  }

  function toggleAftercareDay(date: string) {
    setSelectedAftercareDays((prev) => {
      const next = new Set(prev)
      next.has(date) ? next.delete(date) : next.add(date)
      return next
    })
  }

  function toggleFunFridayMonth(key: string) {
    setSelectedFunFridayMonths((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
        const month = findFunFridayMonth(key)
        if (month) {
          setSelectedFridays((fridays) => {
            const nf = new Set(fridays)
            month.fridays.forEach((f) => nf.delete(f.date))
            return nf
          })
        }
      }
      return next
    })
  }

  function toggleFriday(date: string) {
    setSelectedFridays((prev) => {
      const next = new Set(prev)
      next.has(date) ? next.delete(date) : next.add(date)
      return next
    })
  }

  function toggleHomeschoolDay(week: number, day: string) {
    setSelectedWeekDays((prev) => {
      const weekSet = new Set(prev[week] ?? [])
      weekSet.has(day) ? weekSet.delete(day) : weekSet.add(day)
      return { ...prev, [week]: weekSet }
    })
  }

  function toggleSchoolYearHomeschoolDay(monthIndex: number, day: string) {
    setSelectedSchoolYearHomeschoolMonthDays((prev) => {
      const monthSet = new Set(prev[monthIndex] ?? [])
      monthSet.has(day) ? monthSet.delete(day) : monthSet.add(day)
      const next = { ...prev, [monthIndex]: monthSet }
      const maxDays = Math.max(
        0,
        ...Object.values(next).map((s) => s.size),
      )
      if (maxDays > 0) {
        setSchoolYearHomeschoolTier(deriveHomeschoolTier(maxDays))
      }
      return next
    })
  }

  function toggleSchoolYearMonth(index: number) {
    setSelectedSchoolYearMonths((prev) => {
      const next = new Set(prev)
      next.has(index) ? next.delete(index) : next.add(index)
      return next
    })
  }

  const activeHomeschoolProgram = useMemo(
    () =>
      selectedStudent?.programs.find(
        (p) =>
          p.paymentType === 'homeschool_dropin' &&
          p.dropInProgram === activeDropInProgram,
      ) ?? null,
    [selectedStudent, activeDropInProgram],
  )

  const schoolYearProgram = useMemo(
    () => selectedStudent?.programs.find((p) => p.paymentType === 'school_year') ?? null,
    [selectedStudent]
  )

  const schoolYearGradeTier = getGradeTier(schoolYearProgram?.childGrade ?? null)

  function buildMetadata(program: StudentProgram): Record<string, string> | null {
    if (activeProgram === 'summer_tuition') {
      if (selectedWeeks.size === 0) return null
      const allWeeks = selectedWeeks.size === 12
      return allWeeks
        ? { plan_type: 'full' }
        : { plan_type: 'weekly', weeks: Array.from(selectedWeeks).sort((a, b) => a - b).join(',') }
    }

    if (activeProgram === 'aftercare_tuition') {
      const months = Array.from(selectedAftercareMonths).join(',')
      const days = Array.from(selectedAftercareDays).join(',')
      if (!months && !days) return null
      const meta: Record<string, string> = {}
      if (months) meta.selected_months = months
      if (days) meta.selected_days = days
      return meta
    }

    if (activeProgram === 'fun_friday_tuition') {
      const months = Array.from(selectedFunFridayMonths).join(',')
      const fridays = Array.from(selectedFridays).join(',')
      if (!months && !fridays) return null
      const meta: Record<string, string> = {}
      if (months) meta.selected_months = months
      if (fridays) meta.selected_fridays = fridays
      return meta
    }

    if (activeProgram === 'homeschool_dropin') {
      const isSchoolYear = activeDropInProgram === 'school_year_26_27'
      const source = isSchoolYear ? selectedSchoolYearHomeschoolMonthDays : selectedWeekDays
      const selections: { week: number; days: string[] }[] = []
      for (const [weekStr, daySet] of Object.entries(source)) {
        const days = Array.from(daySet)
        if (days.length > 0) selections.push({ week: Number(weekStr), days })
      }
      if (selections.length === 0) return null

      const selectedWeeks = selections.map((s) => s.week).sort((a, b) => a - b)
      const allDays = [...new Set(selections.flatMap((s) => s.days))]

      if (isSchoolYear) {
        const gradeTier = getGradeTier(program.childGrade)
        return {
          program: 'school_year_26_27',
          tier: schoolYearHomeschoolTier,
          grade_tier: gradeTier,
          selected_weeks: selectedWeeks.join(','),
          selected_days: allDays.join(','),
          week_selections: JSON.stringify(selections),
        }
      }

      return {
        program: 'summer_26',
        tier: 'dropin',
        week_selections: JSON.stringify(selections),
      }
    }

    return null
  }

  function hasAnySelection(): boolean {
    if (activeProgram === 'summer_tuition') return selectedWeeks.size > 0
    if (activeProgram === 'aftercare_tuition') return selectedAftercareMonths.size > 0 || selectedAftercareDays.size > 0
    if (activeProgram === 'fun_friday_tuition') return selectedFunFridayMonths.size > 0 || selectedFridays.size > 0
    if (activeProgram === 'homeschool_dropin') {
      if (activeDropInProgram === 'school_year_26_27') {
        return Object.values(selectedSchoolYearHomeschoolMonthDays).some((s) => s.size > 0)
      }
      return Object.values(selectedWeekDays).some((s) => s.size > 0)
    }
    if (activeProgram === 'school_year') {
      const supplySelected = includeSupplyFee && !existingPayments.paidSupplyFee
      return supplySelected || selectedSchoolYearMonths.size > 0
    }
    return false
  }

  function handleSubmit() {
    if (!selectedStudent) return

    if (activeProgram === 'school_year') {
      if (!schoolYearProgram) return
      if (!hasAnySelection()) {
        setErrorMsg('Please select supply fee and/or at least one tuition month to mark as paid.')
        return
      }

      let customTuitionAmountCents: number | undefined
      if (useCustomTuitionAmount && selectedSchoolYearMonths.size > 0) {
        if (customTuitionDollars.trim() === '') {
          setErrorMsg('Please enter a custom tuition amount.')
          return
        }
        const cents = Math.round(parseFloat(customTuitionDollars) * 100)
        if (Number.isNaN(cents) || cents < 0) {
          setErrorMsg('Please enter a valid custom tuition amount.')
          return
        }
        customTuitionAmountCents = cents
      }

      setErrorMsg('')
      startTransition(async () => {
        const result = await createManualSchoolYearPayment({
          studentId: selectedStudent.studentId,
          parentId: selectedStudent.parentId,
          applicationId: schoolYearProgram.applicationId || undefined,
          includeSupplyFee,
          tuitionMonthIndices: Array.from(selectedSchoolYearMonths).sort((a, b) => a - b),
          gradeTier: schoolYearGradeTier,
          notes,
          customTuitionAmountCents,
        })

        if (result.success) {
          setSuccessMsg(
            result.createdCount && result.createdCount > 1
              ? `${result.createdCount} payments recorded successfully.`
              : 'Payment recorded successfully.'
          )
          resetSelections()
          router.refresh()
        } else {
          setErrorMsg(result.error ?? 'Failed to record payment.')
        }
      })
      return
    }

    const program =
      activeProgram === 'homeschool_dropin'
        ? activeHomeschoolProgram
        : selectedStudent.programs.find((p) => p.paymentType === activeProgram)
    if (!program) return

    const metadata = buildMetadata(program)
    if (!metadata) {
      setErrorMsg('Please select at least one period to mark as paid.')
      return
    }

    setErrorMsg('')
    startTransition(async () => {
      const amountCents = amountDollars ? Math.round(parseFloat(amountDollars) * 100) : 0
      const result = await createManualPayment({
        studentId: selectedStudent.studentId,
        parentId: selectedStudent.parentId,
        paymentType: activeProgram,
        metadata,
        amountCents,
        notes,
        applicationId: program.applicationId || undefined,
      })

      if (result.success) {
        setSuccessMsg('Payment recorded successfully.')
        resetSelections()
        router.refresh()
      } else {
        setErrorMsg(result.error ?? 'Failed to record payment.')
      }
    })
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Student search */}
      <div>
        <label className="block text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
          Student
        </label>
        <div className="relative">
          <div
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
            style={{
              border: `1px solid ${colors.border}`,
              backgroundColor: colors.elevated,
              boxShadow: shadows.soft,
            }}
          >
            <Search className="w-4 h-4 flex-shrink-0" style={{ color: colors.textQuaternary }} />
            <input
              type="text"
              placeholder="Search student or parent name…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setShowDropdown(true)
                if (!e.target.value) setSelectedStudentId(null)
              }}
              onFocus={() => setShowDropdown(true)}
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: colors.textPrimary }}
            />
            {selectedStudentId && <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: colors.mistyForest }} />}
            {!selectedStudentId && <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: colors.textQuaternary }} />}
          </div>

          {showDropdown && filteredStudents.length > 0 && (
            <div
              className="absolute z-20 w-full mt-1 rounded-xl overflow-hidden py-1"
              style={{
                border: `1px solid ${colors.border}`,
                backgroundColor: colors.surface,
                boxShadow: shadows.large,
                maxHeight: '280px',
                overflowY: 'auto',
              }}
            >
              {filteredStudents.map((s) => (
                <button
                  key={s.studentId}
                  type="button"
                  onMouseDown={() => selectStudent(s)}
                  className="w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors hover:bg-opacity-50"
                  style={{ backgroundColor: s.studentId === selectedStudentId ? colors.accentLight : 'transparent' }}
                  onMouseEnter={(e) => {
                    if (s.studentId !== selectedStudentId)
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = colors.elevated
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                      s.studentId === selectedStudentId ? colors.accentLight : 'transparent'
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: colors.accentLight, color: colors.accent }}
                  >
                    {getInitials(s.studentName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: colors.textPrimary }}>
                      {s.studentName}
                    </div>
                    {s.parentName && (
                      <div className="text-xs truncate" style={{ color: colors.textTertiary }}>
                        {s.parentName}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 flex-shrink-0 flex-wrap justify-end">
                    {s.programs.slice(0, 2).map((p) => (
                      <span
                        key={p.paymentType + p.dropInProgram}
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: colors.pastelSage, color: colors.mistyForest }}
                      >
                        {p.programLabel.split(' ')[0]}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Selected student form */}
      {selectedStudent && (
        <>
          {/* Program tabs */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
              Program
            </label>
            <div className="flex gap-2 flex-wrap">
              {selectedStudent.programs.map((p) => {
                const tabKey = p.paymentType + (p.dropInProgram ?? '')
                const isCurrentTab =
                  activeProgram === p.paymentType &&
                  (p.paymentType !== 'homeschool_dropin' || p.dropInProgram === activeDropInProgram)
                return (
                  <button
                    key={tabKey}
                    type="button"
                    onClick={() => {
                      setActiveProgram(p.paymentType)
                      setActiveDropInProgram(
                        p.paymentType === 'homeschool_dropin'
                          ? (p.dropInProgram as DropInProgramKey | null) ?? 'summer_26'
                          : null,
                      )
                      resetSelections()
                      setSuccessMsg('')
                      setErrorMsg('')
                    }}
                    className="px-4 py-2 rounded-full text-sm font-medium transition-colors"
                    style={{
                      backgroundColor: isCurrentTab ? colors.mistyForest : colors.elevated,
                      color: isCurrentTab ? '#fff' : colors.textSecondary,
                      border: `1px solid ${isCurrentTab ? colors.mistyForest : colors.border}`,
                    }}
                  >
                    {p.programLabel}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Period picker */}
          <div
            className="rounded-xl p-4"
            style={{ border: `1px solid ${colors.border}`, backgroundColor: colors.softCloud }}
          >
            {activeProgram === 'summer_tuition' && (
              <SummerPicker
                paidWeeks={existingPayments.paidWeeks}
                selectedWeeks={selectedWeeks}
                onToggle={toggleWeek}
              />
            )}
            {activeProgram === 'aftercare_tuition' && (
              <AftercarePicker
                paidMonths={existingPayments.paidAftercareMonths}
                paidDays={existingPayments.paidAftercareDays}
                selectedMonths={selectedAftercareMonths}
                selectedDays={selectedAftercareDays}
                onToggleMonth={toggleAftercareMonth}
                onToggleDay={toggleAftercareDay}
              />
            )}
            {activeProgram === 'fun_friday_tuition' && (
              <FunFridayPicker
                season={funFridaySeason}
                onSeasonChange={setFunFridaySeason}
                paidMonths={existingPayments.paidFunFridayMonths}
                paidFridays={existingPayments.paidFridays}
                selectedMonths={selectedFunFridayMonths}
                selectedFridays={selectedFridays}
                onToggleMonth={toggleFunFridayMonth}
                onToggleFriday={toggleFriday}
              />
            )}
            {activeProgram === 'homeschool_dropin' && activeDropInProgram === 'summer_26' && (
              <HomeschoolPicker
                paidWeekDays={existingPayments.paidHomeschoolSummerWeekDays}
                selectedWeekDays={selectedWeekDays}
                onToggleDay={toggleHomeschoolDay}
              />
            )}
            {activeProgram === 'homeschool_dropin' && activeDropInProgram === 'school_year_26_27' && (
              <HomeschoolSchoolYearPicker
                paidMonthDays={existingPayments.paidHomeschoolSchoolYearMonthDays}
                selectedMonthDays={selectedSchoolYearHomeschoolMonthDays}
                tier={schoolYearHomeschoolTier}
                onToggleDay={toggleSchoolYearHomeschoolDay}
                onTierChange={setSchoolYearHomeschoolTier}
              />
            )}
            {activeProgram === 'school_year' && (
              <SchoolYearPicker
                paidSupplyFee={existingPayments.paidSupplyFee}
                paidMonths={existingPayments.paidSchoolYearMonths}
                includeSupplyFee={includeSupplyFee}
                selectedMonths={selectedSchoolYearMonths}
                gradeTier={schoolYearGradeTier}
                useCustomTuitionAmount={useCustomTuitionAmount}
                customTuitionDollars={customTuitionDollars}
                onToggleSupplyFee={() => setIncludeSupplyFee((v) => !v)}
                onToggleMonth={toggleSchoolYearMonth}
                onToggleCustomTuition={() => setUseCustomTuitionAmount((v) => !v)}
                onCustomTuitionChange={setCustomTuitionDollars}
              />
            )}
          </div>

          {/* Amount + notes */}
          <div className={activeProgram === 'school_year' ? 'space-y-4' : 'grid grid-cols-2 gap-4'}>
            {activeProgram !== 'school_year' && (
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: colors.textPrimary }}>
                Amount (optional)
              </label>
              <div
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl"
                style={{ border: `1px solid ${colors.border}`, backgroundColor: colors.elevated }}
              >
                <span className="text-sm" style={{ color: colors.textTertiary }}>$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={amountDollars}
                  onChange={(e) => setAmountDollars(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm"
                  style={{ color: colors.textPrimary }}
                />
              </div>
            </div>
            )}
            <div className={activeProgram === 'school_year' ? '' : ''}>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: colors.textPrimary }}>
                Notes / Check #
              </label>
              <input
                type="text"
                placeholder="e.g. Check #1234"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{
                  border: `1px solid ${colors.border}`,
                  backgroundColor: colors.elevated,
                  color: colors.textPrimary,
                }}
              />
            </div>
          </div>

          {/* Feedback messages */}
          {successMsg && (
            <div
              className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium"
              style={{ backgroundColor: colors.pastelSage, color: colors.mistyForest }}
            >
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              {successMsg}
            </div>
          )}
          {errorMsg && (
            <div
              className="px-4 py-3 rounded-xl text-sm"
              style={{ backgroundColor: colors.warningBg, color: colors.warning, border: `1px solid ${colors.warningBorder}` }}
            >
              {errorMsg}
            </div>
          )}

          {/* Submit */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || !hasAnySelection()}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold transition-all"
            style={{
              backgroundColor: isPending || !hasAnySelection() ? colors.border : colors.mistyForest,
              color: isPending || !hasAnySelection() ? colors.textTertiary : '#fff',
              cursor: isPending || !hasAnySelection() ? 'not-allowed' : 'pointer',
            }}
          >
            {isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Recording payment…</>
            ) : (
              'Record Check Payment'
            )}
          </button>
        </>
      )}
    </div>
  )
}
