'use server'

import { createAdminClient } from '@/app/lib/supabase-server'

export type TeacherAssignment = {
  id: string
  teacher_id: string
  teacher_name: string | null
  program: string
  classroom: string | null
}

export async function getTeachersForAssignment(): Promise<{ id: string; full_name: string | null; role: string | null }[]> {
  const client = createAdminClient()
  const { data, error } = await client
    .schema('admin')
    .from('users')
    .select('id, full_name, role')
    .in('role', ['teacher', 'super_admin'])
    .eq('is_deleted', false)

  if (error) {
    console.error('Error fetching teachers:', error)
    return []
  }

  return data ?? []
}

export async function getStudentAssignments(studentId: string): Promise<TeacherAssignment[]> {
  const client = createAdminClient()

  const { data: rows, error } = await client
    .schema('teachers')
    .from('teacher_students')
    .select('id, teacher_id, program, classroom')
    .eq('student_id', studentId)
    .eq('is_deleted', false)

  if (error) {
    console.error('Error fetching student assignments:', error)
    return []
  }

  if (!rows || rows.length === 0) return []

  const teacherIds = [...new Set(rows.map((r) => r.teacher_id))]
  const { data: teachers } = await client
    .schema('admin')
    .from('users')
    .select('id, full_name')
    .in('id', teacherIds)

  const teacherMap = new Map((teachers ?? []).map((t) => [t.id, t.full_name]))

  return rows.map((r) => ({
    id: r.id,
    teacher_id: r.teacher_id,
    teacher_name: teacherMap.get(r.teacher_id) ?? null,
    program: r.program,
    classroom: r.classroom,
  }))
}

export async function assignTeacher({
  teacherId,
  studentId,
  program,
  classroom,
}: {
  teacherId: string
  studentId: string
  program: string
  classroom: string | null
}): Promise<{ error?: string }> {
  const client = createAdminClient()

  // Check for any existing row (including soft-deleted) to avoid unique constraint violation
  const { data: existing } = await client
    .schema('teachers')
    .from('teacher_students')
    .select('id')
    .eq('teacher_id', teacherId)
    .eq('student_id', studentId)
    .eq('program', program)
    .maybeSingle()

  if (existing) {
    // Reactivate the soft-deleted row (or no-op if already active)
    const { error } = await client
      .schema('teachers')
      .from('teacher_students')
      .update({ is_deleted: false, classroom })
      .eq('id', existing.id)
    if (error) {
      console.error('Error reactivating assignment:', error)
      return { error: error.message }
    }
    return {}
  }

  // No existing row — fresh insert
  const { error } = await client
    .schema('teachers')
    .from('teacher_students')
    .insert({ teacher_id: teacherId, student_id: studentId, program, classroom })

  if (error) {
    console.error('Error assigning teacher:', error)
    return { error: error.message }
  }

  return {}
}

export async function removeAssignment(assignmentId: string): Promise<{ error?: string }> {
  const client = createAdminClient()
  const { error } = await client
    .schema('teachers')
    .from('teacher_students')
    .update({ is_deleted: true })
    .eq('id', assignmentId)

  if (error) {
    console.error('Error removing assignment:', error)
    return { error: error.message }
  }

  return {}
}

export async function getAllStudentAssignments(): Promise<Record<string, TeacherAssignment[]>> {
  const client = createAdminClient()

  const { data: rows, error } = await client
    .schema('teachers')
    .from('teacher_students')
    .select('id, teacher_id, student_id, program, classroom')
    .eq('is_deleted', false)

  if (error || !rows || rows.length === 0) return {}

  const teacherIds = [...new Set(rows.map((r) => r.teacher_id))]
  const { data: teachers } = await client
    .schema('admin')
    .from('users')
    .select('id, full_name')
    .in('id', teacherIds)

  const teacherMap = new Map((teachers ?? []).map((t) => [t.id, t.full_name]))

  const result: Record<string, TeacherAssignment[]> = {}
  for (const r of rows) {
    if (!result[r.student_id]) result[r.student_id] = []
    result[r.student_id].push({
      id: r.id,
      teacher_id: r.teacher_id,
      teacher_name: teacherMap.get(r.teacher_id) ?? null,
      program: r.program,
      classroom: r.classroom,
    })
  }
  return result
}
