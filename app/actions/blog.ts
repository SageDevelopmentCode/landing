'use server'

import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BlogPost {
  id: string
  title: string
  slug: string
  body: string
  excerpt: string | null
  meta_description: string | null
  cover_image_path: string | null
  cover_image_bucket: 'blog-images' | 'teacher-photos' | null
  cover_image_signed_url: string | null
  status: 'draft' | 'published'
  created_by: string
  author_name: string | null
  published_at: string | null
  is_deleted: boolean
  created_at: string
  updated_at: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

async function resolvePostRows(rows: any[], adminClient: ReturnType<typeof createAdminClient>): Promise<BlogPost[]> {
  const authorIds = [...new Set(rows.map((r) => r.created_by).filter(Boolean))]

  let nameMap = new Map<string, string | null>()
  if (authorIds.length > 0) {
    const { data: users } = await adminClient
      .schema('admin')
      .from('users')
      .select('id, full_name')
      .in('id', authorIds)
    nameMap = new Map((users ?? []).map((u: any) => [u.id, u.full_name ?? null]))
  }

  const pathsByBucket = new Map<string, string[]>()
  for (const row of rows) {
    if (!row.cover_image_path || !row.cover_image_bucket) continue
    if (!pathsByBucket.has(row.cover_image_bucket)) pathsByBucket.set(row.cover_image_bucket, [])
    pathsByBucket.get(row.cover_image_bucket)!.push(row.cover_image_path)
  }

  const signedUrlMap = new Map<string, string>()
  await Promise.all(
    Array.from(pathsByBucket.entries()).map(async ([bucket, paths]) => {
      if (!paths.length) return
      const { data: signedUrls } = await adminClient.storage.from(bucket).createSignedUrls(paths, 86400)
      for (const entry of signedUrls ?? []) {
        if (entry.signedUrl && entry.path) signedUrlMap.set(entry.path, entry.signedUrl)
      }
    })
  )

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    body: row.body,
    excerpt: row.excerpt ?? null,
    meta_description: row.meta_description ?? null,
    cover_image_path: row.cover_image_path ?? null,
    cover_image_bucket: row.cover_image_bucket ?? null,
    cover_image_signed_url: row.cover_image_path ? (signedUrlMap.get(row.cover_image_path) ?? null) : null,
    status: row.status as 'draft' | 'published',
    created_by: row.created_by,
    author_name: nameMap.get(row.created_by) ?? null,
    published_at: row.published_at ?? null,
    is_deleted: row.is_deleted,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }))
}

// ─── Read ──────────────────────────────────────────────────────────────────────

export async function getBlogPosts(): Promise<BlogPost[]> {
  const adminClient = createAdminClient()

  const { data: rows, error } = await adminClient
    .schema('blogs')
    .from('blog_posts')
    .select('*')
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })

  if (error || !rows) {
    console.error('[getBlogPosts] error:', error?.message ?? JSON.stringify(error))
    return []
  }

  return resolvePostRows(rows, adminClient)
}

export async function getBlogPostById(id: string): Promise<BlogPost | null> {
  const adminClient = createAdminClient()

  const { data: row, error } = await adminClient
    .schema('blogs')
    .from('blog_posts')
    .select('*')
    .eq('id', id)
    .eq('is_deleted', false)
    .single()

  if (error || !row) {
    console.error('[getBlogPostById] error:', error?.message ?? JSON.stringify(error))
    return null
  }

  const results = await resolvePostRows([row], adminClient)
  return results[0] ?? null
}

export async function getPublishedPosts(): Promise<BlogPost[]> {
  const adminClient = createAdminClient()

  const { data: rows, error } = await adminClient
    .schema('blogs')
    .from('blog_posts')
    .select('*')
    .eq('is_deleted', false)
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  if (error || !rows) {
    console.error('[getPublishedPosts] error:', error?.message ?? JSON.stringify(error))
    return []
  }

  return resolvePostRows(rows, adminClient)
}

export async function getOtherPublishedPosts(excludeSlug: string): Promise<BlogPost[]> {
  const posts = await getPublishedPosts()
  return posts.filter((p) => p.slug !== excludeSlug).slice(0, 3)
}

export async function getPublishedPostBySlug(slug: string): Promise<BlogPost | null> {
  const adminClient = createAdminClient()

  const { data: row, error } = await adminClient
    .schema('blogs')
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('is_deleted', false)
    .eq('status', 'published')
    .single()

  if (error || !row) return null

  const results = await resolvePostRows([row], adminClient)
  return results[0] ?? null
}

// ─── Create ────────────────────────────────────────────────────────────────────

