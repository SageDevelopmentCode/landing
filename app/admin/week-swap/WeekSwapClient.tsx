'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { ArrowLeftRight, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
import { swapSummerWeek } from '@/app/actions/swapSummerWeek'
import { cssColors as colors, radius } from '../design-system'
import type { WeekSwapStudent, WeekSwapTransaction } from './page'

const SUMMER_WEEKS = [
  { week: 1, dates: 'May 26–28' },
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

const AVATAR_COLORS = [
  { bg: '#4f7c5e', text: '#ffffff' },
  { bg: '#5b6fa8', text: '#ffffff' },
  { bg: '#9b5a8a', text: '#ffffff' },
  { bg: '#c0773a', text: '#ffffff' },
  { bg: '#4a8a8a', text: '#ffffff' },
  { bg: '#7a5c9b', text: '#ffffff' },
]

function getAvatarColor(key: string) {
  let hash = 0
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

function getInitials(name: string | null): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return parts[0][0].toUpperCase()
}

function StudentAvatar({ student }: { student: WeekSwapStudent }) {
  const color = getAvatarColor(student.studentId)
  if (student.profileImageUrl) {
    return (
      <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0">
        <Image src={student.profileImageUrl} alt={student.studentName} width={36} height={36} className="object-cover w-full h-full" />
      </div>
    )
  }
  return (
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0"
      style={{ backgroundColor: color.bg, color: color.text }}
    >
      {getInitials(student.studentName)}
    </div>
  )
}

export function WeekSwapClient({ students }: { students: WeekSwapStudent[] }) {
  const [selected, setSelected] = useState<WeekSwapStudent | null>(null)
  // local copy of student data so we can update weeks after a successful swap
  const [studentData, setStudentData] = useState<WeekSwapStudent[]>(students)

  const [fromTx, setFromTx] = useState<WeekSwapTransaction | null>(null)
  const [oldWeek, setOldWeek] = useState<number | null>(null)
  const [newWeek, setNewWeek] = useState<number | null>(null)

  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ success: boolean; error?: string } | null>(null)

  const studentsWithWeeks = studentData.filter((s) => s.allPaidWeeks.length > 0)
  const studentsWithoutWeeks = studentData.filter((s) => s.allPaidWeeks.length === 0)

  function selectStudent(s: WeekSwapStudent) {
    setSelected(s)
    setFromTx(null)
    setOldWeek(null)
    setNewWeek(null)
    setResult(null)
  }

  function handleOldWeekSelect(tx: WeekSwapTransaction, week: number) {
    setFromTx(tx)
    setOldWeek(week)
    setNewWeek(null)
    setResult(null)
  }

  function handleSubmit() {
    if (!selected || !fromTx || oldWeek === null || newWeek === null) return
    setResult(null)
    startTransition(async () => {
      const res = await swapSummerWeek({
        studentId: selected.studentId,
        transactionId: fromTx.id,
        oldWeek,
        newWeek,
      })
      setResult(res)
      if (res.success) {
        // Update local state to reflect the swap
        setStudentData((prev) =>
          prev.map((s) => {
            if (s.studentId !== selected.studentId) return s
            const updatedTxs = s.transactions.map((tx) => {
              if (tx.id !== fromTx.id) return tx
              const updatedWeeks = tx.weeks.filter((w) => w !== oldWeek)
              updatedWeeks.push(newWeek)
              updatedWeeks.sort((a, b) => a - b)
              return { ...tx, weeks: updatedWeeks }
            })
            const allPaidWeeks = [...new Set(updatedTxs.flatMap((tx) => tx.weeks))].sort((a, b) => a - b)
            return { ...s, transactions: updatedTxs, allPaidWeeks }
          })
        )
        // Sync selected student
        setSelected((prev) => {
          if (!prev) return prev
          const updatedTxs = prev.transactions.map((tx) => {
            if (tx.id !== fromTx.id) return tx
            const updatedWeeks = tx.weeks.filter((w) => w !== oldWeek)
            updatedWeeks.push(newWeek)
            updatedWeeks.sort((a, b) => a - b)
            return { ...tx, weeks: updatedWeeks }
          })
          const allPaidWeeks = [...new Set(updatedTxs.flatMap((tx) => tx.weeks))].sort((a, b) => a - b)
          return { ...prev, transactions: updatedTxs, allPaidWeeks }
        })
        setFromTx((prev) => {
          if (!prev) return prev
          const updatedWeeks = prev.weeks.filter((w) => w !== oldWeek)
          updatedWeeks.push(newWeek)
          updatedWeeks.sort((a, b) => a - b)
          return { ...prev, weeks: updatedWeeks }
        })
        setOldWeek(null)
        setNewWeek(null)
      }
    })
  }

  const canSubmit = selected && fromTx && oldWeek !== null && newWeek !== null && !isPending

  return (
    <div className="flex h-full">
      {/* Left panel — student list */}
      <div
        className="flex-shrink-0 overflow-y-auto"
        style={{
          width: 280,
          borderRight: `1px solid ${colors.border}`,
          backgroundColor: colors.surface,
        }}
      >
        {studentsWithWeeks.length === 0 && studentsWithoutWeeks.length === 0 && (
          <p className="p-4 text-sm" style={{ color: colors.textTertiary }}>No enrolled students found.</p>
        )}

        {studentsWithWeeks.length > 0 && (
          <div>
            <div className="px-4 pt-4 pb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textQuaternary }}>
              Has Paid Weeks
            </div>
            {studentsWithWeeks.map((s) => (
              <StudentRow
                key={s.studentId}
                student={s}
                isSelected={selected?.studentId === s.studentId}
                onClick={() => selectStudent(s)}
              />
            ))}
          </div>
        )}

        {studentsWithoutWeeks.length > 0 && (
          <div>
            <div
              className="px-4 pt-4 pb-1 text-xs font-semibold uppercase tracking-wider"
              style={{ color: colors.textQuaternary, borderTop: studentsWithWeeks.length > 0 ? `1px solid ${colors.border}` : undefined, marginTop: studentsWithWeeks.length > 0 ? 8 : 0 }}
            >
              No Paid Weeks
            </div>
            {studentsWithoutWeeks.map((s) => (
              <StudentRow
                key={s.studentId}
                student={s}
                isSelected={selected?.studentId === s.studentId}
                onClick={() => selectStudent(s)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Right panel — swap editor */}
      <div className="flex-1 overflow-y-auto p-6" style={{ backgroundColor: colors.bg }}>
        {!selected ? (
          <div className="flex flex-col items-center justify-center h-full" style={{ color: colors.textTertiary }}>
            <ArrowLeftRight className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm">Select a student to swap weeks.</p>
          </div>
        ) : (
          <div style={{ maxWidth: 560 }}>
            {/* Student header */}
            <div className="flex items-center gap-3 mb-6">
              <StudentAvatar student={selected} />
              <div>
                <div className="font-semibold text-base" style={{ color: colors.textPrimary }}>{selected.studentName}</div>
                <div className="text-xs" style={{ color: colors.textTertiary }}>{selected.parentName ?? selected.parentEmail ?? 'Unknown parent'}</div>
              </div>
            </div>

            {selected.allPaidWeeks.length === 0 ? (
              <p className="text-sm" style={{ color: colors.textTertiary }}>
                This student has no paid weekly weeks to swap.
              </p>
            ) : (
              <>
                {/* Step 1 — pick the week to swap out */}
                <Section label="Step 1 — Select week to swap out">
                  <p className="text-xs mb-3" style={{ color: colors.textTertiary }}>
                    Choose a paid week from one of the transactions below.
                  </p>
                  {selected.transactions.map((tx) => (
                    <div key={tx.id} className="mb-4">
                      <div className="text-xs mb-1.5" style={{ color: colors.textTertiary }}>
                        Transaction from {new Date(tx.createdAt).toLocaleDateString()} · ${(tx.amountCents / 100).toFixed(2)}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {tx.weeks.map((w) => {
                          const wk = SUMMER_WEEKS.find((x) => x.week === w)
                          const isChosen = fromTx?.id === tx.id && oldWeek === w
                          return (
                            <button
                              key={w}
                              onClick={() => handleOldWeekSelect(tx, w)}
                              className="text-xs font-medium transition-all"
                              style={{
                                padding: '4px 10px',
                                borderRadius: radius.full,
                                border: `1px solid ${isChosen ? colors.accent : colors.border}`,
                                backgroundColor: isChosen ? colors.accentLight : colors.elevated,
                                color: isChosen ? colors.accent : colors.textSecondary,
                                cursor: 'pointer',
                              }}
                            >
                              Week {w}{wk ? ` · ${wk.dates}` : ''}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </Section>

                {/* Step 2 — pick the replacement week */}
                {oldWeek !== null && (
                  <Section label="Step 2 — Select replacement week">
                    <p className="text-xs mb-3" style={{ color: colors.textTertiary }}>
                      Paid weeks are disabled. Select any unpaid week.
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {SUMMER_WEEKS.map(({ week, dates }) => {
                        const isPaid = selected.allPaidWeeks.includes(week) && week !== oldWeek
                        const isChosen = newWeek === week
                        return (
                          <button
                            key={week}
                            disabled={isPaid}
                            onClick={() => { setNewWeek(week); setResult(null) }}
                            className="text-left transition-all"
                            style={{
                              padding: '8px 10px',
                              borderRadius: radius.md,
                              border: `1px solid ${isChosen ? colors.accent : colors.border}`,
                              backgroundColor: isPaid
                                ? colors.elevated
                                : isChosen
                                ? colors.accentLight
                                : colors.surface,
                              color: isPaid ? colors.textQuaternary : isChosen ? colors.accent : colors.textSecondary,
                              cursor: isPaid ? 'not-allowed' : 'pointer',
                              opacity: isPaid ? 0.5 : 1,
                            }}
                          >
                            <div className="text-xs font-semibold">Week {week}</div>
                            <div className="text-xs" style={{ color: isPaid ? colors.textQuaternary : colors.textTertiary }}>{dates}</div>
                            {isPaid && <div className="text-xs mt-0.5" style={{ color: colors.textQuaternary }}>Paid</div>}
                          </button>
                        )
                      })}
                    </div>
                  </Section>
                )}

                {/* Summary + submit */}
                {oldWeek !== null && newWeek !== null && (
                  <div
                    className="mt-6 p-4 rounded-xl flex items-center gap-4"
                    style={{ backgroundColor: colors.elevated, border: `1px solid ${colors.border}` }}
                  >
                    <div className="flex-1 text-sm" style={{ color: colors.textSecondary }}>
                      Swap <strong style={{ color: colors.textPrimary }}>Week {oldWeek}</strong>
                      {' → '}
                      <strong style={{ color: colors.textPrimary }}>Week {newWeek}</strong>
                      {' '}for <strong style={{ color: colors.textPrimary }}>{selected.studentName}</strong>
                    </div>
                    <button
                      onClick={handleSubmit}
                      disabled={!canSubmit}
                      className="flex items-center gap-2 text-sm font-semibold transition-opacity"
                      style={{
                        padding: '8px 16px',
                        borderRadius: radius.md,
                        backgroundColor: colors.accent,
                        color: '#fff',
                        border: 'none',
                        cursor: canSubmit ? 'pointer' : 'not-allowed',
                        opacity: canSubmit ? 1 : 0.6,
                        flexShrink: 0,
                      }}
                    >
                      {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowLeftRight className="w-4 h-4" />}
                      Confirm Swap
                    </button>
                  </div>
                )}

                {/* Result feedback */}
                {result && (
                  <div
                    className="mt-3 flex items-center gap-2 text-sm p-3 rounded-lg"
                    style={{
                      backgroundColor: result.success ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                      color: result.success ? '#22C55E' : '#EF4444',
                      border: `1px solid ${result.success ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                    }}
                  >
                    {result.success
                      ? <><CheckCircle2 className="w-4 h-4 flex-shrink-0" /> Week swap saved successfully.</>
                      : <><AlertCircle className="w-4 h-4 flex-shrink-0" /> {result.error}</>
                    }
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <div className="text-sm font-semibold mb-3" style={{ color: colors.textPrimary }}>{label}</div>
      {children}
    </div>
  )
}

function StudentRow({
  student,
  isSelected,
  onClick,
}: {
  student: WeekSwapStudent
  isSelected: boolean
  onClick: () => void
}) {
  const hasPaidWeeks = student.allPaidWeeks.length > 0
  return (
    <button
      onClick={onClick}
      className="w-full text-left flex items-center gap-3 px-4 py-3 transition-colors"
      style={{
        backgroundColor: isSelected ? colors.accentLight : 'transparent',
        borderLeft: `2px solid ${isSelected ? colors.accent : 'transparent'}`,
      }}
    >
      <StudentAvatar student={student} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate" style={{ color: isSelected ? colors.accent : colors.textPrimary }}>
          {student.studentName}
        </div>
        {hasPaidWeeks ? (
          <div className="flex flex-wrap gap-1 mt-0.5">
            {student.allPaidWeeks.slice(0, 5).map((w) => (
              <span
                key={w}
                className="text-xs"
                style={{
                  padding: '1px 5px',
                  borderRadius: radius.full,
                  backgroundColor: colors.elevated,
                  color: colors.textTertiary,
                }}
              >
                Wk {w}
              </span>
            ))}
            {student.allPaidWeeks.length > 5 && (
              <span className="text-xs" style={{ color: colors.textTertiary }}>+{student.allPaidWeeks.length - 5}</span>
            )}
          </div>
        ) : (
          <div className="text-xs mt-0.5" style={{ color: colors.textQuaternary }}>No paid weeks</div>
        )}
      </div>
    </button>
  )
}
