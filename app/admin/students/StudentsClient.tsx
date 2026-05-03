'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Table, TableRow, TableCell } from '../components/Table'
import { StudentDetailSidebar } from '../components/StudentDetailSidebar'
import { TeacherAssignSidebar } from '../components/TeacherAssignSidebar'
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

interface StudentsClientProps {
  students: Student[]
  fetchStudentDetail: (studentId: string) => Promise<Student>
  assignmentsByStudentId: Record<string, TeacherAssignment[]>
  tagsByStudentId?: Record<string, string[]>
}

export function StudentsClient({ students: initialStudents, fetchStudentDetail, assignmentsByStudentId, tagsByStudentId = {} }: StudentsClientProps) {
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>(initialStudents)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null)
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
      if (!tags.includes(activeTagFilter)) return false
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
      <Table
        headers={['Name', 'Grade', 'DOB', 'Parent', 'Teacher', 'Tags']}
      >
        {filteredStudents.map((student, index) => {
          const dob =
            student.dob_month && student.dob_day && student.dob_year
              ? `${student.dob_month}/${student.dob_day}/${student.dob_year}`
              : '—'
          return (
            <TableRow key={student.id} index={index} onClick={() => handleRowClick(student)}>
              <TableCell>
                <div className="font-medium">{student.child_legal_name ?? '—'}</div>
              </TableCell>
              <TableCell>{student.child_grade ?? '—'}</TableCell>
              <TableCell>{dob}</TableCell>
              <TableCell>{student.parent_name ?? '—'}</TableCell>
              <TableCell>
                {(assignmentsByStudentId[student.id]?.length ?? 0) > 0 ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); setAssignStudent(student) }}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                             color: '#4B6A4F', fontSize: 'inherit', textDecoration: 'underline' }}
                  >
                    {(() => {
                      const assignments = assignmentsByStudentId[student.id]
                      const first = assignments[0]?.teacher_name ?? '—'
                      const remaining = assignments.length - 1
                      return remaining > 0 ? `${first} +${remaining} more` : first
                    })()}
                  </button>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); setAssignStudent(student) }}
                    style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20,
                             border: '1px solid #D1D5DB', color: '#4B6A4F', background: 'white',
                             cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    Assign teacher(s)
                  </button>
                )}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {(tagsByStudentId[student.id] ?? []).length > 0
                    ? (tagsByStudentId[student.id] ?? []).map(tag => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-violet-50 text-violet-700 border border-violet-200"
                        >
                          {tag}
                        </span>
                      ))
                    : <span className="text-gray-300">—</span>
                  }
                </div>
              </TableCell>
            </TableRow>
          )
        })}
      </Table>

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
