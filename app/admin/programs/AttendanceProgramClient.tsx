'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Search, Users, CalendarDays, TrendingUp, CreditCard } from 'lucide-react'
import { getAdminAftercareForDate, getAdminFieldFridayForDate } from '@/app/actions/adminAttendance'
import type { AdminAttendanceRow, AdminFieldFridayRow, AttendanceStats } from '@/app/actions/adminAttendance'
import { cssColors as colors, cssShadows as shadows, radius } from '../design-system'
import { Poppins } from 'next/font/google'

const poppins = Poppins({ weight: ['300', '400', '600', '700', '900'], subsets: ['latin'] })

const SUB_NAV = [
  { label: 'Summer 2026', href: '/admin/programs/summer_26' },
  { label: 'School Year 2026–2027', href: '/admin/programs/school_year_26_27' },
  { label: 'Homeschool Drop-In', href: '/admin/programs/homeschool_drop_in' },
  { label: 'Aftercare', href: '/admin/programs/aftercare' },
  { label: 'Field Fun Fridays', href: '/admin/programs/field_friday' },
]

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return `${DAY_NAMES[date.getDay()]}, ${MONTH_NAMES[date.getMonth()]} ${d}`
}

function getTodayWeekday(): string {
  const d = new Date()
  if (d.getDay() === 6) d.setDate(d.getDate() - 1)
  if (d.getDay() === 0) d.setDate(d.getDate() + 1)
  return toDateStr(d)
}

function getThisFriday(): string {
  const d = new Date()
  const day = d.getDay()
  if (day !== 5) {
    const daysUntilFriday = day === 6 ? 6 : 5 - day
    d.setDate(d.getDate() + daysUntilFriday)
  }
  return toDateStr(d)
}

function shiftWeekday(dateStr: string, delta: 1 | -1): string {
  const [y, mo, d] = dateStr.split('-').map(Number)
  const date = new Date(y, mo - 1, d)
  do {
    date.setDate(date.getDate() + delta)
  } while (date.getDay() === 0 || date.getDay() === 6)
  return toDateStr(date)
}

function shiftFriday(dateStr: string, delta: 1 | -1): string {
  const [y, mo, d] = dateStr.split('-').map(Number)
  const date = new Date(y, mo - 1, d)
  date.setDate(date.getDate() + delta * 7)
  return toDateStr(date)
}

