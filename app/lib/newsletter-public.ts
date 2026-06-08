import { createAdminClient } from './supabase-server'

export async function getNewsletterMetaPublic(
  id: string
): Promise<{ id: string; title: string; week_range: string; cover_image_signed_url: string | null } | null> {
  const adminClient = createAdminClient()

  const { data, error } = await adminClient
    .schema('newsletters')
    .from('newsletters')
    .select('id, title, week_range, status, cover_image_path')
    .eq('id', id)
    .eq('is_deleted', false)
    .eq('status', 'published')
    .single()

  if (error || !data) {
    console.error('getNewsletterMetaPublic error:', error)
    return null
  }

  let cover_image_signed_url: string | null = null
  if (data.cover_image_path) {
    const bucket = (data.cover_image_path as string).startsWith('covers/') ? 'newsletter-images' : 'teacher-photos'
    const { data: signed } = await adminClient.storage.from(bucket).createSignedUrls([data.cover_image_path], 86400)
    cover_image_signed_url = signed?.[0]?.signedUrl ?? null
  }

  return { id: data.id, title: data.title, week_range: data.week_range, cover_image_signed_url }
}
