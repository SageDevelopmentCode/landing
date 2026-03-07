'use server'
import { createAdminClient } from '@/app/lib/supabase-server'

export async function denyApplication(id: string, reason: string) {
  const adminClient = createAdminClient()
  const { error } = await adminClient
    .schema('parent_app')
    .from('applications')
    .update({ denied: true, denied_at: new Date().toISOString(), denied_reason: reason })
    .eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}
