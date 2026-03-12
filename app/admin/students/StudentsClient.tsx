'use client'

import { useState } from 'react'
import { Table, TableRow, TableCell } from '../components/Table'
import { StudentDetailSidebar } from '../components/StudentDetailSidebar'

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
  parent_name?: string | null
}

interface StudentsClientProps {
  students: Student[]
  fetchStudentDetail: (studentId: string) => Promise<Student>
}

export function StudentsClient({ students: initialStudents, fetchStudentDetail }: StudentsClientProps) {
  const [students, setStudents] = useState<Student[]>(initialStudents)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [studentDetail, setStudentDetail] = useState<Student | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

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

  return (
    <>
      <Table
        headers={['Name', 'DOB', 'Parent', 'Medical', 'Allergies', 'Needs Aide']}
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
              <TableCell>{dob}</TableCell>
              <TableCell>{student.parent_name ?? '—'}</TableCell>
              <TableCell>{student.has_medical_conditions ?? '—'}</TableCell>
              <TableCell>{student.has_allergies ?? '—'}</TableCell>
              <TableCell>{student.needs_aide ?? '—'}</TableCell>
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
    </>
  )
}
