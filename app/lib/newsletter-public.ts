import { createAdminClient } from './supabase-server'

export async function getNewsletterMetaPublic(
  id: string
): Promise<{ id: string; title: string; week_range: string } | null> {
  const adminClient = createAdminClient()

  const { data, error } = await adminClient
    .schema('newsletters')
    .from('newsletters')
    .select('id, title, week_range, status')
    .eq('id', id)
    .eq('is_deleted', false)
    .eq('status', 'published')
    .single()

  if (error || !data) {
    console.error('getNewsletterMetaPublic error:', error)
    return null
  }
  return { id: data.id, title: data.title, week_range: data.week_range }
}
