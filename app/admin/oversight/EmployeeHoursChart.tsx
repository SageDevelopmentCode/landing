'use client'

import { useState } from 'react'
import { Clock } from 'lucide-react'
import { cssColors as colors, cssShadows as shadows, radius } from '../design-system'
import type { ClockSessionWithTeacher } from '@/app/actions/timeclock'

const MONTH_ABBRS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAY_ABBRS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const TEACHER_COLORS = [
  '#38BDF8', // sky blue
  '#F59E0B', // amber
  '#EC4899', // pink
  '#A78BFA', // violet
  '#34D399', // emerald
  '#FB923C', // orange
  '#E879F9', // fuchsia
  '#22D3EE', // cyan
]

function getInitials(name: string | null): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function toLocalDateKey(isoTimestamp: string): string {
  const d = new Date(isoTimestamp)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function sessionHours(clockIn: string, clockOut: string | null): number {
  if (!clockOut) return 0
  return Math.max(0, (new Date(clockOut).getTime() - new Date(clockIn).getTime()) / 3600000)
}

type TeacherSegment = {
  teacher_id: string
  name: string | null
  hours: number
  profileImageUrl: string | null
  color: string
}

type DayPoint = {
  date: string
  label: string
  totalHours: number
  byTeacher: TeacherSegment[]
}

type WeekPoint = {
  weekStart: string
  label: string
  totalHours: number
  byTeacher: TeacherSegment[]
}

function buildTeacherMaps(sessions: ClockSessionWithTeacher[]): {
  colorMap: Map<string, string>
  infoMap: Map<string, { name: string | null; profileImageUrl: string | null }>
} {
  const ids = [...new Set(sessions.map((s) => s.teacher_id))].sort()
  const colorMap = new Map<string, string>()
  const infoMap = new Map<string, { name: string | null; profileImageUrl: string | null }>()
  ids.forEach((id, i) => {
    colorMap.set(id, TEACHER_COLORS[i % TEACHER_COLORS.length])
  })
  for (const s of sessions) {
    if (!infoMap.has(s.teacher_id)) {
      infoMap.set(s.teacher_id, { name: s.full_name, profileImageUrl: s.profile_image_url })
    }
  }
  return { colorMap, infoMap }
}

function buildDayPoints(
  sessions: ClockSessionWithTeacher[],
  colorMap: Map<string, string>,
  days = 7,
): DayPoint[] {
  const today = new Date()
  const points: DayPoint[] = []

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const dayLabel = `${MONTH_ABBRS[d.getMonth()]} ${d.getDate()}`
    const dayOfWeek = DAY_ABBRS[d.getDay()]
    points.push({ date: dateKey, label: `${dayOfWeek} ${dayLabel}`, totalHours: 0, byTeacher: [] })
  }

  // Accumulate hours by date → teacher_id
  const byDate = new Map<string, Map<string, number>>()
  for (const s of sessions) {
    const dateKey = toLocalDateKey(s.clock_in_at)
    const hrs = sessionHours(s.clock_in_at, s.clock_out_at)
    if (!byDate.has(dateKey)) byDate.set(dateKey, new Map())
    byDate.get(dateKey)!.set(s.teacher_id, (byDate.get(dateKey)!.get(s.teacher_id) ?? 0) + hrs)
  }

  // Build info lookup by teacher_id
  const infoByTeacher = new Map<string, { name: string | null; profileImageUrl: string | null }>()
  for (const s of sessions) {
    if (!infoByTeacher.has(s.teacher_id)) {
      infoByTeacher.set(s.teacher_id, { name: s.full_name, profileImageUrl: s.profile_image_url })
    }
  }

  for (const pt of points) {
    const teacherMap = byDate.get(pt.date)
    if (!teacherMap) continue
    const byTeacher: TeacherSegment[] = []
    let total = 0
    for (const [tid, hours] of teacherMap) {
      const info = infoByTeacher.get(tid)
      byTeacher.push({
        teacher_id: tid,
        name: info?.name ?? null,
        hours,
        profileImageUrl: info?.profileImageUrl ?? null,
        color: colorMap.get(tid) ?? TEACHER_COLORS[0],
      })
      total += hours
    }
    byTeacher.sort((a, b) => b.hours - a.hours)
    pt.totalHours = total
    pt.byTeacher = byTeacher
  }

  return points
}

