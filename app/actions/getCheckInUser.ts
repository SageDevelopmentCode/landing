'use server'

import { createAdminClient } from '@/app/lib/supabase-server'

export type CheckInUser = {
  id: string
  full_name: string | null
  email: string
  g1_cell_phone: string | null
  g2_full_name: string | null
  g2_email: string | null
  g2_cell_phone: string | null
  g2_relationship: string | null
}

export async function getCheckInUser(userId: string): Promise<CheckInUser | null> {
  const adminClient = createAdminClient()
  const { data, error } = await adminClient
    .schema('admin')
    .from('users')
    .select('id, full_name, email, g1_cell_phone, g2_full_name, g2_email, g2_cell_phone, g2_relationship')
    .eq('id', userId)
    .single()
  if (error) return null
  return data
}
