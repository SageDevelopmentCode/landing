'use server'
import { createAdminClient } from '@/app/lib/supabase-server'

export async function deactivateApplication(id: string) {
  const adminClient = createAdminClient()
  const { error } = await adminClient
    .schema('parent_app')
    .from('applications')
    .update({ is_active: false })
    .eq('id', id)
  if (error) return { success: false, error: error.message }
  return { success: true }
}
