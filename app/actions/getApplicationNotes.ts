'use server'
import { createAdminClient } from '@/app/lib/supabase-server'

export async function getApplicationNotes(applicationId: string) {
  const adminClient = createAdminClient()
  const { data, error } = await adminClient
    .schema('parent_app')
    .from('application_notes')
    .select('id, content, created_at')
    .eq('application_id', applicationId)
    .order('created_at', { ascending: false })
  if (error) return { error: error.message }
  return { notes: data }
}
