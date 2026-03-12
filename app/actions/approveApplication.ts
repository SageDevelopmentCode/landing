'use server'
import { createAdminClient } from '@/app/lib/supabase-server'

export async function approveApplication(id: string) {
  const adminClient = createAdminClient()
  const { error } = await adminClient
    .schema('parent_app')
    .from('applications')
    .update({ approved: true, approved_at: new Date().toISOString(), status: 'enrolling' })
    .eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}