export async function createBlogPost(
  title: string
): Promise<{ error?: string; data?: BlogPost }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const adminClient = createAdminClient()

  let slug = toSlug(title) || 'untitled'

  // Ensure uniqueness
  const { data: existing } = await adminClient
    .schema('blogs')
    .from('blog_posts')
    .select('slug')
    .like('slug', `${slug}%`)
    .eq('is_deleted', false)

  if (existing && existing.length > 0) {
    const existingSlugs = new Set(existing.map((r: any) => r.slug))
    if (existingSlugs.has(slug)) {
      let counter = 2
      while (existingSlugs.has(`${slug}-${counter}`)) counter++
      slug = `${slug}-${counter}`
    }
  }

  const { data: row, error } = await adminClient
    .schema('blogs')
    .from('blog_posts')
    .insert({ title, slug, created_by: user.id })
    .select('*')
    .single()

  if (error || !row) {
    console.error('[createBlogPost] error:', error)
    return { error: error?.message ?? 'Failed to create post' }
  }

  const results = await resolvePostRows([row], adminClient)
  return { data: results[0] }
}

// ─── Save Draft ────────────────────────────────────────────────────────────────

export async function saveBlogDraft(input: {
  postId: string
  title: string
  body: string
  excerpt: string
  meta_description?: string
}): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const adminClient = createAdminClient()

  const { error } = await adminClient
    .schema('blogs')
    .from('blog_posts')
    .update({
      title: input.title,
      body: input.body,
      excerpt: input.excerpt || null,
      meta_description: input.meta_description || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.postId)

  if (error) {
    console.error('[saveBlogDraft] error:', error)
    return { error: error.message }
  }

  return { success: true }
}

// ─── Publish / Unpublish ───────────────────────────────────────────────────────

export async function publishPost(
  postId: string
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const adminClient = createAdminClient()

  const { error } = await adminClient
    .schema('blogs')
    .from('blog_posts')
    .update({ status: 'published', published_at: new Date().toISOString() })
    .eq('id', postId)

  if (error) {
    console.error('[publishPost] error:', error)
    return { error: error.message }
  }

  return { success: true }
}

export async function unpublishPost(
  postId: string
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const adminClient = createAdminClient()

  const { error } = await adminClient
    .schema('blogs')
    .from('blog_posts')
    .update({ status: 'draft', published_at: null })
    .eq('id', postId)

  if (error) {
    console.error('[unpublishPost] error:', error)
    return { error: error.message }
  }

  return { success: true }
}

// ─── Delete ────────────────────────────────────────────────────────────────────

export async function deletePost(
  postId: string
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const adminClient = createAdminClient()

  const { error } = await adminClient
    .schema('blogs')
    .from('blog_posts')
    .update({ is_deleted: true })
    .eq('id', postId)

  if (error) {
    console.error('[deletePost] error:', error)
    return { error: error.message }
  }

  return { success: true }
}

// ─── Cover Image ───────────────────────────────────────────────────────────────

export async function uploadBlogCoverImage(
  formData: FormData
): Promise<{ error?: string; data?: { path: string; signedUrl: string } }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const postId = formData.get('postId') as string
  const file = formData.get('file') as File
  if (!postId || !file) return { error: 'Missing postId or file' }

  const adminClient = createAdminClient()

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const storagePath = `covers/${postId}/${Date.now()}-${safeName}`

  const { error: uploadError } = await adminClient.storage
    .from('blog-images')
    .upload(storagePath, file, { contentType: file.type, upsert: false })

  if (uploadError) {
    console.error('[uploadBlogCoverImage] storage error:', uploadError)
    return { error: uploadError.message }
  }

  const { error: updateError } = await adminClient
    .schema('blogs')
    .from('blog_posts')
    .update({ cover_image_path: storagePath, cover_image_bucket: 'blog-images' })
    .eq('id', postId)

  if (updateError) {
    console.error('[uploadBlogCoverImage] update error:', updateError)
    return { error: updateError.message }
  }

  const { data: signed } = await adminClient.storage
    .from('blog-images')
    .createSignedUrl(storagePath, 3600)

  return { data: { path: storagePath, signedUrl: signed?.signedUrl ?? '' } }
}

export async function addLibraryCoverToBlog(
  postId: string,
  photoId: string
): Promise<{ error?: string; data?: { path: string; signedUrl: string } }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const adminClient = createAdminClient()

  const { data: photo, error: photoError } = await adminClient
    .schema('teachers')
    .from('photos')
    .select('id, storage_path')
    .eq('id', photoId)
    .eq('is_deleted', false)
    .single()

  if (photoError || !photo) {
    return { error: 'Photo not found' }
  }

  const { error: updateError } = await adminClient
    .schema('blogs')
    .from('blog_posts')
    .update({ cover_image_path: photo.storage_path, cover_image_bucket: 'teacher-photos' })
    .eq('id', postId)

  if (updateError) {
    console.error('[addLibraryCoverToBlog] update error:', updateError)
    return { error: updateError.message }
  }

  const { data: signed } = await adminClient.storage
    .from('teacher-photos')
    .createSignedUrl(photo.storage_path, 3600)

  return { data: { path: photo.storage_path, signedUrl: signed?.signedUrl ?? '' } }
}

export async function deleteBlogCoverImage(
  postId: string
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const adminClient = createAdminClient()

  const { error } = await adminClient
    .schema('blogs')
    .from('blog_posts')
    .update({ cover_image_path: null, cover_image_bucket: null })
    .eq('id', postId)

  if (error) {
    console.error('[deleteBlogCoverImage] error:', error)
    return { error: error.message }
  }

  return { success: true }
}
