'use server'

import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'

export type ParentCheckInRecord = {
  id: string
  checked_in_at: string
  checked_out_at: string | null
  notes: string | null
}

export async function getParentStudentAttendance(studentId: string): Promise<ParentCheckInRecord[]> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const adminClient = createAdminClient()

  const { data: student } = await adminClient
    .schema('admin')
    .from('students')
    .select('id')
    .eq('id', studentId)
    .eq('parent_id', user.id)
    .eq('is_deleted', false)
    .limit(1)
    .maybeSingle()

  if (!student) return []

  const { data, error } = await adminClient
    .schema('attendance')
    .from('check_ins')
    .select('id, checked_in_at, checked_out_at, notes')
    .eq('student_id', studentId)
    .eq('is_deleted', false)
    .order('checked_in_at', { ascending: false })

  if (error) return []
  return data ?? []
}
