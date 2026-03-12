'use server'
import { createAdminClient } from '@/app/lib/supabase-server'

export async function addApplicationNote(applicationId: string, content: string) {
  const adminClient = createAdminClient()
  const { data, error } = await adminClient
    .schema('parent_app')
    .from('application_notes')
    .insert({ application_id: applicationId, content })
    .select('id, content, created_at')
    .single()
  if (error) return { error: error.message }
  return { note: data }
}
