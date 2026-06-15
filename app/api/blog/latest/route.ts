import { NextResponse } from 'next/server'
import { createAdminClient } from '@/app/lib/supabase-server'

export async function GET() {
  const adminClient = createAdminClient()

  const { data: row, error } = await adminClient
    .schema('blogs')
    .from('blog_posts')
    .select('title, slug, excerpt, published_at, cover_image_path, cover_image_bucket, created_by')
    .eq('is_deleted', false)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!row) {
    return NextResponse.json({})
  }

  // Resolve author name via admin users table
  let author_name: string | null = null
  if (row.created_by) {
    const { data: user } = await adminClient
      .schema('admin')
      .from('users')
      .select('full_name')
      .eq('id', row.created_by)
      .maybeSingle()
    author_name = user?.full_name ?? null
  }

  // Generate signed URL for cover image
  let cover_image_signed_url: string | null = null
  if (row.cover_image_path && row.cover_image_bucket) {
    const { data: signed } = await adminClient.storage
      .from(row.cover_image_bucket)
      .createSignedUrl(row.cover_image_path, 86400)
    cover_image_signed_url = signed?.signedUrl ?? null
  }

  return NextResponse.json({
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt ?? null,
    author_name,
    published_at: row.published_at ?? null,
    cover_image_signed_url,
  })
}