function getMonthDays(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const offset = firstDay === 0 ? 6 : firstDay - 1
  const cells: (Date | null)[] = Array(offset).fill(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

function toDateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getInitials(name: string | null): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const AVATAR_COLORS = [
  '#4a7c59', '#6b9e7a', '#3d6b4e', '#527a62', '#7aab8a',
  '#5c8f6e', '#436854', '#618f72', '#4e8060', '#3a5e49',
]

function avatarColor(studentId: string): string {
  let hash = 0
  for (let i = 0; i < studentId.length; i++) {
    hash = (hash * 31 + studentId.charCodeAt(i)) & 0xfffffff
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

function fmt12h(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  sub?: string
}

function StatCard({ icon, label, value, sub }: StatCardProps) {
  return (
    <div
      className="flex items-start gap-3 p-4 rounded-xl"
      style={{
        backgroundColor: 'white',
        border: `1px solid ${colors.border}`,
        boxShadow: shadows.soft,
      }}
    >
      <div
        className="flex items-center justify-center shrink-0 rounded-lg"
        style={{ width: 36, height: 36, backgroundColor: '#4a7c59' + '18' }}
      >
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium" style={{ color: colors.textTertiary }}>{label}</p>
        <p className={`text-xl font-bold mt-0.5 ${poppins.className}`} style={{ color: colors.mistyForest }}>{value}</p>
        {sub && <p className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>{sub}</p>}
      </div>
    </div>
  )
}

interface Props {
  program: 'aftercare' | 'field_friday'
  initialDate: string
  initialRows: AdminAttendanceRow[] | AdminFieldFridayRow[]
  stats: AttendanceStats
}

export function AttendanceProgramClient({ program, initialDate, initialRows, stats }: Props) {
  const pathname = usePathname()
  const isAftercare = program === 'aftercare'
  const todayRef = isAftercare ? getTodayWeekday() : getThisFriday()

  const [selectedDate, setSelectedDate] = useState(initialDate)
  const [rows, setRows] = useState<AdminAttendanceRow[] | AdminFieldFridayRow[]>(initialRows)
  const [loadingDate, setLoadingDate] = useState(false)
  const [search, setSearch] = useState('')

  const [calOpen, setCalOpen] = useState(false)
  const [calYear, setCalYear] = useState(() => Number(initialDate.split('-')[0]))
  const [calMonth, setCalMonth] = useState(() => Number(initialDate.split('-')[1]) - 1)
  const calRef = useRef<HTMLDivElement>(null)

  const isToday = selectedDate === todayRef

  useEffect(() => {
    if (!calOpen) return
    function handleOutside(e: MouseEvent) {
      if (calRef.current && !calRef.current.contains(e.target as Node)) setCalOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [calOpen])

  async function handleDateChange(newDate: string) {
    setLoadingDate(true)
    setSelectedDate(newDate)
    if (isAftercare) {
      const data = await getAdminAftercareForDate(newDate)
      setRows(data)
    } else {
      const data = await getAdminFieldFridayForDate(newDate)
      setRows(data)
    }
    setLoadingDate(false)
  }

  const attendingCount = rows.filter((r) => r.record !== null).length
  const paidTodayCount = rows.filter((r) => r.record !== null && r.hasEnrollment).length
  const unpaidTodayCount = rows.filter((r) => r.record !== null && !r.hasEnrollment).length

  const filteredRows = search.trim()
    ? rows.filter((r) => r.name?.toLowerCase().includes(search.toLowerCase()))
    : rows

  return (
    <div className="flex min-h-full -mx-3 sm:-mx-4 lg:-mx-6">
      {/* Sub-sidebar */}
      <aside
        className="w-44 shrink-0 sticky top-0 self-start flex flex-col pt-6 px-3"
        style={{
          backgroundColor: colors.warmLinen,
          borderRight: `1px solid ${colors.border}`,
          minHeight: '100vh',
        }}
      >
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-3 px-2"
          style={{ color: colors.textTertiary }}
        >
          Programs
        </p>
        <nav className="flex flex-col gap-1">
          {SUB_NAV.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150"
                style={{
                  backgroundColor: active ? colors.pastelSage : 'transparent',
                  color: active ? colors.mistyForest : colors.textSecondary,
                }}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 px-8 py-6 overflow-y-auto">
      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard
          icon={<Users className="w-4 h-4" style={{ color: '#4a7c59' }} />}
          label="Total Enrolled"
          value={stats.totalEnrolled}
        />
        <StatCard
          icon={<CalendarDays className="w-4 h-4" style={{ color: '#4a7c59' }} />}
          label="Sessions Held"
          value={stats.totalSessions}
          sub={`${stats.avgPerSession} avg per session`}
        />
        <StatCard
          icon={<TrendingUp className="w-4 h-4" style={{ color: '#4a7c59' }} />}
          label="Total Attendances"
          value={stats.totalAttendances}
          sub={`across all sessions`}
        />
        <StatCard
          icon={<CreditCard className="w-4 h-4" style={{ color: '#4a7c59' }} />}
          label="Payment Rate"
          value={`${stats.paidRate}%`}
          sub={`${stats.paidAttendances} paid · ${stats.unpaidAttendances} unpaid`}
        />
      </div>

      {/* Date navigation */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <button
          onClick={() => handleDateChange(isAftercare ? shiftWeekday(selectedDate, -1) : shiftFriday(selectedDate, -1))}
          disabled={loadingDate}
          className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors disabled:opacity-40"
          style={{ borderColor: colors.border }}
        >
          <ChevronLeft className="w-4 h-4" style={{ color: colors.textSecondary }} />
        </button>

        <div className="relative" ref={calRef}>
          <button
            onClick={() => {
              const [y, m] = selectedDate.split('-').map(Number)
              setCalYear(y)
              setCalMonth(m - 1)
              setCalOpen((prev) => !prev)
            }}
            className="flex items-center gap-1.5 text-sm font-semibold min-w-[140px] justify-center px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            style={{ color: colors.textPrimary }}
          >
            {formatDateLabel(selectedDate)}
            {isToday && (
              <span
                className="ml-1 text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ color: '#4a7c59', backgroundColor: '#4a7c5918' }}
              >
                {isAftercare ? 'Today' : 'This Friday'}
              </span>
            )}
            <CalendarIcon className="w-3.5 h-3.5 ml-0.5 flex-shrink-0" style={{ color: colors.textTertiary }} />
          </button>

          {calOpen && (
            <div
              className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 rounded-xl border p-3 w-64"
              style={{ backgroundColor: 'white', borderColor: colors.border, boxShadow: shadows.medium }}
            >
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => {
                    if (calMonth === 0) { setCalMonth(11); setCalYear((y) => y - 1) }
                    else setCalMonth((m) => m - 1)
                  }}
                  className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                  style={{ color: colors.textTertiary }}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                  {MONTH_NAMES[calMonth]} {calYear}
                </span>
                <button
                  onClick={() => {
                    if (calMonth === 11) { setCalMonth(0); setCalYear((y) => y + 1) }
                    else setCalMonth((m) => m + 1)
                  }}
                  className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                  style={{ color: colors.textTertiary }}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-7 mb-1">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((label, i) => {
                  const highlight = isAftercare ? i < 5 : i === 4
                  return (
                    <div
                      key={i}
                      className="text-center text-xs font-semibold py-1"
                      style={{ color: highlight ? '#4a7c59' : colors.textTertiary }}
                    >
                      {label}
                    </div>
                  )
                })}
              </div>

              <div className="grid grid-cols-7 gap-0.5">
                {getMonthDays(calYear, calMonth).map((d, i) => {
                  if (!d) return <div key={`e-${i}`} />
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6
                  const isFriday = d.getDay() === 5
                  const disabled = isAftercare ? isWeekend : !isFriday
                  const dateStr = toDateStr(d)
                  const isSel = dateStr === selectedDate
                  const isTod = dateStr === todayRef
                  return (
                    <button
                      key={dateStr}
                      disabled={disabled}
                      onClick={() => { handleDateChange(dateStr); setCalOpen(false) }}
                      className="relative flex items-center justify-center w-full aspect-square rounded-lg text-xs font-medium transition-colors"
                      style={{
                        backgroundColor: isSel ? '#4a7c59' : undefined,
                        color: disabled ? colors.border : isSel ? 'white' : colors.textPrimary,
                        cursor: disabled ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {d.getDate()}
                      {isTod && !isSel && (
                        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full" style={{ backgroundColor: '#4a7c59' }} />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => handleDateChange(isAftercare ? shiftWeekday(selectedDate, 1) : shiftFriday(selectedDate, 1))}
          disabled={loadingDate}
          className="p-2 rounded-lg border bg-white hover:bg-gray-50 transition-colors disabled:opacity-40"
          style={{ borderColor: colors.border }}
        >
          <ChevronRight className="w-4 h-4" style={{ color: colors.textSecondary }} />
        </button>

        {!isToday && (
          <button
            onClick={() => handleDateChange(todayRef)}
            disabled={loadingDate}
            className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40"
            style={{ color: '#4a7c59', border: '1px solid #4a7c5950', backgroundColor: '#4a7c5910' }}
          >
            {isAftercare ? 'Today' : 'This Friday'}
          </button>
        )}

        <div className="relative ml-auto">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: colors.textTertiary }} />
          <input
            type="text"
            placeholder="Search students…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 py-2 text-sm rounded-lg border transition-colors w-56 focus:outline-none"
            style={{
              borderColor: colors.border,
              backgroundColor: 'white',
              color: colors.textPrimary,
            }}
          />
        </div>
      </div>

      {/* Today summary strip */}
      <div className="flex items-center gap-4 mb-4 px-1">
        <p className="text-sm font-medium" style={{ color: colors.textSecondary }}>
          {attendingCount} of {rows.length} attending today
        </p>
        {attendingCount > 0 && (
          <>
            <span
              className="text-xs font-medium px-2.5 py-1 rounded-full"
              style={{ color: '#4a7c59', backgroundColor: '#4a7c5915' }}
            >
              {paidTodayCount} paid
            </span>
            {unpaidTodayCount > 0 && (
              <span
                className="text-xs font-medium px-2.5 py-1 rounded-full"
                style={{ color: '#b45309', backgroundColor: '#fef3c7' }}
              >
                {unpaidTodayCount} unpaid but attending
              </span>
            )}
          </>
        )}
      </div>

      {/* Table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ backgroundColor: 'white', border: `1px solid ${colors.border}`, boxShadow: shadows.soft }}
      >
        {/* Header */}
        <div
          className={`grid gap-4 px-5 py-3 border-b text-xs font-semibold uppercase tracking-wide ${isAftercare ? 'grid-cols-[1fr_110px_140px_100px_110px]' : 'grid-cols-[1fr_110px_100px_110px]'}`}
          style={{ backgroundColor: colors.warmLinen, borderColor: colors.border, color: colors.textTertiary }}
        >
          <span>Student</span>
          <span className="text-center">Attended</span>
          {isAftercare && <span className="text-center">Pickup Time</span>}
          <span className="text-center">Status</span>
          <span className="text-center">Payment</span>
        </div>

        {/* Skeleton */}
        {loadingDate && (
          <div className="divide-y" style={{ borderColor: colors.border }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={`grid gap-4 px-5 py-4 items-center ${isAftercare ? 'grid-cols-[1fr_110px_140px_100px_110px]' : 'grid-cols-[1fr_110px_100px_110px]'}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
                  <div className="h-4 bg-gray-100 rounded animate-pulse w-32" />
                </div>
                <div className="h-4 bg-gray-100 rounded animate-pulse mx-auto w-8" />
                {isAftercare && <div className="h-4 bg-gray-100 rounded animate-pulse mx-auto w-20" />}
                <div className="h-4 bg-gray-100 rounded animate-pulse mx-auto w-16" />
                <div className="h-4 bg-gray-100 rounded animate-pulse mx-auto w-16" />
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!loadingDate && filteredRows.length === 0 && (
          <div className="px-5 py-12 text-center text-sm" style={{ color: colors.textTertiary }}>
            {search.trim() ? `No students match "${search}".` : 'No enrolled students found.'}
          </div>
        )}

        {/* Rows */}
        {!loadingDate && filteredRows.length > 0 && (
          <div className="divide-y" style={{ borderColor: colors.border + '60' }}>
            {filteredRows.map((row) => {
              const isChecked = row.record !== null
              const pickupTime = isAftercare ? (row as AdminAttendanceRow).record?.pickup_time : undefined

              return (
                <div
                  key={row.student_id}
                  className={`grid gap-4 px-5 py-3.5 items-center ${isAftercare ? 'grid-cols-[1fr_110px_140px_100px_110px]' : 'grid-cols-[1fr_110px_100px_110px]'}`}
                  style={{ transition: 'background-color 0.1s' }}
                >
                  {/* Student */}
                  <div className="flex items-center gap-3 min-w-0">
                    {row.profile_image_url ? (
                      <img
                        src={row.profile_image_url}
                        alt={row.name ?? ''}
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
                        style={{ backgroundColor: avatarColor(row.student_id) }}
                      >
                        {getInitials(row.name)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: colors.textPrimary }}>{row.name ?? '—'}</p>
                      {row.grade && (
                        <p className="text-xs truncate" style={{ color: colors.textTertiary }}>{row.grade}</p>
                      )}
                    </div>
                  </div>

                  {/* Attended indicator (read-only) */}
                  <div className="flex items-center justify-center">
                    <div
                      className="w-5 h-5 rounded border-2 flex items-center justify-center"
                      style={{
                        backgroundColor: isChecked ? '#4a7c59' : 'transparent',
                        borderColor: isChecked ? '#4a7c59' : colors.border,
                      }}
                    >
                      {isChecked && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
                        </svg>
                      )}
                    </div>
                  </div>

                  {/* Pickup time (aftercare only) */}
                  {isAftercare && (
                    <div className="flex items-center justify-center">
                      {pickupTime ? (
                        <span
                          className="text-xs font-medium px-2.5 py-1 rounded-full"
                          style={{ color: '#4a7c59', backgroundColor: '#4a7c5915' }}
                        >
                          {fmt12h(pickupTime)}
                        </span>
                      ) : (
                        <span className="text-xs" style={{ color: colors.border }}>—</span>
                      )}
                    </div>
                  )}

                  {/* Status */}
                  <div className="flex items-center justify-center">
                    {isChecked ? (
                      <span
                        className="text-xs font-medium px-2.5 py-1 rounded-full"
                        style={{ color: '#4a7c59', backgroundColor: '#4a7c5915' }}
                      >
                        Recorded
                      </span>
                    ) : (
                      <span className="text-xs" style={{ color: colors.border }}>—</span>
                    )}
                  </div>

                  {/* Payment */}
                  <div className="flex items-center justify-center">
                    {row.hasEnrollment ? (
                      <span
                        className="text-xs font-medium px-2.5 py-1 rounded-full"
                        style={{ color: '#4a7c59', backgroundColor: '#4a7c5915' }}
                      >
                        Paid
                      </span>
                    ) : isChecked ? (
                      <span
                        className="text-xs font-medium px-2.5 py-1 rounded-full"
                        style={{ color: '#b45309', backgroundColor: '#fef3c7' }}
                      >
                        Unpaid
                      </span>
                    ) : (
                      <span
                        className="text-xs font-medium px-2.5 py-1 rounded-full"
                        style={{ color: colors.textTertiary, backgroundColor: colors.warmLinen }}
                      >
                        Not paid
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      </div>
    </div>
  )
}
