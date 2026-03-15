import { createAdminClient } from '@/app/lib/supabase-server'
import { ProgramClient } from '../ProgramClient'

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

async function fetchStudentDetail(studentId: string): Promise<FullStudent> {
  'use server'
  const client = createAdminClient()
  const { data: student } = await client.schema('admin').from('students').select('*').eq('id', studentId).single()
  if (!student) throw new Error('Student not found')
  const { data: parent } = await client.schema('admin').from('users').select('full_name').eq('id', student.parent_id).single()
  return { ...(student as FullStudent), parent_name: parent?.full_name ?? null }
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

export default async function ProgramPage({
  params,
}: {
  params: Promise<{ program: string }>
}) {
  const { program } = await params
  const client = createAdminClient()

  // 1. Fetch assignments for this program
  const { data: assignments } = await client
    .schema('teachers')
    .from('teacher_students')
    .select('teacher_id, student_id, classroom')
    .eq('program', program)
    .eq('is_deleted', false)

  const rows = assignments ?? []

  // 2. Fetch teachers
  const teacherIds = [...new Set(rows.map((r) => r.teacher_id).filter(Boolean))]
  let teacherMap: Record<string, { id: string; full_name: string | null; role: string | null }> = {}

  if (teacherIds.length > 0) {
    const { data: teachers } = await client
      .schema('admin')
      .from('users')
      .select('id, full_name, role')
      .in('id', teacherIds)

    if (teachers) {
      teacherMap = Object.fromEntries(teachers.map((t) => [t.id, t]))
    }
  }

  // 3. Fetch students
  const studentIds = [...new Set(rows.map((r) => r.student_id).filter(Boolean))]
  let studentMap: Record<string, StudentInfo> = {}

  if (studentIds.length > 0) {
    const { data: students } = await client
      .schema('admin')
      .from('students')
      .select('id, child_legal_name, child_grade, dob_month, dob_day, dob_year')
      .in('id', studentIds)
      .eq('is_deleted', false)

    if (students) {
      studentMap = Object.fromEntries(students.map((s) => [s.id, s]))
    }
  }

  // 4. Build teacher groups
  const groupMap = new Map<string, TeacherGroup>()

  for (const row of rows) {
    if (!row.teacher_id) continue
    const teacher = teacherMap[row.teacher_id]
    if (!teacher) continue

    if (!groupMap.has(row.teacher_id)) {
      groupMap.set(row.teacher_id, {
        teacher,
        classroom: row.classroom ?? null,
        students: [],
      })
    }

    const student = studentMap[row.student_id]
    if (student) {
      const group = groupMap.get(row.teacher_id)!
      if (!group.students.find((s) => s.id === student.id)) {
        group.students.push(student)
      }
    }
  }

  const teacherGroups: TeacherGroup[] = [...groupMap.values()]
  const totalStudentCount = [...new Set(rows.map((r) => r.student_id).filter(Boolean))].length

  return (
    <ProgramClient
      teacherGroups={teacherGroups}
      program={program}
      totalStudentCount={totalStudentCount}
      fetchStudentDetail={fetchStudentDetail}
    />
  )
}
