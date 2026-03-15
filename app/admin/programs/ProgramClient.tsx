'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Merriweather } from 'next/font/google'
import { colors, shadows, radius } from '../design-system'
import { StudentDetailSidebar } from '../components/StudentDetailSidebar'

const merriweather = Merriweather({
  weight: ['300', '400', '700', '900'],
  subsets: ['latin'],
})

const PROGRAM_LABELS: Record<string, string> = {
  summer_26: 'Summer 2026',
  school_year_26_27: 'School Year 2026–2027',
}

const CLASSROOM_LABELS: Record<string, string> = {
  prek_1st: 'Pre-K / 1st',
  '2nd_4th': '2nd – 4th',
}

type StudentInfo = {
  id: string
  child_legal_name: string | null
  child_grade: string | null
  dob_month: string | null
  dob_day: string | null
  dob_year: string | null
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

interface ProgramClientProps {
  teacherGroups: TeacherGroup[]
  program: string
  totalStudentCount: number
  fetchStudentDetail: (studentId: string) => Promise<FullStudent>
}

function getInitials(name: string | null): string {
  if (!name) return '?'
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}

function formatDob(
  month: string | null,
  day: string | null,
  year: string | null
): string {
  if (!month && !day && !year) return '—'
  return [month, day, year].filter(Boolean).join('/')
}

const SUB_NAV = [
  { label: 'Summer 2026', href: '/admin/programs/summer_26' },
  { label: 'School Year 2026–2027', href: '/admin/programs/school_year_26_27' },
]

export function ProgramClient({
  teacherGroups,
  program,
  totalStudentCount,
  fetchStudentDetail,
}: ProgramClientProps) {
  const pathname = usePathname()
  const programLabel = PROGRAM_LABELS[program] ?? program

  const [activeTeacherId, setActiveTeacherId] = useState<string | null>(
    teacherGroups[0]?.teacher.id ?? null
  )
  const [selectedStudent, setSelectedStudent] = useState<StudentInfo | null>(null)
  const [studentDetail, setStudentDetail] = useState<FullStudent | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    setActiveTeacherId(teacherGroups[0]?.teacher.id ?? null)
  }, [program])

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
      <div className="flex-1 px-8 py-6">
        {/* Page header */}
        <div className="mb-6">
          <h1
            className={`text-2xl font-bold ${merriweather.className}`}
            style={{ color: colors.mistyForest }}
          >
            {programLabel}
          </h1>
          <p className="mt-1 text-sm" style={{ color: colors.textSecondary }}>
            {totalStudentCount} student{totalStudentCount !== 1 ? 's' : ''} assigned
          </p>
        </div>

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
                    {/* Mini avatar */}
                    <div
                      className="flex items-center justify-center shrink-0 text-xs font-bold"
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
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
                {/* Student grid */}
                {activeGroup.students.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {activeGroup.students.map((student) => (
                      <div
                        key={student.id}
                        onClick={() => handleStudentClick(student)}
                        className="flex flex-col items-center p-4 text-center"
                        style={{
                          backgroundColor: 'white',
                          border: `1px solid ${colors.border}`,
                          borderRadius: radius.md,
                          boxShadow: shadows.soft,
                          cursor: 'pointer',
                        }}
                      >
                        <div
                          className="flex items-center justify-center mb-2 text-sm font-bold"
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            backgroundColor: colors.warmLinen,
                            color: colors.mistyForest,
                            border: `1px solid ${colors.border}`,
                          }}
                        >
                          {getInitials(student.child_legal_name)}
                        </div>
                        <p
                          className="text-sm font-semibold leading-tight truncate w-full"
                          style={{ color: colors.textPrimary }}
                        >
                          {student.child_legal_name ?? '—'}
                        </p>
                        {student.child_grade && (
                          <p className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>
                            Grade {student.child_grade}
                          </p>
                        )}
                        <p className="text-xs mt-0.5" style={{ color: colors.textTertiary }}>
                          {formatDob(student.dob_month, student.dob_day, student.dob_year)}
                        </p>
                      </div>
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
      </div>
      <StudentDetailSidebar
        student={studentDetail ?? (selectedStudent as any)}
        loading={detailLoading}
        onClose={() => { setSelectedStudent(null); setStudentDetail(null) }}
      />
    </div>
  )
}
