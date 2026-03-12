'use server'
import { createAdminClient } from '@/app/lib/supabase-server'

export async function getParentDetail(parentId: string) {
  const client = createAdminClient()

  const [parentRes, childrenRes, appsRes] = await Promise.all([
    client.schema('admin').from('users')
      .select('id, full_name, g1_cell_phone, g1_work_phone, g1_preferred_contact, g1_lives_with_child, g1_has_custody, g2_full_name, g2_relationship, g2_email, g2_cell_phone, g2_work_phone')
      .eq('id', parentId).single(),
    client.schema('admin').from('students')
      .select('id, child_legal_name, dob_month, dob_day, dob_year')
      .eq('parent_id', parentId),
    client.schema('parent_app').from('applications')
      .select('id, child_legal_name, program, status, approved, approved_at, updated_at')
      .eq('user_id', parentId),
  ])

  return {
    parent: parentRes.data ?? null,
    children: childrenRes.data ?? [],
    applications: appsRes.data ?? [],
  }
}
