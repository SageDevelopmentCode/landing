'use server'

import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'

export type CheckInRecord = {
  id: string
  checked_in_at: string
  checked_out_at: string | null
  checked_in_by: string
  notes: string | null
}

export async function getStudentAttendance(studentId: string): Promise<CheckInRecord[]> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const adminClient = createAdminClient()

  const { data: assignment } = await adminClient
    .schema('teachers')
    .from('teacher_students')
    .select('id')
    .eq('teacher_id', user.id)
    .eq('student_id', studentId)
    .eq('is_deleted', false)
    .limit(1)
    .maybeSingle()

  if (!assignment) return []

  const { data, error } = await adminClient
    .schema('attendance')
    .from('check_ins')
    .select('id, checked_in_at, checked_out_at, checked_in_by, notes')
    .eq('student_id', studentId)
    .eq('is_deleted', false)
    .order('checked_in_at', { ascending: false })

  if (error) return []

  return data ?? []
}
