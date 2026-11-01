import type { ClockSessionWithTeacher } from '@/app/actions/timeclock'

export function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export function fmtDuration(clockIn: string, clockOut: string | null) {
  if (!clockOut) return 'In progress'
  const ms = new Date(clockOut).getTime() - new Date(clockIn).getTime()
  const totalMins = Math.round(ms / 60000)
  return fmtMins(totalMins)
}

export function fmtMins(totalMins: number) {
  const hrs = Math.floor(totalMins / 60)
  const mins = totalMins % 60
  if (hrs === 0) return `${mins}m`
  if (mins === 0) return `${hrs}h`
  return `${hrs}h ${mins}m`
}

export function fmtTotalTime(sessions: ClockSessionWithTeacher[]) {
  const totalMins = sessions.reduce((sum, s) => {
    if (!s.clock_out_at) return sum
    return sum + Math.round((new Date(s.clock_out_at).getTime() - new Date(s.clock_in_at).getTime()) / 60000)
  }, 0)
  return fmtMins(totalMins)
}

export function toLocalDateKey(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function fmtDayLabel(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export function fmtDateRangeLabel(start: string, end: string): string {
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }
  const startLabel = new Date(start + 'T00:00:00').toLocaleDateString('en-US', opts)
  if (start === end) return startLabel
  const endLabel = new Date(end + 'T00:00:00').toLocaleDateString('en-US', opts)
  return `${startLabel} – ${endLabel}`
}

export type DaySessionSummary = {
  clock_in_at: string
  clock_out_at: string | null
  note: string | null
}

export type DayClockSummary = {
  mins: number
  sessionCount: number
  activeCount: number
  sessions: DaySessionSummary[]
}

export type EmployeeClockSummary = {
  teacher_id: string
  full_name: string | null
  profile_image_url: string | null
  totalMins: number
  sessionCount: number
  activeCount: number
  noteCount: number
  byDay: Map<string, DayClockSummary>
}

export function buildEmployeeClockSummary(sessions: ClockSessionWithTeacher[]): EmployeeClockSummary[] {
  const map = new Map<string, EmployeeClockSummary>()

  for (const s of sessions) {
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
      entry.byDay.set(dateKey, { mins: 0, sessionCount: 0, activeCount: 0, sessions: [] })
    }
    const dayEntry = entry.byDay.get(dateKey)!
    dayEntry.sessionCount += 1

    const trimmedNote = s.note?.trim() ?? null
    if (trimmedNote) {
      entry.noteCount += 1
    }

    dayEntry.sessions.push({
      clock_in_at: s.clock_in_at,
      clock_out_at: s.clock_out_at,
      note: trimmedNote,
    })

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

  for (const entry of map.values()) {
    for (const day of entry.byDay.values()) {
      day.sessions.sort(
        (a, b) => new Date(a.clock_in_at).getTime() - new Date(b.clock_in_at).getTime()
      )
    }
  }

  return [...map.values()].sort((a, b) => b.totalMins - a.totalMins)
}

export function getEmployeeClockSummary(
  sessions: ClockSessionWithTeacher[],
  teacherId: string
): EmployeeClockSummary | null {
  const all = buildEmployeeClockSummary(sessions)
  return all.find((e) => e.teacher_id === teacherId) ?? null
}
