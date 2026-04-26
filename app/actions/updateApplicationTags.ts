'use server'
import { createAdminClient } from '@/app/lib/supabase-server'

export async function updateApplicationTags(id: string, tags: string[]) {
  const adminClient = createAdminClient()
  const { error } = await adminClient
    .schema('parent_app')
    .from('applications')
    .update({ admin_tags: tags, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { success: false, error: error.message }
  return { success: true }
}