function getMondayKey(isoTimestamp: string): string {
  const d = new Date(isoTimestamp)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(d)
  monday.setDate(d.getDate() + diff)
  return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`
}

function buildWeekPoints(
  sessions: ClockSessionWithTeacher[],
  colorMap: Map<string, string>,
  weeks = 4,
): WeekPoint[] {
  const today = new Date()
  const currentDay = today.getDay()
  const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay
  const currentMonday = new Date(today)
  currentMonday.setDate(today.getDate() + diffToMonday)

  const points: WeekPoint[] = []
  for (let i = weeks - 1; i >= 0; i--) {
    const monday = new Date(currentMonday)
    monday.setDate(currentMonday.getDate() - i * 7)
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    const monKey = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`
    const monLabel = `${MONTH_ABBRS[monday.getMonth()]} ${monday.getDate()}`
    const sunLabel = `${MONTH_ABBRS[sunday.getMonth()]} ${sunday.getDate()}`
    points.push({ weekStart: monKey, label: `${monLabel}–${sunLabel}`, totalHours: 0, byTeacher: [] })
  }

  const byWeek = new Map<string, Map<string, number>>()
  for (const s of sessions) {
    const monKey = getMondayKey(s.clock_in_at)
    const hrs = sessionHours(s.clock_in_at, s.clock_out_at)
    if (!byWeek.has(monKey)) byWeek.set(monKey, new Map())
    byWeek.get(monKey)!.set(s.teacher_id, (byWeek.get(monKey)!.get(s.teacher_id) ?? 0) + hrs)
  }

  const infoByTeacher = new Map<string, { name: string | null; profileImageUrl: string | null }>()
  for (const s of sessions) {
    if (!infoByTeacher.has(s.teacher_id)) {
      infoByTeacher.set(s.teacher_id, { name: s.full_name, profileImageUrl: s.profile_image_url })
    }
  }

  for (const pt of points) {
    const teacherMap = byWeek.get(pt.weekStart)
    if (!teacherMap) continue
    const byTeacher: TeacherSegment[] = []
    let total = 0
    for (const [tid, hours] of teacherMap) {
      const info = infoByTeacher.get(tid)
      byTeacher.push({
        teacher_id: tid,
        name: info?.name ?? null,
        hours,
        profileImageUrl: info?.profileImageUrl ?? null,
        color: colorMap.get(tid) ?? TEACHER_COLORS[0],
      })
      total += hours
    }
    byTeacher.sort((a, b) => b.hours - a.hours)
    pt.totalHours = total
    pt.byTeacher = byTeacher
  }

  return points
}

function TeacherAvatar({
  name,
  profileImageUrl,
  color,
  size = 24,
}: {
  name: string | null
  profileImageUrl: string | null
  color: string
  size?: number
}) {
  if (profileImageUrl) {
    return (
      <img
        src={profileImageUrl}
        alt={name ?? 'Teacher'}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: 0,
          border: `2px solid ${color}`,
        }}
      />
    )
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        fontSize: size * 0.38,
        fontWeight: 700,
        color: '#fff',
        letterSpacing: 0.5,
      }}
    >
      {getInitials(name)}
    </div>
  )
}

