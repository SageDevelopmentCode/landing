'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Poppins } from 'next/font/google'
import { cssColors as colors, cssShadows as shadows, radius } from '../design-system'
import { StudentDetailSidebar } from '../components/StudentDetailSidebar'
import { PRESET_TAGS } from '../constants/applicationTags'

const merriweather = Poppins({
  weight: ['300', '400', '700', '900'],
  subsets: ['latin'],
})

const PROGRAM_LABELS: Record<string, string> = {
  summer_26: 'Summer 2026',
  school_year_26_27: 'School Year 2026–2027',
  homeschool_drop_in: 'Homeschool Drop-In',
  aftercare: 'Aftercare Extended Learning',
  field_friday: 'Field Fun Fridays',
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

interface ProgramClientProps {
  teacherGroups: TeacherGroup[]
  program: string
  totalStudentCount: number
  unassignedStudents?: StudentInfo[]
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

function StudentAvatar({ name, imageUrl }: { name: string | null; imageUrl: string | null }) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name ?? 'Student'}
        className="mb-2 object-cover"
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          border: `1px solid ${colors.border}`,
          flexShrink: 0,
        }}
      />
    )
  }
  return (
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
      {getInitials(name)}
    </div>
  )
}

function StudentCard({
  student,
  onClick,
}: {
  student: StudentInfo
  onClick: (student: StudentInfo) => void
}) {
  return (
    <div
      onClick={() => onClick(student)}
      className="flex flex-col items-center p-4 text-center"
      style={{
        backgroundColor: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: radius.md,
        boxShadow: shadows.soft,
        cursor: 'pointer',
      }}
    >
      <StudentAvatar name={student.child_legal_name} imageUrl={student.profile_image_url} />
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
      {student.admin_tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2 justify-center">
          {student.admin_tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded-full"
              style={{ backgroundColor: colors.accentLight, color: colors.accent, border: `1px solid ${colors.accentLight}` }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function toSidebarStudent(student: StudentInfo): FullStudent {
  return {
    id: student.id,
    parent_id: '',
    child_legal_name: student.child_legal_name,
    dob_month: student.dob_month,
    dob_day: student.dob_day,
    dob_year: student.dob_year,
    special_interests: null,
    has_medical_conditions: null,
    medical_conditions_description: null,
    has_allergies: null,
    allergies_description: null,
    has_emergency_medications: null,
    emergency_medications_description: null,
    history_flags: null,
    history_explanation: null,
    needs_aide: null,
    needs_aide_description: null,
    learning_style: null,
    strengths_interests: null,
    current_challenges: null,
    dysregulation_response: null,
    regulation_strategies: null,
    activities_to_avoid: null,
    child_grade: student.child_grade,
  }
}

const SUB_NAV = [
  { label: 'Summer 2026', href: '/admin/programs/summer_26' },
  { label: 'School Year 2026–2027', href: '/admin/programs/school_year_26_27' },
  { label: 'Homeschool Drop-In', href: '/admin/programs/homeschool_drop_in' },
  { label: 'Aftercare', href: '/admin/programs/aftercare' },
  { label: 'Field Fun Fridays', href: '/admin/programs/field_friday' },
]

export function ProgramClient({
  teacherGroups,
  program,
  totalStudentCount,
  unassignedStudents,
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
  const [excludedTags, setExcludedTags] = useState<Set<string>>(new Set(["Don't Include"]))

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

  const visibleUnassigned = unassignedStudents ? filterStudents(unassignedStudents) : undefined
  const visibleActiveStudents = activeGroup ? filterStudents(activeGroup.students) : []

  const allStudentsForProgram = unassignedStudents
    ? unassignedStudents
    : teacherGroups.flatMap((g) => g.students)
  const hasAnyTags = allStudentsForProgram.some((s) => s.admin_tags.length > 0)

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
        <div className="mb-4">
          <h1
            className={`text-2xl font-bold ${merriweather.className}`}
            style={{ color: colors.mistyForest }}
          >
            {programLabel}
          </h1>
          <p className="mt-1 text-sm" style={{ color: colors.textSecondary }}>
            {totalStudentCount} student{totalStudentCount !== 1 ? 's' : ''} enrolled
          </p>
        </div>

        {/* Tag exclusion filter — only shown when students have tags */}
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
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full border transition-colors"
                  style={excluded
                    ? { backgroundColor: 'rgba(220,38,38,0.08)', color: '#DC2626', borderColor: 'rgba(220,38,38,0.25)', textDecoration: 'line-through', opacity: 0.7 }
                    : { backgroundColor: colors.elevated, color: colors.textSecondary, borderColor: colors.border }}
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

        {visibleUnassigned && visibleUnassigned.length > 0 ? (
          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}
          >
            {visibleUnassigned.map((student) => (
              <div
                key={student.id}
                className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-150"
                style={{
                  backgroundColor: colors.surface,
                  border: `1px solid ${colors.warmLinen}`,
                }}
                onClick={() => handleStudentClick(student)}
              >
                {student.profile_image_url ? (
                  <img
                    src={student.profile_image_url}
                    alt={student.child_legal_name ?? 'Student'}
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: colors.warmLinen, color: colors.mistyForest }}
                  >
                    {getInitials(student.child_legal_name)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: colors.textPrimary }}>
                    {student.child_legal_name ?? '—'}
                  </p>
                  {student.child_grade && (
                    <p className="text-xs" style={{ color: colors.textTertiary }}>{student.child_grade}</p>
                  )}
                  {student.admin_tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {student.admin_tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-semibold rounded-full"
                          style={{ backgroundColor: colors.accentLight, color: colors.accent }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : visibleUnassigned && visibleUnassigned.length === 0 && unassignedStudents && unassignedStudents.length > 0 ? (
          <div className="flex flex-col items-center justify-center py-24" style={{ color: colors.textTertiary }}>
            <p className="text-base">All students are hidden by the current tag filter.</p>
          </div>
        ) : teacherGroups.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-24"
            style={{ color: colors.textTertiary }}
          >
            <p className="text-base">No assignments for this program yet.</p>
          </div>
        ) : (
          <>
            {/* Teacher tab bar */}
            <div className="flex gap-2 flex-wrap mb-5">
              {teacherGroups.map((group) => {
                const isActive = group.teacher.id === activeTeacherId
                return (
                  <button
                    key={group.teacher.id}
                    onClick={() => setActiveTeacherId(group.teacher.id)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-150"
                    style={{
                      backgroundColor: isActive ? colors.mistyForest : colors.warmLinen,
                      color: isActive ? 'white' : colors.textSecondary,
                    }}
                  >
                    <div
                      className="flex items-center justify-center shrink-0 text-xs font-bold"
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : colors.pastelSage,
                        color: isActive ? 'white' : colors.mistyForest,
                      }}
                    >
                      {getInitials(group.teacher.full_name)}
                    </div>
                    {group.teacher.full_name ?? '—'}
                    {group.classroom && (
                      <span
                        className="text-xs font-medium px-1.5 py-0.5 rounded-full"
                        style={{
                          backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : colors.pastelSage,
                          color: isActive ? 'white' : colors.mistyForest,
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
                  <div
                    className="grid gap-3"
                    style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}
                  >
                    {visibleActiveStudents.map((student) => (
                      <div
                        key={student.id}
                        className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-150"
                        style={{
                          backgroundColor: colors.surface,
                          border: `1px solid ${colors.warmLinen}`,
                        }}
                        onClick={() => handleStudentClick(student)}
                      >
                        {student.profile_image_url ? (
                          <img
                            src={student.profile_image_url}
                            alt={student.child_legal_name ?? 'Student'}
                            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                            style={{ backgroundColor: colors.warmLinen, color: colors.mistyForest }}
                          >
                            {getInitials(student.child_legal_name)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: colors.textPrimary }}>
                            {student.child_legal_name ?? '—'}
                          </p>
                          {student.child_grade && (
                            <p className="text-xs" style={{ color: colors.textTertiary }}>{student.child_grade}</p>
                          )}
                          {student.admin_tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {student.admin_tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-semibold rounded-full"
                                  style={{ backgroundColor: colors.accentLight, color: colors.accent }}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
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
        key={(studentDetail ?? selectedStudent)?.id ?? 'none'}
        student={studentDetail ?? (selectedStudent ? toSidebarStudent(selectedStudent) : null)}
        loading={detailLoading}
        onClose={() => { setSelectedStudent(null); setStudentDetail(null) }}
      />
    </div>
  )
}
