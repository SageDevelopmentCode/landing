'use server'
import { createAdminClient } from '@/app/lib/supabase-server'

export async function enrollApplication(applicationId: string) {
  const adminClient = createAdminClient()
  const { error } = await adminClient
    .schema('parent_app')
    .from('applications')
    .update({ status: 'enrolled' })
    .eq('id', applicationId)
  if (error) return { error: error.message }
  return { success: true }
}
