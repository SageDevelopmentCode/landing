'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { StudentDetailSidebar } from '../components/StudentDetailSidebar'
import { TeacherAssignSidebar } from '../components/TeacherAssignSidebar'
import { cssColors as colors } from '../design-system'
import type { TeacherAssignment } from '../../actions/teacherAssignments'

type Student = {
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
  profile_image_url?: string | null
}

const PROGRAM_LABELS: Record<string, string> = {
  summer_26: 'Summer 2026',
  school_year_26_27: 'School Year 2026–2027',
  both: 'Both',
  homeschool_drop_in: 'Homeschool Drop-In',
}

function formatProgram(value: string | null): string {
  if (!value) return '—'
  return PROGRAM_LABELS[value] ?? value
}

interface StudentsClientProps {
  students: Student[]
  fetchStudentDetail: (studentId: string) => Promise<Student>
  assignmentsByStudentId: Record<string, TeacherAssignment[]>
  tagsByStudentId?: Record<string, string[]>
  programByStudentId?: Record<string, { program: string | null; drop_in_program: string | null }>
}

const HEADERS = ['Name', 'Grade', 'Program', 'DOB', 'Parent', 'Teacher', 'Tags']
const COLS = 'grid-cols-[2fr_0.6fr_1.5fr_0.9fr_1.2fr_1.2fr_1fr]'

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

