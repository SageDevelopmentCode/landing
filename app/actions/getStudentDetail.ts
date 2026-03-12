'use server'
import { createAdminClient } from '@/app/lib/supabase-server'

export async function getStudentDetail(studentId: string) {
  const client = createAdminClient()
  const { data } = await client.schema('admin').from('students')
    .select('*')
    .eq('id', studentId)
    .single()
  return data ?? null
}
