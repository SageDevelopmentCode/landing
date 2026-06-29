'use client'

import { useState } from 'react'
import { BarChart2 } from 'lucide-react'
import { cssColors as colors, cssShadows as shadows, radius } from '../design-system'
import type { WeekTrend } from '@/app/actions/oversightActions'
import { DetailSidebar } from '../components/DetailSidebar'

const MONTH_ABBRS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const AVATAR_COLORS = [
  '#4a7c59', '#5E7C68', '#6b9e7a', '#3d6b4f', '#527a60',
  '#4f8865', '#3a6b52', '#629973', '#456a55', '#5a8c6a',
]

function avatarColor(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) & 0xfffffff
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

function getInitials(name: string | null): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function formatWeekRange(mondayDate: string): string {
  const [y, m, d] = mondayDate.split('-').map(Number)
  const monday = new Date(y, m - 1, d)
  const friday = new Date(y, m - 1, d + 4)
  const monLabel = `${MONTH_ABBRS[monday.getMonth()]} ${monday.getDate()}`
  const friLabel = `${MONTH_ABBRS[friday.getMonth()]} ${friday.getDate()}`
  return `${monLabel} – ${friLabel}`
}

export function OversightClient({ trend }: { trend: WeekTrend[] }) {
  const [hoveredWeek, setHoveredWeek] = useState<number | null>(null)
  const [selectedWeek, setSelectedWeek] = useState<WeekTrend | null>(null)

  const maxEnrolled = Math.max(...trend.map((w) => w.enrolled), 1)
  const chartHeight = 200
  const barAreaHeight = chartHeight - 32 // leave 32px for x-axis labels

  // Y-axis tick values
  const yTicks = [0, Math.round(maxEnrolled / 2), maxEnrolled]

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
        <BarChart2 className="w-4 h-4" style={{ color: colors.accent }} />
        <span className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
          Summer 2026 — Weekly Enrollment
        </span>
        <span className="text-xs ml-auto" style={{ color: colors.textTertiary }}>
          Students enrolled per week (Mon–Thu)
        </span>
      </div>

      {/* Chart area */}
      <div style={{ position: 'relative' }}>
        {/* Y-axis ticks + gridlines */}
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
            const pct = tick / maxEnrolled
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
                    minWidth: 24,
                    textAlign: 'right',
                    lineHeight: 1,
                    transform: 'translateY(-50%)',
                  }}
                >
                  {tick}
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
            marginLeft: 36,
            height: chartHeight,
            display: 'flex',
            alignItems: 'flex-end',
            gap: 4,
          }}
        >
          {trend.map((week) => {
            const isHovered = hoveredWeek === week.week
            const barHeight = maxEnrolled === 0 ? 0 : (week.enrolled / maxEnrolled) * barAreaHeight
            const weekRange = formatWeekRange(week.mondayDate)

            return (
              <div
                key={week.week}
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
                onMouseEnter={() => setHoveredWeek(week.week)}
                onMouseLeave={() => setHoveredWeek(null)}
                onClick={() => setSelectedWeek(selectedWeek?.week === week.week ? null : week)}
              >
                {/* Tooltip */}
                {isHovered && (
                  <div
                    style={{
                      position: 'absolute',
                      top: chartHeight + 4,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      backgroundColor: colors.elevated,
                      border: `1px solid ${colors.borderStrong}`,
                      borderRadius: radius.md,
                      padding: '6px 10px',
                      whiteSpace: 'nowrap',
                      zIndex: 10,
                      boxShadow: shadows.medium,
                      pointerEvents: 'none',
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 600, color: colors.textPrimary }}>
                      Week {week.week}
                    </div>
                    <div style={{ fontSize: 10, color: colors.textTertiary, marginTop: 2 }}>
                      {weekRange}
                    </div>
                    <div style={{ fontSize: 11, color: colors.accent, marginTop: 4, fontWeight: 600 }}>
                      {week.enrolled} student{week.enrolled !== 1 ? 's' : ''}
                    </div>
                  </div>
                )}

                {/* Bar */}
                <div
                  style={{
                    width: '100%',
                    height: barHeight,
                    backgroundColor: isHovered ? colors.accentBright : colors.accent,
                    borderRadius: `${radius.sm} ${radius.sm} 0 0`,
                    transition: 'background-color 150ms ease, height 300ms ease',
                    minHeight: week.enrolled > 0 ? 2 : 0,
                  }}
                />

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
                  <span style={{ fontSize: 9, color: isHovered ? colors.textSecondary : colors.textTertiary, lineHeight: 1.2 }}>
                    {week.week}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Summary row */}
      <div
        className="flex items-center gap-6 mt-6 pt-4"
        style={{ borderTop: `1px solid ${colors.border}` }}
      >
        <div>
          <div className="text-xs" style={{ color: colors.textTertiary }}>Peak week</div>
          <div className="text-sm font-semibold mt-0.5" style={{ color: colors.textPrimary }}>
            {(() => {
              const peak = trend.reduce((a, b) => (b.enrolled > a.enrolled ? b : a), trend[0])
              return peak ? `Week ${peak.week} · ${peak.enrolled} students` : '—'
            })()}
          </div>
        </div>
        <div>
          <div className="text-xs" style={{ color: colors.textTertiary }}>Total unique (max week)</div>
          <div className="text-sm font-semibold mt-0.5" style={{ color: colors.textPrimary }}>
            {maxEnrolled} students
          </div>
        </div>
        <div>
          <div className="text-xs" style={{ color: colors.textTertiary }}>Avg per week</div>
          <div className="text-sm font-semibold mt-0.5" style={{ color: colors.textPrimary }}>
            {trend.length > 0
              ? Math.round(trend.reduce((s, w) => s + w.enrolled, 0) / trend.length)
              : 0}{' '}
            students
          </div>
        </div>
      </div>

      {/* Week detail drawer */}
      <DetailSidebar
        isOpen={selectedWeek !== null}
        onClose={() => setSelectedWeek(null)}
        title={selectedWeek ? `Week ${selectedWeek.week} · ${formatWeekRange(selectedWeek.mondayDate)}` : ''}
      >
        {selectedWeek && (
          <div>
            <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>
              {selectedWeek.enrolled} student{selectedWeek.enrolled !== 1 ? 's' : ''} enrolled
            </p>
            {selectedWeek.students.length === 0 ? (
              <p className="text-sm" style={{ color: colors.textTertiary }}>No students enrolled this week.</p>
            ) : (
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {selectedWeek.students.map((student) => (
                  <li
                    key={student.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 12px',
                      borderRadius: radius.md,
                      backgroundColor: colors.surface,
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    {student.profileImageUrl ? (
                      <img
                        src={student.profileImageUrl}
                        alt={student.name ?? 'Student'}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          objectFit: 'cover',
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          backgroundColor: avatarColor(student.id),
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 13,
                          fontWeight: 600,
                          flexShrink: 0,
                        }}
                      >
                        {getInitials(student.name)}
                      </div>
                    )}
                    <span style={{ fontSize: 13, color: colors.textPrimary }}>
                      {student.name ?? '—'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </DetailSidebar>
    </div>
  )
}