export function StudentsClient({ students: initialStudents, fetchStudentDetail, assignmentsByStudentId, tagsByStudentId = {}, programByStudentId = {} }: StudentsClientProps) {
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>(initialStudents)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>("Don't Include")
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [studentDetail, setStudentDetail] = useState<Student | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [assignStudent, setAssignStudent] = useState<Student | null>(null)

  const allTags = [...new Set(Object.values(tagsByStudentId).flat())].sort()

  const handleRowClick = async (student: Student) => {
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

  const handleClose = () => {
    setSelectedStudent(null)
    setStudentDetail(null)
  }

  const handleStudentDeleted = (id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id))
  }

  const handleAssigned = () => {
    router.refresh()
  }

  const filteredStudents = students.filter((s) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const matchesSearch =
        s.child_legal_name?.toLowerCase().includes(q) ||
        s.child_grade?.toLowerCase().includes(q) ||
        s.parent_name?.toLowerCase().includes(q)
      if (!matchesSearch) return false
    }
    if (activeTagFilter) {
      const tags = tagsByStudentId[s.id] ?? []
      if (activeTagFilter === "Don't Include") {
        if (tags.includes(activeTagFilter)) return false
      } else if (!tags.includes(activeTagFilter)) return false
    }
    return true
  })

  return (
    <>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-1.5 p-1 rounded-xl w-fit" style={{ backgroundColor: '#F5F0E8', border: '1px solid #E8E0D0' }}>
          <svg className="ml-1.5 w-3.5 h-3.5 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pr-2 py-0.5 text-xs font-semibold bg-transparent border-none outline-none w-40 placeholder:font-normal text-gray-500"
          />
        </div>
        {allTags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setActiveTagFilter(activeTagFilter === tag ? null : tag)}
                className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full border transition-colors"
                style={activeTagFilter === tag
                  ? { backgroundColor: '#7c3aed', color: '#fff', borderColor: '#7c3aed' }
                  : { backgroundColor: '#f5f3ff', color: '#6d28d9', borderColor: '#ddd6fe' }
                }
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Column header row */}
      <div
        className={`grid ${COLS} gap-4 px-2 py-2`}
        style={{ borderBottom: `1px solid ${colors.border}` }}
      >
        {HEADERS.map((h) => (
          <span
            key={h}
            className="text-[11px] font-semibold uppercase tracking-wide"
            style={{ color: colors.textTertiary }}
          >
            {h}
          </span>
        ))}
      </div>

      {/* Rows */}
      <div className="divide-y" style={{ borderColor: colors.border }}>
        {filteredStudents.length === 0 && (
          <div className="px-2 py-12 text-center text-sm" style={{ color: colors.textTertiary }}>
            No students found.
          </div>
        )}
        {filteredStudents.map((student) => {
          const dob =
            student.dob_month && student.dob_day && student.dob_year
              ? `${student.dob_month}/${student.dob_day}/${student.dob_year}`
              : '—'
          const p = programByStudentId[student.id]
          const assignments = assignmentsByStudentId[student.id]
          const tags = tagsByStudentId[student.id] ?? []

          return (
            <div
              key={student.id}
              onClick={() => handleRowClick(student)}
              className={`grid ${COLS} gap-4 px-2 py-2.5 cursor-pointer transition-colors duration-100 hover:bg-[var(--admin-elevated)] items-center`}
              style={{ borderColor: colors.border }}
            >
              {/* Name + avatar */}
              <div className="flex items-center gap-2.5 min-w-0">
                {student.profile_image_url ? (
                  <img
                    src={student.profile_image_url}
                    alt={student.child_legal_name ?? 'Student'}
                    className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                    style={{ backgroundColor: avatarColor(student.id) }}
                  >
                    {getInitials(student.child_legal_name)}
                  </div>
                )}
                <span className="text-xs font-medium truncate" style={{ color: colors.textPrimary }}>
                  {student.child_legal_name ?? '—'}
                </span>
              </div>

              {/* Grade */}
              <span className="text-xs truncate" style={{ color: colors.textSecondary }}>
                {student.child_grade ?? '—'}
              </span>

              {/* Program */}
              <div className="text-xs min-w-0" style={{ color: colors.textSecondary }}>
                {!p?.program ? (
                  <span style={{ color: colors.textTertiary }}>—</span>
                ) : p.program === 'homeschool_drop_in' && p.drop_in_program ? (
                  <div>
                    <div className="truncate">{formatProgram(p.program)}</div>
                    <div className="truncate" style={{ color: colors.textTertiary, fontSize: 11 }}>{formatProgram(p.drop_in_program)}</div>
                  </div>
                ) : (
                  <span className="truncate">{formatProgram(p.program)}</span>
                )}
              </div>

              {/* DOB */}
              <span className="text-xs truncate" style={{ color: colors.textSecondary }}>
                {dob}
              </span>

              {/* Parent */}
              <span className="text-xs truncate" style={{ color: colors.textSecondary }}>
                {student.parent_name ?? '—'}
              </span>

              {/* Teacher */}
              <div className="text-xs min-w-0">
                {(assignments?.length ?? 0) > 0 ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); setAssignStudent(student) }}
                    className="text-xs truncate text-left underline"
                    style={{ color: colors.accent, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                  >
                    {(() => {
                      const first = assignments[0]?.teacher_name ?? '—'
                      const remaining = assignments.length - 1
                      return remaining > 0 ? `${first} +${remaining} more` : first
                    })()}
                  </button>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); setAssignStudent(student) }}
                    className="text-xs whitespace-nowrap"
                    style={{
                      padding: '3px 10px',
                      borderRadius: 20,
                      border: `1px solid ${colors.border}`,
                      color: colors.accent,
                      background: colors.surface,
                      cursor: 'pointer',
                    }}
                  >
                    Assign teacher(s)
                  </button>
                )}
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1" onClick={(e) => e.stopPropagation()}>
                {tags.length > 0 ? (
                  tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-violet-50 text-violet-700 border border-violet-200"
                    >
                      {tag}
                    </span>
                  ))
                ) : (
                  <span style={{ color: colors.textTertiary }}>—</span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <StudentDetailSidebar
        student={studentDetail ?? selectedStudent}
        loading={detailLoading}
        onClose={handleClose}
        onStudentDeleted={handleStudentDeleted}
      />

      <TeacherAssignSidebar
        student={assignStudent}
        onClose={() => setAssignStudent(null)}
        onAssigned={handleAssigned}
      />
    </>
  )
}
