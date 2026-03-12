'use server'
import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'

export async function getStudentDetail(studentId: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const adminClient = createAdminClient()
  const { data: roleRow } = await adminClient
    .schema('admin').from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  if (roleRow?.role !== 'super_admin') return null

  const { data } = await adminClient.schema('admin').from('students')
    .select('*')
    .eq('id', studentId)
    .single()
  return data ?? null
}
