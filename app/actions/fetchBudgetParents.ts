'use server'
import { createAdminClient } from '@/app/lib/supabase-server'

export async function fetchBudgetParents() {
  const { data, error } = await createAdminClient()
    .schema('admin')
    .from('users')
    .select('id, full_name, email, g1_cell_phone')
    .eq('is_deleted', false)
    .order('full_name')
  if (error) return []
  return data ?? []
}
