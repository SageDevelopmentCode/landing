'use client'

import React, { useState, useTransition, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, ChevronRight, Pencil, Check, X, Plus } from 'lucide-react'
import { Table, TableRow, TableCell } from '../components/Table'
import { cssColors as colors } from '../design-system'
import { getClockSessionsForDate, getClockSessionsForRange, updateClockSession, createClockSessionForTeacher } from '@/app/actions/timeclock'
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

function fmtMins(totalMins: number) {
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
  return fmtMins(totalMins)
}

function toLocalDateKey(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function fmtDayLabel(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  })
}

function fmtSessionNoteLine(clockIn: string, clockOut: string | null, note: string): string {
  const end = clockOut ? fmtTime(clockOut) : 'Active'
  return `${fmtTime(clockIn)}–${end}: ${note}`
}

function isoToTimeInput(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function buildISO(originalIso: string, timeInput: string): string {
  const d = new Date(originalIso)
  const [h, m] = timeInput.split(':').map(Number)
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}

function getTodayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getMondayOfCurrentWeek() {
  const today = new Date()
  const day = today.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(today)
  monday.setDate(today.getDate() + diff)
  return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`
}

function getLastWeekRange() {
  const today = new Date()
  const day = today.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day
  const thisMonday = new Date(today)
  thisMonday.setDate(today.getDate() + diffToMonday)
  const lastMonday = new Date(thisMonday)
  lastMonday.setDate(thisMonday.getDate() - 7)
  const lastSunday = new Date(lastMonday)
  lastSunday.setDate(lastMonday.getDate() + 6)
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return { start: fmt(lastMonday), end: fmt(lastSunday) }
}

interface Props {
  initialSessions: ClockSessionWithTeacher[]
  initialDate: string
  teachers: Array<{ id: string; full_name: string | null }>
}

export function ClockSessionsTab({ initialSessions, initialDate, teachers }: Props) {
  const [mode, setMode] = useState<'day' | 'summary'>('day')

  // Day mode
  const [sessions, setSessions] = useState(initialSessions)
  const [selectedDate, setSelectedDate] = useState(initialDate)
  const [isDayPending, startDayTransition] = useTransition()

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editClockIn, setEditClockIn] = useState('')
  const [editClockOut, setEditClockOut] = useState('')
  const [editPending, startEditTransition] = useTransition()
  const [editError, setEditError] = useState<string | null>(null)

  // Add session state
  const [showAddModal, setShowAddModal] = useState(false)
  const [addTeacherId, setAddTeacherId] = useState('')
  const [addDate, setAddDate] = useState(initialDate)
  const [addClockIn, setAddClockIn] = useState('09:00')
  const [addClockOut, setAddClockOut] = useState('17:00')
  const [addNote, setAddNote] = useState('')
  const [addError, setAddError] = useState<string | null>(null)
  const [addPending, startAddTransition] = useTransition()

  // Summary mode
  const [rangeStart, setRangeStart] = useState(getMondayOfCurrentWeek)
  const [rangeEnd, setRangeEnd] = useState(getTodayStr)
  const [rangeSessions, setRangeSessions] = useState<ClockSessionWithTeacher[]>([])
  const [isRangePending, startRangeTransition] = useTransition()
  const [rangeLoaded, setRangeLoaded] = useState(false)
  const [expandedEmployees, setExpandedEmployees] = useState<Set<string>>(new Set())

  function handleDateChange(date: string) {
    setSelectedDate(date)
    startDayTransition(async () => {
      const result = await getClockSessionsForDate(date)
      setSessions(result)
    })
  }

  function fetchRange(start: string, end: string) {
    startRangeTransition(async () => {
      const result = await getClockSessionsForRange(start, end)
      setRangeSessions(result)
      setExpandedEmployees(new Set())
      setRangeLoaded(true)
    })
  }

  useEffect(() => {
    if (mode === 'summary' && !rangeLoaded) {
      fetchRange(rangeStart, rangeEnd)
    }
  }, [mode])

  function handleRangeStartChange(date: string) {
    setRangeStart(date)
    fetchRange(date, rangeEnd)
  }

  function handleRangeEndChange(date: string) {
    setRangeEnd(date)
    fetchRange(rangeStart, date)
  }

  function applyThisWeek() {
    const start = getMondayOfCurrentWeek()
    const end = getTodayStr()
    setRangeStart(start)
    setRangeEnd(end)
    fetchRange(start, end)
  }

  function applyLastWeek() {
    const { start, end } = getLastWeekRange()
    setRangeStart(start)
    setRangeEnd(end)
    fetchRange(start, end)
  }

  function toggleExpand(teacherId: string) {
    setExpandedEmployees((prev) => {
      const next = new Set(prev)
      next.has(teacherId) ? next.delete(teacherId) : next.add(teacherId)
      return next
    })
  }

  // Per-employee aggregation for summary mode — includes byDay breakdown
  const employeeSummary = useMemo(() => {
    const map = new Map<string, {
      teacher_id: string
      full_name: string | null
      profile_image_url: string | null
      totalMins: number
      sessionCount: number
      activeCount: number
      noteCount: number
      byDay: Map<string, {
        mins: number
        sessionCount: number
        activeCount: number
        notedSessions: Array<{
          clock_in_at: string
          clock_out_at: string | null
          note: string
        }>
      }>
    }>()

    for (const s of rangeSessions) {
      if (!map.has(s.teacher_id)) {
        map.set(s.teacher_id, {
          teacher_id: s.teacher_id,
          full_name: s.full_name,
          profile_image_url: s.profile_image_url,
          totalMins: 0,
          sessionCount: 0,
          activeCount: 0,
          noteCount: 0,
          byDay: new Map(),
        })
      }
      const entry = map.get(s.teacher_id)!
      entry.sessionCount += 1

      const dateKey = toLocalDateKey(s.clock_in_at)
      if (!entry.byDay.has(dateKey)) {
        entry.byDay.set(dateKey, { mins: 0, sessionCount: 0, activeCount: 0, notedSessions: [] })
      }
      const dayEntry = entry.byDay.get(dateKey)!
      dayEntry.sessionCount += 1

      const trimmedNote = s.note?.trim()
      if (trimmedNote) {
        entry.noteCount += 1
        dayEntry.notedSessions.push({
          clock_in_at: s.clock_in_at,
          clock_out_at: s.clock_out_at,
          note: trimmedNote,
        })
      }

      if (s.clock_out_at) {
        const mins = Math.round(
          (new Date(s.clock_out_at).getTime() - new Date(s.clock_in_at).getTime()) / 60000
        )
        entry.totalMins += mins
        dayEntry.mins += mins
      } else {
        entry.activeCount += 1
        dayEntry.activeCount += 1
      }
    }

    return [...map.values()].sort((a, b) => b.totalMins - a.totalMins)
  }, [rangeSessions])

  const rangeTotalMins = employeeSummary.reduce((s, e) => s + e.totalMins, 0)
  const rangeTotalSessions = rangeSessions.length
  const rangeUniqueTeachers = employeeSummary.length
  const isMultiDay = rangeStart !== rangeEnd

  const uniqueTeachers = new Set(sessions.map((s) => s.teacher_id)).size
  const totalStr = fmtTotalTime(sessions)

  function startEdit(s: ClockSessionWithTeacher) {
    setEditingId(s.id)
    setEditClockIn(isoToTimeInput(s.clock_in_at))
    setEditClockOut(s.clock_out_at ? isoToTimeInput(s.clock_out_at) : '')
    setEditError(null)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditError(null)
  }

  function saveEdit(s: ClockSessionWithTeacher) {
    const newClockIn = buildISO(s.clock_in_at, editClockIn)
    const newClockOut = editClockOut ? buildISO(s.clock_in_at, editClockOut) : null
    startEditTransition(async () => {
      const result = await updateClockSession(s.id, newClockIn, newClockOut)
      if (result.error) {
        setEditError(result.error)
        return
      }
      setEditingId(null)
      setEditError(null)
      const refreshed = await getClockSessionsForDate(selectedDate)
      setSessions(refreshed)
    })
  }

  function openAddModal() {
    setAddDate(selectedDate)
    setAddTeacherId(teachers[0]?.id ?? '')
    setAddClockIn('09:00')
    setAddClockOut('17:00')
    setAddNote('')
    setAddError(null)
    setShowAddModal(true)
  }

  function submitAddSession() {
    if (!addTeacherId) { setAddError('Select an employee'); return }
    const clockInISO = new Date(`${addDate}T${addClockIn}:00`).toISOString()
    const clockOutISO = addClockOut ? new Date(`${addDate}T${addClockOut}:00`).toISOString() : null
    startAddTransition(async () => {
      const result = await createClockSessionForTeacher(addTeacherId, clockInISO, clockOutISO, addNote || null)
      if (result.error) { setAddError(result.error); return }
      setShowAddModal(false)
      const refreshed = await getClockSessionsForDate(selectedDate)
      setSessions(refreshed)
    })
  }

  const inputStyle = {
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    color: colors.textPrimary,
    colorScheme: 'dark' as const,
  }

  const modeBtn = (active: boolean) => ({
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: active ? 600 : 400,
    cursor: 'pointer',
    border: 'none',
    background: active ? colors.accentLight : 'transparent',
    color: active ? colors.accent : colors.textSecondary,
    transition: 'all 0.15s',
  })

  const quickBtn = (active: boolean) => ({
    padding: '3px 10px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 500,
    cursor: 'pointer',
    border: `1px solid ${active ? colors.accent : colors.border}`,
    background: active ? colors.accentLight : 'transparent',
    color: active ? colors.accent : colors.textSecondary,
    transition: 'all 0.15s',
  })

  const thisWeekStart = getMondayOfCurrentWeek()
  const todayStr = getTodayStr()
  const lastWeek = getLastWeekRange()
  const isThisWeek = rangeStart === thisWeekStart && rangeEnd === todayStr
  const isLastWeek = rangeStart === lastWeek.start && rangeEnd === lastWeek.end

  const cellBase: React.CSSProperties = {
    padding: '6px 12px',
    fontSize: '11px',
    borderBottom: `1px solid ${colors.border}`,
    whiteSpace: 'nowrap' as const,
  }

  return (
    <div className="space-y-4">
      {/* Header row with mode toggle */}
      <div className="flex items-center justify-between gap-4">
        {mode === 'day' ? (
          <p className="text-xs" style={{ color: colors.textSecondary }}>
            {sessions.length} session{sessions.length !== 1 ? 's' : ''} &middot; {uniqueTeachers} teacher{uniqueTeachers !== 1 ? 's' : ''} &middot; {totalStr} total
          </p>
        ) : (
          <p className="text-xs" style={{ color: colors.textSecondary }}>
            {rangeTotalSessions} session{rangeTotalSessions !== 1 ? 's' : ''} &middot; {rangeUniqueTeachers} teacher{rangeUniqueTeachers !== 1 ? 's' : ''} &middot; {fmtMins(rangeTotalMins)} total
          </p>
        )}
        <div className="flex items-center gap-3">
          {mode === 'day' && (
            <>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="px-2.5 py-1 rounded-lg text-xs focus:outline-none focus:ring-1"
                style={inputStyle}
              />
              <button
                onClick={openAddModal}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors"
                style={{ background: colors.accentLight, color: colors.accent, border: `1px solid ${colors.accent}22` }}
              >
                <Plus className="w-3 h-3" />
                Add Session
              </button>
            </>
          )}
          <div className="flex gap-0.5 p-0.5 rounded-lg" style={{ background: colors.elevated, border: `1px solid ${colors.border}` }}>
            <button style={modeBtn(mode === 'day')} onClick={() => setMode('day')}>Day</button>
            <button style={modeBtn(mode === 'summary')} onClick={() => setMode('summary')}>Summary</button>
          </div>
        </div>
      </div>

      {/* Day mode */}
      {mode === 'day' && (
        sessions.length === 0 ? (
          <p className="text-sm text-center py-12" style={{ color: colors.textTertiary }}>
            {isDayPending ? 'Loading…' : 'No sessions found for this date.'}
          </p>
        ) : (
          <div style={{ opacity: isDayPending ? 0.5 : 1, transition: 'opacity 0.15s' }}>
            {editError && (
              <p className="text-xs mb-2 px-1" style={{ color: colors.error }}>{editError}</p>
            )}
            <Table headers={['Teacher', 'Clock In', 'Clock Out', 'Duration', 'Note', '']}>
              {sessions.map((s, i) => {
                const isEditing = editingId === s.id
                return (
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
                    <TableCell>
                      {isEditing ? (
                        <input
                          type="time"
                          value={editClockIn}
                          onChange={(e) => setEditClockIn(e.target.value)}
                          className="px-2 py-0.5 rounded text-xs focus:outline-none focus:ring-1"
                          style={inputStyle}
                        />
                      ) : (
                        fmtTime(s.clock_in_at)
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <input
                          type="time"
                          value={editClockOut}
                          onChange={(e) => setEditClockOut(e.target.value)}
                          className="px-2 py-0.5 rounded text-xs focus:outline-none focus:ring-1"
                          style={inputStyle}
                        />
                      ) : s.clock_out_at ? (
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
                    <TableCell>
                      {isEditing ? '—' : fmtDuration(s.clock_in_at, s.clock_out_at)}
                    </TableCell>
                    <TableCell style={{ color: s.note ? colors.textPrimary : colors.textTertiary }}>
                      {s.note || '—'}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => saveEdit(s)}
                            disabled={editPending}
                            className="flex items-center justify-center rounded p-1 transition-colors"
                            style={{ color: colors.success, background: colors.successBg, border: `1px solid ${colors.successBorder}` }}
                            title="Save"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button
                            onClick={cancelEdit}
                            disabled={editPending}
                            className="flex items-center justify-center rounded p-1 transition-colors"
                            style={{ color: colors.textSecondary, background: colors.elevated, border: `1px solid ${colors.border}` }}
                            title="Cancel"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(s)}
                          disabled={editingId !== null}
                          className="flex items-center justify-center rounded p-1 transition-colors"
                          style={{ color: colors.textTertiary, background: 'transparent', border: `1px solid transparent` }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = colors.textSecondary
                            e.currentTarget.style.borderColor = colors.border
                            e.currentTarget.style.background = colors.elevated
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = colors.textTertiary
                            e.currentTarget.style.borderColor = 'transparent'
                            e.currentTarget.style.background = 'transparent'
                          }}
                          title="Edit times"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </Table>
          </div>
        )
      )}

      {/* Add session modal */}
      {showAddModal && createPortal(
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 60, backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 16, padding: 24, width: 360, boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold" style={{ color: colors.textPrimary }}>Add Time Session</span>
              <button onClick={() => setShowAddModal(false)} style={{ color: colors.textTertiary, background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs mb-1" style={{ color: colors.textSecondary }}>Employee</label>
                <select
                  value={addTeacherId}
                  onChange={(e) => setAddTeacherId(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg text-xs focus:outline-none focus:ring-1"
                  style={{ ...inputStyle, width: '100%' }}
                >
                  <option value="">Select employee…</option>
                  {[...teachers].sort((a, b) => (a.full_name ?? '').localeCompare(b.full_name ?? '')).map((t) => (
                    <option key={t.id} value={t.id}>{t.full_name ?? t.id}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs mb-1" style={{ color: colors.textSecondary }}>Date</label>
                <input
                  type="date"
                  value={addDate}
                  onChange={(e) => setAddDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg text-xs focus:outline-none focus:ring-1"
                  style={{ ...inputStyle, width: '100%' }}
                />
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs mb-1" style={{ color: colors.textSecondary }}>Clock In</label>
                  <input
                    type="time"
                    value={addClockIn}
                    onChange={(e) => setAddClockIn(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg text-xs focus:outline-none focus:ring-1"
                    style={{ ...inputStyle, width: '100%' }}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs mb-1" style={{ color: colors.textSecondary }}>Clock Out <span style={{ color: colors.textTertiary }}>(optional)</span></label>
                  <input
                    type="time"
                    value={addClockOut}
                    onChange={(e) => setAddClockOut(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg text-xs focus:outline-none focus:ring-1"
                    style={{ ...inputStyle, width: '100%' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs mb-1" style={{ color: colors.textSecondary }}>Note <span style={{ color: colors.textTertiary }}>(optional)</span></label>
                <input
                  type="text"
                  value={addNote}
                  onChange={(e) => setAddNote(e.target.value)}
                  placeholder="e.g. makeup shift"
                  className="w-full px-2.5 py-1.5 rounded-lg text-xs focus:outline-none focus:ring-1"
                  style={{ ...inputStyle, width: '100%' }}
                />
              </div>
            </div>

            {addError && (
              <p className="text-xs mt-3" style={{ color: colors.error }}>{addError}</p>
            )}

            <div className="flex gap-2 mt-4 justify-end">
              <button
                onClick={() => setShowAddModal(false)}
                disabled={addPending}
                className="px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{ background: colors.elevated, color: colors.textSecondary, border: `1px solid ${colors.border}` }}
              >
                Cancel
              </button>
              <button
                onClick={submitAddSession}
                disabled={addPending}
                className="px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{ background: colors.accentLight, color: colors.accent, border: `1px solid ${colors.accent}33` }}
              >
                {addPending ? 'Saving…' : 'Save Session'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Summary mode */}
      {mode === 'summary' && (
        <div className="space-y-3">
          {/* Date range controls */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex gap-1.5">
              <button style={quickBtn(isThisWeek)} onClick={applyThisWeek}>This Week</button>
              <button style={quickBtn(isLastWeek)} onClick={applyLastWeek}>Last Week</button>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={rangeStart}
                onChange={(e) => handleRangeStartChange(e.target.value)}
                className="px-2.5 py-1 rounded-lg text-xs focus:outline-none focus:ring-1"
                style={inputStyle}
              />
              <span className="text-xs" style={{ color: colors.textTertiary }}>to</span>
              <input
                type="date"
                value={rangeEnd}
                min={rangeStart}
                onChange={(e) => handleRangeEndChange(e.target.value)}
                className="px-2.5 py-1 rounded-lg text-xs focus:outline-none focus:ring-1"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Summary table */}
          {isRangePending ? (
            <p className="text-sm text-center py-12" style={{ color: colors.textTertiary }}>Loading…</p>
          ) : employeeSummary.length === 0 ? (
            <p className="text-sm text-center py-12" style={{ color: colors.textTertiary }}>
              No sessions found for this date range.
            </p>
          ) : (
            <div style={{ opacity: isRangePending ? 0.5 : 1, transition: 'opacity 0.15s' }}>
              <Table headers={['Employee', 'Total Hours', 'Sessions', 'Notes']}>
                {employeeSummary.map((e, i) => {
                  const isExpanded = expandedEmployees.has(e.teacher_id)
                  const sortedDays = [...e.byDay.entries()].sort(([a], [b]) => a.localeCompare(b))
                  return (
                    <React.Fragment key={e.teacher_id}>
                      <TableRow
                        key={e.teacher_id}
                        index={i}
                        onClick={isMultiDay ? () => toggleExpand(e.teacher_id) : undefined}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {isMultiDay && (
                              <span style={{ color: colors.textTertiary, flexShrink: 0 }}>
                                {isExpanded
                                  ? <ChevronDown className="w-3.5 h-3.5" />
                                  : <ChevronRight className="w-3.5 h-3.5" />
                                }
                              </span>
                            )}
                            {e.profile_image_url ? (
                              <img
                                src={e.profile_image_url}
                                alt={e.full_name ?? ''}
                                className="rounded-full object-cover shrink-0"
                                style={{ width: 28, height: 28 }}
                              />
                            ) : (
                              <div
                                className="rounded-full flex items-center justify-center shrink-0 text-[10px] font-semibold"
                                style={{ width: 28, height: 28, background: colors.accentLight, color: colors.accent }}
                              >
                                {(e.full_name ?? '?').charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span style={{ color: colors.textPrimary, fontWeight: 500 }}>
                              {e.full_name ?? '—'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span style={{ color: colors.textPrimary, fontWeight: 500 }}>
                            {fmtMins(e.totalMins)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span style={{ color: colors.textSecondary }}>
                            {e.sessionCount}
                            {e.activeCount > 0 && (
                              <span
                                className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold border"
                                style={{ color: colors.success, backgroundColor: colors.successBg, borderColor: colors.successBorder }}
                              >
                                {e.activeCount} active
                              </span>
                            )}
                          </span>
                        </TableCell>
                        <TableCell>
                          {e.noteCount > 0 ? (
                            <span
                              className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold border"
                              style={{ color: colors.accent, backgroundColor: colors.accentLight, borderColor: `${colors.accent}33` }}
                            >
                              {e.noteCount} note{e.noteCount !== 1 ? 's' : ''}
                            </span>
                          ) : (
                            <span style={{ color: colors.textTertiary }}>—</span>
                          )}
                        </TableCell>
                      </TableRow>

                      {/* Day breakdown sub-rows */}
                      {isExpanded && sortedDays.map(([date, day]) => (
                        <tr key={`${e.teacher_id}-${date}`} style={{ background: colors.elevated }}>
                          <td style={{ ...cellBase, paddingLeft: 52, color: colors.textSecondary }}>
                            {fmtDayLabel(date)}
                          </td>
                          <td style={{ ...cellBase, color: day.mins > 0 ? colors.textPrimary : colors.textTertiary, fontWeight: day.mins > 0 ? 500 : 400 }}>
                            {day.mins > 0 ? fmtMins(day.mins) : '—'}
                          </td>
                          <td style={{ ...cellBase, color: colors.textTertiary }}>
                            {day.sessionCount}
                            {day.activeCount > 0 && (
                              <span
                                className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold border"
                                style={{ color: colors.success, backgroundColor: colors.successBg, borderColor: colors.successBorder }}
                              >
                                {day.activeCount} active
                              </span>
                            )}
                          </td>
                          <td style={{ ...cellBase, whiteSpace: 'normal', color: day.notedSessions.length > 0 ? colors.textPrimary : colors.textTertiary }}>
                            {day.notedSessions.length > 0 ? (
                              <div className="space-y-1">
                                {day.notedSessions.map((session, idx) => (
                                  <div key={idx}>
                                    {fmtSessionNoteLine(session.clock_in_at, session.clock_out_at, session.note)}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              '—'
                            )}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  )
                })}

                {/* Totals footer row */}
                <TableRow key="__total__" index={employeeSummary.length}>
                  <TableCell>
                    <span className="text-xs font-semibold" style={{ color: colors.textTertiary }}>Total</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-semibold" style={{ color: colors.textPrimary }}>
                      {fmtMins(rangeTotalMins)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-semibold" style={{ color: colors.textPrimary }}>
                      {rangeTotalSessions}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-semibold" style={{ color: colors.textTertiary }}>—</span>
                  </TableCell>
                </TableRow>
              </Table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
