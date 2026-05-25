'use client'

import { useState, useTransition } from 'react'
import { Table, TableRow, TableCell } from '../components/Table'
import { cssColors as colors } from '../design-system'
import { getClockSessionsForDate } from '@/app/actions/timeclock'
import type { ClockSessionWithTeacher } from '@/app/actions/timeclock'

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function fmtDuration(clockIn: string, clockOut: string | null) {
  if (!clockOut) return 'In progress'
  const ms = new Date(clockOut).getTime() - new Date(clockIn).getTime()
  const totalMins = Math.round(ms / 60000)
  const hrs = Math.floor(totalMins / 60)
  const mins = totalMins % 60
  if (hrs === 0) return `${mins}m`
  if (mins === 0) return `${hrs}h`
  return `${hrs}h ${mins}m`
}

function fmtTotalTime(sessions: ClockSessionWithTeacher[]) {
  const totalMins = sessions.reduce((sum, s) => {
    if (!s.clock_out_at) return sum
    return sum + Math.round((new Date(s.clock_out_at).getTime() - new Date(s.clock_in_at).getTime()) / 60000)
  }, 0)
  const hrs = Math.floor(totalMins / 60)
  const mins = totalMins % 60
  if (hrs === 0) return `${mins}m`
  if (mins === 0) return `${hrs}h`
  return `${hrs}h ${mins}m`
}

interface Props {
  initialSessions: ClockSessionWithTeacher[]
  initialDate: string
}

export function ClockSessionsTab({ initialSessions, initialDate }: Props) {
  const [sessions, setSessions] = useState(initialSessions)
  const [selectedDate, setSelectedDate] = useState(initialDate)
  const [isPending, startTransition] = useTransition()

  function handleDateChange(date: string) {
    setSelectedDate(date)
    startTransition(async () => {
      const result = await getClockSessionsForDate(date)
      setSessions(result)
    })
  }

  const uniqueTeachers = new Set(sessions.map((s) => s.teacher_id)).size
  const totalStr = fmtTotalTime(sessions)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs" style={{ color: colors.textSecondary }}>
          {sessions.length} session{sessions.length !== 1 ? 's' : ''} &middot; {uniqueTeachers} teacher{uniqueTeachers !== 1 ? 's' : ''} &middot; {totalStr} total
        </p>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => handleDateChange(e.target.value)}
          className="px-2.5 py-1 rounded-lg text-xs focus:outline-none focus:ring-1"
          style={{
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            color: colors.textPrimary,
            colorScheme: 'dark',
          }}
        />
      </div>

      {sessions.length === 0 ? (
        <p className="text-sm text-center py-12" style={{ color: colors.textTertiary }}>
          {isPending ? 'Loading…' : 'No sessions found for this date.'}
        </p>
      ) : (
        <div style={{ opacity: isPending ? 0.5 : 1, transition: 'opacity 0.15s' }}>
          <Table headers={['Teacher', 'Clock In', 'Clock Out', 'Duration', 'Note']}>
            {sessions.map((s, i) => (
              <TableRow key={s.id} index={i}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {s.profile_image_url ? (
                      <img
                        src={s.profile_image_url}
                        alt={s.full_name ?? ''}
                        className="rounded-full object-cover shrink-0"
                        style={{ width: 28, height: 28 }}
                      />
                    ) : (
                      <div
                        className="rounded-full flex items-center justify-center shrink-0 text-[10px] font-semibold"
                        style={{ width: 28, height: 28, background: colors.accentLight, color: colors.accent }}
                      >
                        {(s.full_name ?? '?').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span style={{ color: colors.textPrimary, fontWeight: 500 }}>
                      {s.full_name ?? '—'}
                    </span>
                  </div>
                </TableCell>
                <TableCell>{fmtTime(s.clock_in_at)}</TableCell>
                <TableCell>
                  {s.clock_out_at ? (
                    fmtTime(s.clock_out_at)
                  ) : (
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border"
                      style={{ color: colors.success, backgroundColor: colors.successBg, borderColor: colors.successBorder }}
                    >
                      Active
                    </span>
                  )}
                </TableCell>
                <TableCell>{fmtDuration(s.clock_in_at, s.clock_out_at)}</TableCell>
                <TableCell style={{ color: s.note ? colors.textPrimary : colors.textTertiary }}>
                  {s.note || '—'}
                </TableCell>
              </TableRow>
            ))}
          </Table>
        </div>
      )}
    </div>
  )
}
