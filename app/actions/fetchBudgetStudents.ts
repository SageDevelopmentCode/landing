'use server'
import { createAdminClient } from '@/app/lib/supabase-server'

export async function fetchBudgetStudents() {
  const { data, error } = await createAdminClient()
    .schema('admin')
    .from('students')
    .select('id, child_legal_name')
    .eq('is_deleted', false)
    .order('child_legal_name')
  if (error) return []
  return data ?? []
}
