'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Poppins } from 'next/font/google'
import {
  ChevronLeft, ChevronRight, Search, Loader2,
  Users, CalendarDays, TrendingUp, CreditCard,
} from 'lucide-react'
import {
  getSummerStudentsForWeek,
  upsertSummerAttendanceRecord,
  removeSummerAttendanceRecord,
} from '@/app/actions/summerAttendance'
import type { SummerStudentRow, SummerDayData } from '@/app/actions/summerAttendance'
import type { SummerAttendanceStats } from '@/app/actions/adminAttendance'
import { cssColors as colors, cssShadows as shadows, radius } from '../design-system'
import { StudentDetailSidebar } from '../components/StudentDetailSidebar'
import { PRESET_TAGS } from '../constants/applicationTags'

const poppins = Poppins({ weight: ['300', '400', '700', '900'], subsets: ['latin'] })

const SUB_NAV = [
  { label: 'Summer 2026', href: '/admin/programs/summer_26' },
  { label: 'School Year 2026–2027', href: '/admin/programs/school_year_26_27' },
  { label: 'Homeschool Drop-In', href: '/admin/programs/homeschool_drop_in' },
  { label: 'Aftercare', href: '/admin/programs/aftercare' },
  { label: 'Field Fun Fridays', href: '/admin/programs/field_friday' },
]

