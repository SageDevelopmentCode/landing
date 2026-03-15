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
}

interface StudentsClientProps {
  students: Student[]
  fetchStudentDetail: (studentId: string) => Promise<Student>
  assignmentsByStudentId: Record<string, TeacherAssignment[]>
}

export function StudentsClient({ students: initialStudents, fetchStudentDetail, assignmentsByStudentId }: StudentsClientProps) {
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>(initialStudents)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [studentDetail, setStudentDetail] = useState<Student | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [assignStudent, setAssignStudent] = useState<Student | null>(null)

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

  return (
    <>
      <Table
        headers={['Name', 'Grade', 'DOB', 'Parent', 'Teacher']}
      >
        {students.map((student, index) => {
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
