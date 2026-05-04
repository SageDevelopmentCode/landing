import { createAdminClient } from '@/app/lib/supabase-server'
import { ProgramClient } from '../ProgramClient'
import { AttendanceProgramClient } from '../AttendanceProgramClient'
import { SummerProgramClient } from '../SummerProgramClient'
import { getAdminAftercareForDate, getAdminFieldFridayForDate, getAttendanceStats, getAdminSummerAttendanceStats } from '@/app/actions/adminAttendance'
import { getSummerStudentsForWeek } from '@/app/actions/summerAttendance'

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
  profile_image_url: string | null
  admin_tags: string[]
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

  if (program === 'aftercare' || program === 'field_friday') {
    const today = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    let initialDate = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`

    if (program === 'aftercare') {
      // Snap to nearest weekday
      const dow = today.getDay()
      if (dow === 6) today.setDate(today.getDate() - 1)
      else if (dow === 0) today.setDate(today.getDate() + 1)
      initialDate = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`
    } else {
      // Snap to nearest upcoming Friday
      const dow = today.getDay()
      if (dow !== 5) {
        const daysUntilFriday = dow === 6 ? 6 : 5 - dow
        today.setDate(today.getDate() + daysUntilFriday)
      }
      initialDate = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`
    }

    const [initialRows, stats] = await Promise.all([
      program === 'aftercare'
        ? getAdminAftercareForDate(initialDate)
        : getAdminFieldFridayForDate(initialDate),
      getAttendanceStats(program),
    ])

    return (
      <AttendanceProgramClient
        program={program}
        initialDate={initialDate}
        initialRows={initialRows}
        stats={stats}
      />
    )
  }

  if (program === 'homeschool_drop_in') {
    const { data: apps } = await client
      .schema('parent_app')
      .from('applications')
      .select('student_id, admin_tags')
      .eq('status', 'enrolled')
      .eq('program', 'homeschool_drop_in')
      .eq('is_active', true)

    const appRows = apps ?? []
    const studentIds = [...new Set(appRows.map((a) => a.student_id).filter(Boolean))]
    const tagsByStudentId = Object.fromEntries(
      appRows.map((a) => [a.student_id, (a.admin_tags as string[] | null) ?? []])
    )

    let unassignedStudents: StudentInfo[] = []

    if (studentIds.length > 0) {
      const { data: students } = await client
        .schema('admin')
        .from('students')
        .select('id, child_legal_name, child_grade, dob_month, dob_day, dob_year, profile_image_url')
        .in('id', studentIds)
        .eq('is_deleted', false)

      unassignedStudents = (students ?? []).map((s) => ({
        ...(s as Omit<StudentInfo, 'admin_tags'>),
        admin_tags: tagsByStudentId[s.id] ?? [],
      }))
    }

    return (
      <ProgramClient
        teacherGroups={[]}
        program={program}
        totalStudentCount={unassignedStudents.length}
        unassignedStudents={unassignedStudents}
        fetchStudentDetail={fetchStudentDetail}
      />
    )
  }

  if (program === 'summer_26') {
    const SUMMER_WEEK1_MONDAY = new Date(2026, 4, 25)
    const TOTAL_WEEKS = 12
    const today = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const diffDays = Math.floor((today.getTime() - SUMMER_WEEK1_MONDAY.getTime()) / 86400000)
    const weekNum = diffDays < 0 ? 1 : Math.min(Math.floor(diffDays / 7) + 1, TOTAL_WEEKS)
    const mondayDate = new Date(SUMMER_WEEK1_MONDAY)
    mondayDate.setDate(mondayDate.getDate() + (weekNum - 1) * 7)
    const weekStartDate = `${mondayDate.getFullYear()}-${pad(mondayDate.getMonth() + 1)}-${pad(mondayDate.getDate())}`

    const [{ data: assignments }, initialWeekData, stats] = await Promise.all([
      client
        .schema('teachers')
        .from('teacher_students')
        .select('teacher_id, student_id, classroom')
        .eq('program', 'summer_26')
        .eq('is_deleted', false),
      getSummerStudentsForWeek(weekStartDate),
      getAdminSummerAttendanceStats(),
    ])

    const rows = assignments ?? []

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

    const studentIds = [...new Set(rows.map((r) => r.student_id).filter(Boolean))]
    let studentMap: Record<string, StudentInfo> = {}

    if (studentIds.length > 0) {
      const [{ data: students }, { data: appRows }] = await Promise.all([
        client
          .schema('admin')
          .from('students')
          .select('id, child_legal_name, child_grade, dob_month, dob_day, dob_year, profile_image_url')
          .in('id', studentIds)
          .eq('is_deleted', false),
        client
          .schema('parent_app')
          .from('applications')
          .select('student_id, admin_tags')
          .in('student_id', studentIds)
          .eq('is_active', true),
      ])

      const tagsByStudentId = Object.fromEntries(
        (appRows ?? []).map((a) => [a.student_id, (a.admin_tags as string[] | null) ?? []])
      )

      studentMap = Object.fromEntries(
        (students ?? []).map((s) => [
          s.id,
          {
            ...(s as Omit<StudentInfo, 'admin_tags'>),
            admin_tags: tagsByStudentId[s.id] ?? [],
          },
        ])
      )
    }

    const groupMap = new Map<string, TeacherGroup>()
    for (const row of rows) {
      if (!row.teacher_id) continue
      const teacher = teacherMap[row.teacher_id]
      if (!teacher) continue
      if (!groupMap.has(row.teacher_id)) {
        groupMap.set(row.teacher_id, { teacher, classroom: row.classroom ?? null, students: [] })
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
      <SummerProgramClient
        teacherGroups={teacherGroups}
        totalStudentCount={totalStudentCount}
        fetchStudentDetail={fetchStudentDetail}
        initialWeekData={initialWeekData}
        initialWeekNum={weekNum}
        stats={stats}
      />
    )
  }

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

  // 3. Fetch students + their application tags
  const studentIds = [...new Set(rows.map((r) => r.student_id).filter(Boolean))]
  let studentMap: Record<string, StudentInfo> = {}

  if (studentIds.length > 0) {
    const [{ data: students }, { data: appRows }] = await Promise.all([
      client
        .schema('admin')
        .from('students')
        .select('id, child_legal_name, child_grade, dob_month, dob_day, dob_year, profile_image_url')
        .in('id', studentIds)
        .eq('is_deleted', false),
      client
        .schema('parent_app')
        .from('applications')
        .select('student_id, admin_tags')
        .in('student_id', studentIds)
        .eq('is_active', true),
    ])

    const tagsByStudentId = Object.fromEntries(
      (appRows ?? []).map((a) => [a.student_id, (a.admin_tags as string[] | null) ?? []])
    )

    studentMap = Object.fromEntries(
      (students ?? []).map((s) => [
        s.id,
        {
          ...(s as Omit<StudentInfo, 'admin_tags'>),
          admin_tags: tagsByStudentId[s.id] ?? [],
        },
      ])
    )
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