const CLASSROOM_LABELS: Record<string, string> = {
  prek_1st: 'Pre-K / 1st',
  '2nd_4th': '2nd – 4th',
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const SUMMER_WEEK1_MONDAY = new Date(2026, 4, 25)
const TOTAL_WEEKS = 12

const AVATAR_COLORS = [
  '#4a7c59', '#5E7C68', '#6b9e7a', '#3d6b4f', '#527a60',
  '#4f8865', '#3a6b52', '#629973', '#456a55', '#5a8c6a',
]

// ── Types ─────────────────────────────────────────────────────────────────────

type StudentInfo = {
  id: string
  child_legal_name: string | null
  child_grade: string | null
  dob_month: string | null
  dob_day: string | null
  dob_year: string | null
  profile_image_url: string | null
  admin_tags: string[]
}

type TeacherGroup = {
  teacher: { id: string; full_name: string | null; role: string | null }
  classroom: string | null
  students: StudentInfo[]
}

type FullStudent = {
  id: string
  parent_id: string
  child_legal_name: string | null
  dob_month: string | null
  dob_day: string | null
  dob_year: string | null
  special_interests: string | null
  has_medical_conditions: string | null
  medical_conditions_description: string | null
  has_allergies: string | null
  allergies_description: string | null
  has_emergency_medications: string | null
  emergency_medications_description: string | null
  history_flags: string | null
  history_explanation: string | null
  needs_aide: string | null
  needs_aide_description: string | null
  learning_style: string | null
  strengths_interests: string | null
  current_challenges: string | null
  dysregulation_response: string | null
  regulation_strategies: string | null
  activities_to_avoid: string | null
  child_grade: string | null
  parent_name?: string | null
}

interface SummerProgramClientProps {
  teacherGroups: TeacherGroup[]
  totalStudentCount: number
  fetchStudentDetail: (studentId: string) => Promise<FullStudent>
  initialWeekData: SummerDayData[]
  initialWeekNum: number
  stats: SummerAttendanceStats
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name: string | null): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function formatDob(month: string | null, day: string | null, year: string | null): string {
  if (!month && !day && !year) return '—'
  return [month, day, year].filter(Boolean).join('/')
}

function avatarColor(studentId: string): string {
  let hash = 0
  for (let i = 0; i < studentId.length; i++) {
    hash = (hash * 31 + studentId.charCodeAt(i)) & 0xfffffff
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

function weekNumToMonday(weekNum: number): string {
  const d = new Date(SUMMER_WEEK1_MONDAY)
  d.setDate(d.getDate() + (weekNum - 1) * 7)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatShortDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return `${MONTH_NAMES[date.getMonth()]} ${d}`
}

function formatWeekRange(weekNum: number): string {
  const monday = weekNumToMonday(weekNum)
  const [y, m, d] = monday.split('-').map(Number)
  const fri = new Date(y, m - 1, d + 4)
  const monDate = new Date(y, m - 1, d)
  return `${MONTH_NAMES[monDate.getMonth()]} ${monDate.getDate()} – ${MONTH_NAMES[fri.getMonth()]} ${fri.getDate()}`
}

function getTodayStr(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  sub?: string
}) {
  return (
    <div
      className="flex items-start gap-3 p-4"
      style={{
        backgroundColor: colors.elevated,
        border: `1px solid ${colors.border}`,
        borderRadius: radius.lg,
        boxShadow: shadows.soft,
      }}
    >
      <div
        className="flex items-center justify-center shrink-0"
        style={{
          width: 36,
          height: 36,
          borderRadius: radius.md,
          backgroundColor: colors.accentLight,
          color: colors.mistyForest,
        }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium mb-0.5" style={{ color: colors.textTertiary }}>
          {label}
        </p>
        <p className="text-xl font-bold leading-tight" style={{ color: colors.mistyForest }}>
          {value}
        </p>
        {sub && (
          <p className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>
            {sub}
          </p>
        )}
      </div>
    </div>
  )
}

function StudentCard({ student, onClick }: { student: StudentInfo; onClick: (s: StudentInfo) => void }) {
  return (
    <div
      onClick={() => onClick(student)}
      className="flex flex-col items-center p-4 text-center cursor-pointer"
      style={{
        backgroundColor: colors.elevated,
        border: `1px solid ${colors.border}`,
        borderRadius: radius.md,
        boxShadow: shadows.soft,
      }}
    >
      {student.profile_image_url ? (
        <img
          src={student.profile_image_url}
          alt={student.child_legal_name ?? 'Student'}
          className="mb-2 object-cover"
          style={{ width: 40, height: 40, borderRadius: '50%', border: `1px solid ${colors.border}` }}
        />
      ) : (
        <div
          className="flex items-center justify-center mb-2 text-sm font-bold"
          style={{
            width: 40, height: 40, borderRadius: '50%',
            backgroundColor: colors.accentLight,
            color: colors.mistyForest,
            border: `1px solid ${colors.border}`,
          }}
        >
          {getInitials(student.child_legal_name)}
        </div>
      )}
      <p className="text-sm font-semibold leading-tight truncate w-full" style={{ color: colors.textPrimary }}>
        {student.child_legal_name ?? '—'}
      </p>
      {student.child_grade && (
        <p className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>Grade {student.child_grade}</p>
      )}
      <p className="text-xs mt-0.5" style={{ color: colors.textTertiary }}>
        {formatDob(student.dob_month, student.dob_day, student.dob_year)}
      </p>
      {student.admin_tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2 justify-center">
          {student.admin_tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-violet-50 text-violet-700 border border-violet-200"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export function SummerProgramClient({
  teacherGroups,
  totalStudentCount,
  fetchStudentDetail,
  initialWeekData,
  initialWeekNum,
  stats,
}: SummerProgramClientProps) {
  const pathname = usePathname()

  // Tab state
  const [activeTab, setActiveTab] = useState<'students' | 'attendance'>('students')

  // Students tab state
  const [activeTeacherId, setActiveTeacherId] = useState<string | null>(teacherGroups[0]?.teacher.id ?? null)
  const [selectedStudent, setSelectedStudent] = useState<StudentInfo | null>(null)
  const [studentDetail, setStudentDetail] = useState<FullStudent | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [excludedTags, setExcludedTags] = useState<Set<string>>(new Set(["Don't Include"]))

  // Attendance tab state
  const [weekNum, setWeekNum] = useState(initialWeekNum)
  const [weekData, setWeekData] = useState<SummerDayData[]>(initialWeekData)
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [loadingWeek, setLoadingWeek] = useState(false)
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set())
  const [attendanceSearch, setAttendanceSearch] = useState('')

  // ── Students tab helpers ──────────────────────────────────────────────────

  const activeGroup = teacherGroups.find((g) => g.teacher.id === activeTeacherId)

  const handleStudentClick = async (student: StudentInfo) => {
    setSelectedStudent(student)
    setStudentDetail(null)
    setDetailLoading(true)
    try {
      const result = await fetchStudentDetail(student.id)
      setStudentDetail(result)
    } finally {
      setDetailLoading(false)
    }
  }

  const toggleExcludeTag = (tag: string) => {
    setExcludedTags((prev) => {
      const next = new Set(prev)
      next.has(tag) ? next.delete(tag) : next.add(tag)
      return next
    })
  }

  function filterStudents(students: StudentInfo[]) {
    if (excludedTags.size === 0) return students
    return students.filter((s) => !s.admin_tags.some((t) => excludedTags.has(t)))
  }

  const visibleActiveStudents = activeGroup ? filterStudents(activeGroup.students) : []
  const allStudentsForProgram = teacherGroups.flatMap((g) => g.students)
  const hasAnyTags = allStudentsForProgram.some((s) => s.admin_tags.length > 0)

  // ── Attendance tab helpers ────────────────────────────────────────────────

  function addSaving(id: string) {
    setSavingIds((prev) => new Set(prev).add(id))
  }

  function removeSaving(id: string) {
    setSavingIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  function updateWeekDataRecord(date: string, studentId: string, record: SummerStudentRow['record']) {
    setWeekData((prev) =>
      prev.map((day) => {
        if (day.date !== date) return day
        return {
          ...day,
          students: day.students.map((s) =>
            s.student_id !== studentId ? s : { ...s, record }
          ),
        }
      })
    )
  }

  async function handleToggle(studentId: string, date: string, row: SummerStudentRow) {
    addSaving(studentId)
    if (row.record) {
      await removeSummerAttendanceRecord(row.record.id)
      updateWeekDataRecord(date, studentId, null)
    } else {
      const record = await upsertSummerAttendanceRecord(studentId, date, row.hasEnrollment)
      updateWeekDataRecord(date, studentId, record)
    }
    removeSaving(studentId)
  }

  async function handleWeekChange(newWeekNum: number) {
    if (newWeekNum < 1 || newWeekNum > TOTAL_WEEKS) return
    setLoadingWeek(true)
    setWeekNum(newWeekNum)
    setViewMode('week')
    setSelectedDate(null)
    const monday = weekNumToMonday(newWeekNum)
    const data = await getSummerStudentsForWeek(monday)
    setWeekData(data)
    setLoadingWeek(false)
  }

  function handleDrillDown(date: string) {
    setSelectedDate(date)
    setViewMode('day')
  }

  const dayDetail = viewMode === 'day' && selectedDate
    ? weekData.find((d) => d.date === selectedDate) ?? null
    : null

  const filteredDayStudents = dayDetail
    ? (attendanceSearch.trim()
        ? dayDetail.students.filter((s) =>
            s.name?.toLowerCase().includes(attendanceSearch.toLowerCase())
          )
        : dayDetail.students
      ).slice().sort((a, b) => {
        if (a.hasEnrollment !== b.hasEnrollment) return a.hasEnrollment ? -1 : 1
        return (a.name ?? '').localeCompare(b.name ?? '')
      })
    : []

  const totalExpectedThisWeek = new Set(
    weekData.flatMap((d) => d.students.filter((s) => s.hasEnrollment).map((s) => s.student_id))
  ).size

  const dayDetailExpected = dayDetail?.students.filter((s) => s.hasEnrollment).length ?? 0
  const dayDetailPresent = dayDetail?.students.filter((s) => s.record !== null).length ?? 0

  const todayStr = getTodayStr()

  // ── Render ────────────────────────────────────────────────────────────────

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
      <div className="flex-1 px-8 py-6 min-w-0">
        {/* Page header */}
        <div className="mb-4">
          <h1
            className={`text-2xl font-bold ${poppins.className}`}
            style={{ color: colors.mistyForest }}
          >
            Summer 2026
          </h1>
          <p className="mt-1 text-sm" style={{ color: colors.textSecondary }}>
            {totalStudentCount} student{totalStudentCount !== 1 ? 's' : ''} enrolled
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-0 mb-6" style={{ borderBottom: `1px solid ${colors.border}` }}>
          {(['students', 'attendance'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="relative px-4 py-2 text-sm font-medium transition-colors capitalize"
              style={{ color: activeTab === tab ? colors.mistyForest : colors.textSecondary }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {activeTab === tab && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ backgroundColor: colors.mistyForest }}
                />
              )}
            </button>
          ))}
        </div>

        {/* ── Students Tab ───────────────────────────────────────────────── */}
        {activeTab === 'students' && (
          <>
            {hasAnyTags && (
              <div className="flex items-center gap-2 flex-wrap mb-6">
                <span className="text-xs font-semibold" style={{ color: colors.textTertiary }}>
                  Exclude:
                </span>
                {PRESET_TAGS.map((tag) => {
                  const excluded = excludedTags.has(tag)
                  return (
                    <button
                      key={tag}
                      onClick={() => toggleExcludeTag(tag)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full border transition-colors ${
                        excluded
                          ? 'bg-red-50 text-red-600 border-red-200 line-through opacity-70'
                          : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {excluded && <span className="not-italic no-underline">✕</span>}
                      {tag}
                    </button>
                  )
                })}
                {excludedTags.size > 0 && (
                  <button
                    onClick={() => setExcludedTags(new Set())}
                    className="text-xs underline transition-colors"
                    style={{ color: colors.textTertiary }}
                  >
                    Clear all
                  </button>
                )}
              </div>
            )}

            {teacherGroups.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-24"
                style={{ color: colors.textTertiary }}
              >
                <p className="text-base">No assignments for this program yet.</p>
              </div>
            ) : (
              <>
                {/* Teacher tab bar */}
                <div
                  className="flex gap-2 flex-wrap mb-6 pb-1"
                  style={{ borderBottom: `1px solid ${colors.border}` }}
                >
                  {teacherGroups.map((group) => {
                    const isActive = group.teacher.id === activeTeacherId
                    return (
                      <button
                        key={group.teacher.id}
                        onClick={() => setActiveTeacherId(group.teacher.id)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150"
                        style={{
                          backgroundColor: isActive ? colors.pastelSage : 'transparent',
                          color: isActive ? colors.mistyForest : colors.textSecondary,
                          cursor: 'pointer',
                        }}
                      >
                        <div
                          className="flex items-center justify-center shrink-0 text-xs font-bold"
                          style={{
                            width: 32, height: 32, borderRadius: '50%',
                            backgroundColor: isActive ? colors.mistyForest : colors.border,
                            color: isActive ? 'white' : colors.textSecondary,
                          }}
                        >
                          {getInitials(group.teacher.full_name)}
                        </div>
                        {group.teacher.full_name ?? '—'}
                        {group.classroom && (
                          <span
                            className="text-xs font-medium px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: isActive ? colors.mistyForest : colors.warmLinen,
                              color: isActive ? 'white' : colors.textTertiary,
                            }}
                          >
                            {CLASSROOM_LABELS[group.classroom] ?? group.classroom}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* Active teacher panel */}
                {activeGroup && (
                  <div>
                    {visibleActiveStudents.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {visibleActiveStudents.map((student) => (
                          <StudentCard key={student.id} student={student} onClick={handleStudentClick} />
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm pl-1" style={{ color: colors.textTertiary }}>
                        No students assigned
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ── Attendance Tab ─────────────────────────────────────────────── */}
        {activeTab === 'attendance' && (
          <div className="flex flex-col min-h-0">
            {/* Stats strip */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              <StatCard
                icon={<Users className="w-4 h-4" />}
                label="Total Enrolled"
                value={stats.totalEnrolled}
              />
              <StatCard
                icon={<CalendarDays className="w-4 h-4" />}
                label="Days Held"
                value={stats.totalDaysHeld}
                sub={`${stats.avgPerDay} avg/day`}
              />
              <StatCard
                icon={<TrendingUp className="w-4 h-4" />}
                label="Total Attendances"
                value={stats.totalAttendances}
                sub={stats.presentToday > 0 ? `${stats.presentToday} present today` : 'across all days'}
              />
              <StatCard
                icon={<CreditCard className="w-4 h-4" />}
                label="Paid Rate"
                value={`${stats.paidRate}%`}
                sub={`${stats.paidAttendances} paid · ${stats.unpaidAttendances} unpaid`}
              />
            </div>

            {/* Week navigation bar */}
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => handleWeekChange(weekNum - 1)}
                disabled={loadingWeek || weekNum <= 1}
                className="p-2 rounded-lg border transition-colors disabled:opacity-40"
                style={{
                  border: `1px solid ${colors.border}`,
                  backgroundColor: colors.elevated,
                }}
              >
                <ChevronLeft className="w-4 h-4" style={{ color: colors.textSecondary }} />
              </button>

              <span
                className="text-sm font-semibold min-w-[200px] text-center"
                style={{ color: colors.textPrimary }}
              >
                Week {weekNum} — {formatWeekRange(weekNum)}
              </span>

              <button
                onClick={() => handleWeekChange(weekNum + 1)}
                disabled={loadingWeek || weekNum >= TOTAL_WEEKS}
                className="p-2 rounded-lg border transition-colors disabled:opacity-40"
                style={{
                  border: `1px solid ${colors.border}`,
                  backgroundColor: colors.elevated,
                }}
              >
                <ChevronRight className="w-4 h-4" style={{ color: colors.textSecondary }} />
              </button>

              {viewMode === 'day' && selectedDate && (
                <button
                  onClick={() => { setViewMode('week'); setSelectedDate(null) }}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                  style={{
                    color: colors.mistyForest,
                    border: `1px solid ${colors.accentLight}`,
                    backgroundColor: colors.accentLight,
                  }}
                >
                  ← Week overview
                </button>
              )}

              <div className="relative ml-auto">
                <Search
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
                  style={{ color: colors.textTertiary }}
                />
                <input
                  type="text"
                  placeholder="Search students…"
                  value={attendanceSearch}
                  onChange={(e) => setAttendanceSearch(e.target.value)}
                  className="pl-8 pr-3 py-2 text-sm rounded-lg w-56 transition-colors outline-none"
                  style={{
                    border: `1px solid ${colors.border}`,
                    backgroundColor: colors.elevated,
                    color: colors.textPrimary,
                  }}
                />
              </div>
            </div>

            {/* Sub-header */}
            <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>
              {viewMode === 'week'
                ? `Week ${weekNum} of ${TOTAL_WEEKS}  •  ${totalExpectedThisWeek} unique student${totalExpectedThisWeek !== 1 ? 's' : ''} expected this week`
                : `${dayDetailExpected} expected  •  ${dayDetailPresent} marked present`}
            </p>

            {/* Week view: 5-column grid */}
            {viewMode === 'week' && (
              <div className="grid grid-cols-5 gap-3">
                {loadingWeek
                  ? DAY_LABELS.map((label) => (
                      <div
                        key={label}
                        className="rounded-2xl overflow-hidden"
                        style={{ border: `1px solid ${colors.border}`, backgroundColor: colors.elevated }}
                      >
                        <div
                          className="px-3 py-3 border-b animate-pulse"
                          style={{ borderColor: colors.border, backgroundColor: colors.surface }}
                        >
                          <div className="h-4 rounded w-20 mb-1" style={{ backgroundColor: colors.border }} />
                          <div className="h-3 rounded w-16" style={{ backgroundColor: colors.border }} />
                        </div>
                        <div className="p-3 space-y-2">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="h-10 rounded-lg animate-pulse" style={{ backgroundColor: colors.border }} />
                          ))}
                        </div>
                      </div>
                    ))
                  : weekData.map((day, colIdx) => {
                      const filtered = (attendanceSearch.trim()
                        ? day.students.filter((s) =>
                            s.name?.toLowerCase().includes(attendanceSearch.toLowerCase())
                          )
                        : day.students
                      ).slice().sort((a, b) => {
                        if (a.hasEnrollment !== b.hasEnrollment) return a.hasEnrollment ? -1 : 1
                        return (a.name ?? '').localeCompare(b.name ?? '')
                      })
                      const expectedCount = day.students.filter((s) => s.hasEnrollment).length
                      const presentCount = day.students.filter((s) => s.record !== null).length
                      const isToday = day.date === todayStr

                      return (
                        <div
                          key={day.date}
                          className="rounded-2xl overflow-hidden flex flex-col"
                          style={{
                            border: `1px solid ${colors.border}`,
                            backgroundColor: colors.elevated,
                          }}
                        >
                          {/* Day column header */}
                          <button
                            onClick={() => handleDrillDown(day.date)}
                            className="px-3 py-3 border-b text-left w-full transition-colors"
                            style={{ borderColor: colors.border, backgroundColor: colors.surface }}
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                                {DAY_LABELS[colIdx]}
                              </span>
                              {isToday && (
                                <span
                                  className="text-xs font-medium px-1.5 py-0.5 rounded-full leading-tight"
                                  style={{ color: colors.mistyForest, backgroundColor: colors.accentLight }}
                                >
                                  Today
                                </span>
                              )}
                            </div>
                            <p className="text-xs mt-0.5" style={{ color: colors.textTertiary }}>
                              {formatShortDate(day.date)}
                            </p>
                            <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                              {expectedCount} expected · {presentCount} present
                            </p>
                          </button>

                          {/* Student list */}
                          <div className="flex-1 min-h-0 divide-y overflow-y-auto" style={{ maxHeight: 320, borderColor: colors.border }}>
                            {filtered.length === 0 && (
                              <p
                                className="text-xs text-center py-4 px-2"
                                style={{ color: colors.textTertiary }}
                              >
                                {attendanceSearch.trim() ? 'No match' : 'No students'}
                              </p>
                            )}
                            {filtered.map((row) => {
                              const isSaving = savingIds.has(row.student_id)
                              const isChecked = row.record !== null
                              return (
                                <div
                                  key={row.student_id}
                                  className="flex items-center gap-2 px-2.5 py-2 transition-colors"
                                  style={{ borderColor: colors.border }}
                                >
                                  {row.profile_image_url ? (
                                    <img
                                      src={row.profile_image_url}
                                      alt={row.name ?? ''}
                                      className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                                    />
                                  ) : (
                                    <div
                                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-semibold flex-shrink-0"
                                      style={{ backgroundColor: avatarColor(row.student_id) }}
                                    >
                                      {getInitials(row.name)}
                                    </div>
                                  )}
                                  <p
                                    className="text-xs font-medium truncate flex-1 min-w-0"
                                    style={{ color: colors.textPrimary }}
                                  >
                                    {row.name ?? '—'}
                                  </p>
                                  {row.hasEnrollment ? (
                                    <span
                                      className="text-[10px] font-medium px-1.5 py-0.5 rounded-full whitespace-nowrap flex-shrink-0"
                                      style={{ color: colors.mistyForest, backgroundColor: colors.accentLight }}
                                    >
                                      Paid
                                    </span>
                                  ) : (
                                    <span
                                      className="text-[10px] font-medium px-1.5 py-0.5 rounded-full whitespace-nowrap flex-shrink-0"
                                      style={{ color: colors.textTertiary, backgroundColor: colors.border }}
                                    >
                                      Unpaid
                                    </span>
                                  )}
                                  <div className="flex-shrink-0">
                                    {isSaving ? (
                                      <Loader2
                                        className="w-3.5 h-3.5 animate-spin"
                                        style={{ color: colors.mistyForest }}
                                      />
                                    ) : (
                                      <button
                                        onClick={() => handleToggle(row.student_id, day.date, row)}
                                        className="w-4 h-4 rounded border-2 flex items-center justify-center transition-colors"
                                        style={{
                                          backgroundColor: isChecked ? colors.mistyForest : 'transparent',
                                          borderColor: isChecked ? colors.mistyForest : colors.borderStrong,
                                        }}
                                        aria-label={isChecked ? 'Remove attendance' : 'Mark present'}
                                      >
                                        {isChecked && (
                                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
                                          </svg>
                                        )}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>

                          {/* View all link */}
                          <button
                            onClick={() => handleDrillDown(day.date)}
                            className="px-3 py-2 text-xs border-t text-center transition-colors"
                            style={{
                              color: colors.mistyForest,
                              borderColor: colors.border,
                            }}
                          >
                            View full day →
                          </button>
                        </div>
                      )
                    })}
              </div>
            )}

            {/* Day detail view */}
            {viewMode === 'day' && dayDetail && (
              <div
                className="rounded-2xl overflow-hidden"
                style={{ border: `1px solid ${colors.border}` }}
              >
                {/* Table header */}
                <div
                  className="grid grid-cols-[1fr_120px_100px_110px] gap-4 px-5 py-3 border-b"
                  style={{ borderColor: colors.border, backgroundColor: colors.surface }}
                >
                  {['Student', 'Present', 'Status', 'Paid'].map((col) => (
                    <span
                      key={col}
                      className="text-xs font-semibold uppercase tracking-wide"
                      style={{ color: colors.textTertiary, textAlign: col !== 'Student' ? 'center' : 'left' }}
                    >
                      {col}
                    </span>
                  ))}
                </div>

                {filteredDayStudents.length === 0 && (
                  <div className="px-5 py-12 text-center text-sm" style={{ color: colors.textTertiary }}>
                    {attendanceSearch.trim() ? `No students match "${attendanceSearch}".` : 'No students enrolled for this day.'}
                  </div>
                )}

                {filteredDayStudents.length > 0 && (
                  <div className="divide-y" style={{ borderColor: colors.border }}>
                    {filteredDayStudents.map((row) => {
                      const isSaving = savingIds.has(row.student_id)
                      const isChecked = row.record !== null
                      return (
                        <div
                          key={row.student_id}
                          className="grid grid-cols-[1fr_120px_100px_110px] gap-4 px-5 py-3.5 items-center"
                          style={{ borderColor: colors.border }}
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
                              <p className="text-sm font-medium truncate" style={{ color: colors.textPrimary }}>
                                {row.name ?? '—'}
                              </p>
                              {row.grade && (
                                <p className="text-xs truncate" style={{ color: colors.textSecondary }}>
                                  {row.grade}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Checkbox */}
                          <div className="flex items-center justify-center">
                            {isSaving ? (
                              <Loader2 className="w-4 h-4 animate-spin" style={{ color: colors.mistyForest }} />
                            ) : (
                              <button
                                onClick={() => handleToggle(row.student_id, dayDetail.date, row)}
                                className="w-5 h-5 rounded border-2 flex items-center justify-center transition-colors"
                                style={{
                                  backgroundColor: isChecked ? colors.mistyForest : 'transparent',
                                  borderColor: isChecked ? colors.mistyForest : colors.borderStrong,
                                }}
                                aria-label={isChecked ? 'Remove from attendance' : 'Mark present'}
                              >
                                {isChecked && (
                                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
                                  </svg>
                                )}
                              </button>
                            )}
                          </div>

                          {/* Status */}
                          <div className="flex items-center justify-center">
                            {isSaving ? (
                              <span className="text-xs" style={{ color: colors.textTertiary }}>Saving…</span>
                            ) : isChecked ? (
                              <span
                                className="text-xs font-medium px-2.5 py-1 rounded-full"
                                style={{ color: colors.mistyForest, backgroundColor: colors.accentLight }}
                              >
                                Present
                              </span>
                            ) : (
                              <span className="text-xs" style={{ color: colors.textTertiary }}>—</span>
                            )}
                          </div>

                          {/* Paid */}
                          <div className="flex items-center justify-center">
                            {row.hasEnrollment ? (
                              <span
                                className="text-xs font-medium px-2.5 py-1 rounded-full"
                                style={{ color: colors.mistyForest, backgroundColor: colors.accentLight }}
                              >
                                Paid
                              </span>
                            ) : (
                              <span
                                className="text-xs font-medium px-2.5 py-1 rounded-full"
                                style={{ color: colors.textTertiary, backgroundColor: colors.border }}
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
            )}
          </div>
        )}
      </div>

      <StudentDetailSidebar
        student={studentDetail ?? (selectedStudent as any)}
        loading={detailLoading}
        onClose={() => { setSelectedStudent(null); setStudentDetail(null) }}
      />
    </div>
  )
}