export function EmployeeHoursChart({ sessions }: { sessions: ClockSessionWithTeacher[] }) {
  const [view, setView] = useState<'day' | 'week'>('day')
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  const { colorMap, infoMap } = buildTeacherMaps(sessions)

  const dayPoints = buildDayPoints(sessions, colorMap, 7)
  const weekPoints = buildWeekPoints(sessions, colorMap, 4)

  const points = view === 'day' ? dayPoints : weekPoints
  const allHours = points.map((p) => p.totalHours)
  const maxHours = Math.max(...allHours, 1)

  const chartHeight = 200
  const barAreaHeight = chartHeight - 32

  const yMax = Math.ceil(maxHours / 2) * 2 || 2
  const yMid = yMax / 2
  const yTicks = [0, yMid, yMax]

  const totalHours = points.reduce((s, p) => s + p.totalHours, 0)
  const avgHours = points.length > 0 ? totalHours / points.length : 0
  const busiestIdx = points.reduce((best, p, i) => p.totalHours > points[best].totalHours ? i : best, 0)
  const busiestPt = points[busiestIdx]

  // All teachers active in current view period (for legend)
  const activeLegend: { teacher_id: string; name: string | null; profileImageUrl: string | null; color: string }[] = []
  const seen = new Set<string>()
  for (const pt of points) {
    for (const t of pt.byTeacher) {
      if (!seen.has(t.teacher_id)) {
        seen.add(t.teacher_id)
        activeLegend.push({ teacher_id: t.teacher_id, name: t.name, profileImageUrl: t.profileImageUrl, color: t.color })
      }
    }
  }

  const CHART_BLUE = '#38BDF8'

  if (sessions.length === 0 && points.every((p) => p.totalHours === 0)) {
    return (
      <div
        style={{
          backgroundColor: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: radius.lg,
          boxShadow: shadows.card,
          padding: '24px',
        }}
      >
        <div className="flex items-center gap-2 mb-6">
          <Clock className="w-4 h-4" style={{ color: CHART_BLUE }} />
          <span className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
            Employee Hours
          </span>
        </div>
        <p className="text-sm text-center py-12" style={{ color: colors.textTertiary }}>
          No clock sessions recorded yet.
        </p>
      </div>
    )
  }

  return (
    <div
      style={{
        backgroundColor: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: radius.lg,
        boxShadow: shadows.card,
        padding: '24px',
      }}
    >
      {/* Card header */}
      <div className="flex items-center gap-2 mb-6">
        <Clock className="w-4 h-4" style={{ color: CHART_BLUE }} />
        <span className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
          Employee Hours
        </span>

        {/* Toggle */}
        <div
          className="ml-auto flex items-center"
          style={{
            gap: 2,
            backgroundColor: colors.elevated,
            border: `1px solid ${colors.border}`,
            borderRadius: radius.md,
            padding: 2,
          }}
        >
          {(['day', 'week'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: '3px 10px',
                borderRadius: radius.sm,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: view === v ? CHART_BLUE : 'transparent',
                color: view === v ? '#fff' : colors.textTertiary,
                transition: 'background-color 150ms ease, color 150ms ease',
              }}
            >
              {v === 'day' ? 'Day' : 'Week'}
            </button>
          ))}
        </div>

        <span className="text-xs" style={{ color: colors.textTertiary, marginLeft: 8 }}>
          {view === 'day' ? 'Total hours per day (last 7 days)' : 'Total hours per week (last 4 weeks)'}
        </span>
      </div>

      {/* Chart area */}
      <div style={{ position: 'relative' }}>
        {/* Y-axis gridlines */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: barAreaHeight,
            pointerEvents: 'none',
          }}
        >
          {yTicks.map((tick) => {
            const pct = tick / yMax
            const top = barAreaHeight - pct * barAreaHeight
            return (
              <div
                key={tick}
                style={{
                  position: 'absolute',
                  top,
                  left: 0,
                  right: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    color: colors.textTertiary,
                    minWidth: 28,
                    textAlign: 'right',
                    lineHeight: 1,
                    transform: 'translateY(-50%)',
                  }}
                >
                  {tick % 1 === 0 ? tick : tick.toFixed(1)}h
                </span>
                <div
                  style={{
                    flex: 1,
                    height: 1,
                    backgroundColor: colors.border,
                    opacity: tick === 0 ? 0.8 : 0.4,
                    transform: 'translateY(-50%)',
                  }}
                />
              </div>
            )
          })}
        </div>

        {/* Bars */}
        <div
          style={{
            marginLeft: 40,
            height: chartHeight,
            display: 'flex',
            alignItems: 'flex-end',
            gap: 4,
          }}
        >
          {points.map((pt, idx) => {
            const isHovered = hoveredIdx === idx
            const barHeight = maxHours === 0 ? 0 : (pt.totalHours / yMax) * barAreaHeight

            const label = view === 'day'
              ? (pt as DayPoint).label
              : (pt as WeekPoint).label

            return (
              <div
                key={view === 'day' ? (pt as DayPoint).date : (pt as WeekPoint).weekStart}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  height: chartHeight,
                  justifyContent: 'flex-end',
                  cursor: 'pointer',
                  position: 'relative',
                }}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {/* Tooltip */}
                {isHovered && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: chartHeight + 8,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      backgroundColor: colors.elevated,
                      border: `1px solid ${colors.borderStrong}`,
                      borderRadius: radius.md,
                      padding: '8px 12px',
                      whiteSpace: 'nowrap',
                      zIndex: 10,
                      boxShadow: shadows.medium,
                      pointerEvents: 'none',
                      minWidth: 160,
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 600, color: colors.textPrimary }}>
                      {label}
                    </div>
                    <div style={{ fontSize: 12, color: CHART_BLUE, marginTop: 4, fontWeight: 600 }}>
                      {pt.totalHours.toFixed(1)} hrs total
                    </div>
                    {pt.byTeacher.length > 0 && (
                      <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {pt.byTeacher.map((t) => (
                          <div key={t.teacher_id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <TeacherAvatar
                              name={t.name}
                              profileImageUrl={t.profileImageUrl}
                              color={t.color}
                              size={20}
                            />
                            <span style={{ fontSize: 10, color: colors.textSecondary, flex: 1 }}>
                              {t.name ?? 'Unknown'}
                            </span>
                            <div
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                backgroundColor: t.color,
                                flexShrink: 0,
                              }}
                            />
                            <span style={{ fontSize: 10, color: colors.textTertiary }}>{t.hours.toFixed(1)}h</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {pt.totalHours === 0 && (
                      <div style={{ fontSize: 10, color: colors.textTertiary, marginTop: 4 }}>No sessions</div>
                    )}
                  </div>
                )}

                {/* Stacked bar */}
                <div
                  style={{
                    width: '100%',
                    height: barHeight || (pt.totalHours > 0 ? 2 : 0),
                    borderRadius: `${radius.sm} ${radius.sm} 0 0`,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    filter: isHovered ? 'brightness(1.15)' : 'none',
                    transition: 'filter 150ms ease, height 300ms ease',
                  }}
                >
                  {pt.byTeacher.length > 0
                    ? pt.byTeacher.map((t) => (
                        <div
                          key={t.teacher_id}
                          style={{
                            width: '100%',
                            height: pt.totalHours > 0 ? `${(t.hours / pt.totalHours) * 100}%` : 0,
                            backgroundColor: t.color,
                            flexShrink: 0,
                          }}
                        />
                      ))
                    : (
                        <div
                          style={{
                            width: '100%',
                            height: '100%',
                            backgroundColor: CHART_BLUE,
                          }}
                        />
                      )
                  }
                </div>

                {/* X-axis label */}
                <div
                  style={{
                    height: 32,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingTop: 4,
                  }}
                >
                  <span style={{ fontSize: 9, color: isHovered ? colors.textSecondary : colors.textTertiary, lineHeight: 1.2, textAlign: 'center' }}>
                    {view === 'day'
                      ? label.split(' ')[0]
                      : label.split('–')[0].trim()
                    }
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      {activeLegend.length > 0 && (
        <div
          style={{
            marginTop: 16,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          {activeLegend.map((t) => (
            <div
              key={t.teacher_id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                backgroundColor: colors.elevated,
                border: `1px solid ${colors.border}`,
                borderRadius: radius.md,
                padding: '4px 8px',
              }}
            >
              <TeacherAvatar
                name={t.name}
                profileImageUrl={t.profileImageUrl}
                color={t.color}
                size={22}
              />
              <span style={{ fontSize: 11, color: colors.textSecondary, fontWeight: 500 }}>
                {t.name ?? 'Unknown'}
              </span>
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: t.color,
                  flexShrink: 0,
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Summary row */}
      <div
        className="flex items-center gap-6 mt-6 pt-4"
        style={{ borderTop: `1px solid ${colors.border}` }}
      >
        <div>
          <div className="text-xs" style={{ color: colors.textTertiary }}>
            Busiest {view === 'day' ? 'day' : 'week'}
          </div>
          <div className="text-sm font-semibold mt-0.5" style={{ color: colors.textPrimary }}>
            {busiestPt && busiestPt.totalHours > 0
              ? `${view === 'day' ? (busiestPt as DayPoint).label : (busiestPt as WeekPoint).label} · ${busiestPt.totalHours.toFixed(1)}h`
              : '—'}
          </div>
        </div>
        <div>
          <div className="text-xs" style={{ color: colors.textTertiary }}>Total hours (period)</div>
          <div className="text-sm font-semibold mt-0.5" style={{ color: colors.textPrimary }}>
            {totalHours.toFixed(1)} hrs
          </div>
        </div>
        <div>
          <div className="text-xs" style={{ color: colors.textTertiary }}>
            Avg per {view === 'day' ? 'day' : 'week'}
          </div>
          <div className="text-sm font-semibold mt-0.5" style={{ color: colors.textPrimary }}>
            {avgHours.toFixed(1)} hrs
          </div>
        </div>
      </div>
    </div>
  )
}
