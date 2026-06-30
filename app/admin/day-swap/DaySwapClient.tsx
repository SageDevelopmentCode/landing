'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { ArrowLeftRight, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
import { swapHomeschoolDay } from '@/app/actions/swapHomeschoolDay'
import { cssColors as colors, radius } from '../design-system'
import type { DaySwapStudent, DaySwapTransaction, WeekDayEntry } from './page'

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

function formatDay(dateStr: string): string {
  // Parse YYYY-MM-DD safely without timezone shift
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function StudentAvatar({ student }: { student: DaySwapStudent }) {
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

export function DaySwapClient({ students }: { students: DaySwapStudent[] }) {
  const [selected, setSelected] = useState<DaySwapStudent | null>(null)
  const [studentData, setStudentData] = useState<DaySwapStudent[]>(students)

  const [fromTx, setFromTx] = useState<DaySwapTransaction | null>(null)
  const [oldDay, setOldDay] = useState<string | null>(null)
  const [newDay, setNewDay] = useState<string>('')

  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ success: boolean; error?: string } | null>(null)

  const studentsWithDays = studentData.filter((s) => s.allPaidDays.length > 0)
  const studentsWithoutDays = studentData.filter((s) => s.allPaidDays.length === 0)

  function selectStudent(s: DaySwapStudent) {
    setSelected(s)
    setFromTx(null)
    setOldDay(null)
    setNewDay('')
    setResult(null)
  }

  function handleOldDaySelect(tx: DaySwapTransaction, day: string) {
    setFromTx(tx)
    setOldDay(day)
    setNewDay('')
    setResult(null)
  }

  const currentStudent = studentData.find((s) => s.studentId === selected?.studentId) ?? selected

  // Validate new day: must not be already paid (excluding the old day being swapped)
  const newDayAlreadyPaid = newDay
    ? (currentStudent?.allPaidDays ?? []).filter((d) => d !== oldDay).includes(newDay)
    : false

  function handleSubmit() {
    if (!selected || !fromTx || !oldDay || !newDay || newDayAlreadyPaid) return
    setResult(null)
    startTransition(async () => {
      const res = await swapHomeschoolDay({
        studentId: selected.studentId,
        transactionId: fromTx.id,
        oldDay,
        newDay,
      })
      setResult(res)
      if (res.success) {
        function applySwap(tx: DaySwapTransaction): DaySwapTransaction {
          if (tx.id !== fromTx!.id) return tx
          const updatedDays = [...tx.days.filter((d) => d !== oldDay), newDay].sort()
          return { ...tx, days: updatedDays }
        }

        // Update local state to reflect the swap
        setStudentData((prev) =>
          prev.map((s) => {
            if (s.studentId !== selected.studentId) return s
            const updatedTxs = s.transactions.map(applySwap)
            const allPaidDays = [...new Set(updatedTxs.flatMap((tx) => tx.days))].sort()
            return { ...s, transactions: updatedTxs, allPaidDays }
          })
        )
        setSelected((prev) => {
          if (!prev) return prev
          const updatedTxs = prev.transactions.map(applySwap)
          const allPaidDays = [...new Set(updatedTxs.flatMap((tx) => tx.days))].sort()
          return { ...prev, transactions: updatedTxs, allPaidDays }
        })
        setFromTx((prev) => {
          if (!prev) return prev
          return applySwap(prev)
        })
        setOldDay(null)
        setNewDay('')
      }
    })
  }

  const canSubmit = selected && fromTx && oldDay && newDay && !newDayAlreadyPaid && !isPending

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
        {studentsWithDays.length === 0 && studentsWithoutDays.length === 0 && (
          <p className="p-4 text-sm" style={{ color: colors.textTertiary }}>No enrolled homeschool students found.</p>
        )}

        {studentsWithDays.length > 0 && (
          <div>
            <div className="px-4 pt-4 pb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textQuaternary }}>
              Has Paid Days
            </div>
            {studentsWithDays.map((s) => (
              <StudentRow
                key={s.studentId}
                student={s}
                isSelected={selected?.studentId === s.studentId}
                onClick={() => selectStudent(s)}
              />
            ))}
          </div>
        )}

        {studentsWithoutDays.length > 0 && (
          <div>
            <div
              className="px-4 pt-4 pb-1 text-xs font-semibold uppercase tracking-wider"
              style={{ color: colors.textQuaternary, borderTop: studentsWithDays.length > 0 ? `1px solid ${colors.border}` : undefined, marginTop: studentsWithDays.length > 0 ? 8 : 0 }}
            >
              No Paid Days
            </div>
            {studentsWithoutDays.map((s) => (
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
            <p className="text-sm">Select a student to swap days.</p>
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

            {(currentStudent?.allPaidDays ?? []).length === 0 ? (
              <p className="text-sm" style={{ color: colors.textTertiary }}>
                This student has no paid drop-in days to swap.
              </p>
            ) : (
              <>
                {/* Step 1 — pick the day to swap out */}
                <Section label="Step 1 — Select day to swap out">
                  <p className="text-xs mb-3" style={{ color: colors.textTertiary }}>
                    Choose a paid day from one of the transactions below.
                  </p>
                  {selected.transactions.map((tx) => (
                    <div key={tx.id} className="mb-4">
                      <div className="text-xs mb-1.5" style={{ color: colors.textTertiary }}>
                        Transaction from {new Date(tx.createdAt).toLocaleDateString()} · ${(tx.amountCents / 100).toFixed(2)}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {tx.days.map((day) => {
                          const isChosen = fromTx?.id === tx.id && oldDay === day
                          return (
                            <button
                              key={day}
                              onClick={() => handleOldDaySelect(tx, day)}
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
                              {formatDay(day)}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </Section>

                {/* Step 2 — pick the replacement date */}
                {oldDay !== null && (
                  <Section label="Step 2 — Select replacement date">
                    <p className="text-xs mb-3" style={{ color: colors.textTertiary }}>
                      Enter a new date. Already-paid dates will show an error.
                    </p>
                    <input
                      type="date"
                      value={newDay}
                      onChange={(e) => { setNewDay(e.target.value); setResult(null) }}
                      className="text-sm"
                      style={{
                        padding: '8px 12px',
                        borderRadius: radius.md,
                        border: `1px solid ${newDayAlreadyPaid ? '#EF4444' : colors.border}`,
                        backgroundColor: colors.surface,
                        color: colors.textPrimary,
                        outline: 'none',
                        width: '100%',
                        maxWidth: 220,
                      }}
                    />
                    {newDayAlreadyPaid && (
                      <p className="text-xs mt-1.5" style={{ color: '#EF4444' }}>
                        {newDay} is already paid for this student.
                      </p>
                    )}
                  </Section>
                )}

                {/* Summary + submit */}
                {oldDay !== null && newDay && (
                  <div
                    className="mt-6 p-4 rounded-xl flex items-center gap-4"
                    style={{ backgroundColor: colors.elevated, border: `1px solid ${colors.border}` }}
                  >
                    <div className="flex-1 text-sm" style={{ color: colors.textSecondary }}>
                      Swap <strong style={{ color: colors.textPrimary }}>{formatDay(oldDay)}</strong>
                      {' → '}
                      <strong style={{ color: colors.textPrimary }}>{formatDay(newDay)}</strong>
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
                      ? <><CheckCircle2 className="w-4 h-4 flex-shrink-0" /> Day swap saved successfully.</>
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
  student: DaySwapStudent
  isSelected: boolean
  onClick: () => void
}) {
  const hasPaidDays = student.allPaidDays.length > 0
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
        {hasPaidDays ? (
          <div className="flex flex-wrap gap-1 mt-0.5">
            {student.allPaidDays.slice(0, 3).map((d) => (
              <span
                key={d}
                className="text-xs"
                style={{
                  padding: '1px 5px',
                  borderRadius: radius.full,
                  backgroundColor: colors.elevated,
                  color: colors.textTertiary,
                }}
              >
                {formatDay(d)}
              </span>
            ))}
            {student.allPaidDays.length > 3 && (
              <span className="text-xs" style={{ color: colors.textTertiary }}>+{student.allPaidDays.length - 3}</span>
            )}
          </div>
        ) : (
          <div className="text-xs mt-0.5" style={{ color: colors.textQuaternary }}>No paid days</div>
        )}
      </div>
    </button>
  )
}
