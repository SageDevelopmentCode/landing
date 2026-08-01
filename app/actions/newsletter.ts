'use server'

import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'
import { sendDiscordNotification, createNewsletterViewedEmbed } from '@/app/lib/discord'

// ─── Types ────────────────────────────────────────────────────────────────────

type NewsletterTeacherUpdateSelect = {
  id: string
  section_id: string
  teacher_id: string
  body: string
  updated_at: string
}

type NewsletterSectionImageSelect = {
  id: string
  storage_path: string
  sort_order: number
  is_deleted: boolean
  source_bucket: string | null
}

type NewsletterSectionSelect = {
  id: string
  newsletter_id: string
  label: string
  body: string
  visible: boolean
  sort_order: number
  is_class_updates: boolean
  created_at: string
  updated_at: string
  teacher_updates: NewsletterTeacherUpdateSelect[] | null
  section_images: NewsletterSectionImageSelect[] | null
}

type NewsletterChangeLogSelect = {
  id: string
  newsletter_id: string
  teacher_id: string
  summary: string[]
  created_at: string
}

type NewsletterRowSelect = {
  id: string
  title: string
  week_range: string
  status: string
  view_mode: string
  created_by: string
  published_at: string | null
  access_password: string | null
  cover_image_path: string | null
  created_at: string
  updated_at: string
  sections: NewsletterSectionSelect[] | null
  change_log: NewsletterChangeLogSelect[] | null
}

export interface DBTeacherUpdate {
  id: string
  section_id: string
  teacher_id: string
  body: string
  updated_at: string
  teacher_name?: string | null
  teacher_avatar?: string | null
}

export interface DBSectionImage {
  id: string
  storage_path: string
  signed_url: string | null
  sort_order: number
  source_bucket: string
}

export interface DBSection {
  id: string
  newsletter_id: string
  label: string
  body: string
  visible: boolean
  sort_order: number
  is_class_updates: boolean
  created_at: string
  updated_at: string
  teacher_updates: DBTeacherUpdate[]
  images: DBSectionImage[]
}

export interface DBChangeEntry {
  id: string
  newsletter_id: string
  teacher_id: string
  teacher_name: string | null
  teacher_avatar: string | null
  summary: string[]
  created_at: string
}

export interface DBNewsletterListItem {
  id: string
  title: string
  week_range: string
  cover_image_path: string | null
  cover_image_signed_url: string | null
  access_password: string | null
  published_at: string | null
}

export interface DBNewsletter {
  id: string
  title: string
  week_range: string
  status: 'draft' | 'published'
  view_mode: 'traditional' | 'slideshow'
  created_by: string
  published_at: string | null
  access_password: string | null
  cover_image_path: string | null
  cover_image_signed_url: string | null
  created_at: string
  updated_at: string
  sections: DBSection[]
  change_log: DBChangeEntry[]
}

// ─── Read ──────────────────────────────────────────────────────────────────────


async function resolveNewsletterRows(rows: NewsletterRowSelect[], adminClient: ReturnType<typeof createAdminClient>): Promise<DBNewsletter[]> {
  const teacherIds = new Set<string>()
  for (const row of rows) {
    for (const entry of row.change_log ?? []) {
      teacherIds.add(entry.teacher_id)
    }
    for (const s of row.sections ?? []) {
      for (const tu of s.teacher_updates ?? []) {
        teacherIds.add(tu.teacher_id)
      }
    }
  }

  let nameMap = new Map<string, { full_name: string | null; profile_image_url: string | null }>()
  if (teacherIds.size > 0) {
    const { data: users } = await adminClient
      .schema('admin')
      .from('users')
      .select('id, full_name, profile_image_url')
      .in('id', [...teacherIds])
    nameMap = new Map((users ?? []).map((u) => [u.id, { full_name: u.full_name, profile_image_url: u.profile_image_url }]))
  }

  const pathsByBucket = new Map<string, string[]>()
  for (const row of rows) {
    // Cover image
    if (row.cover_image_path) {
      const coverBucket = (row.cover_image_path as string).startsWith('covers/') ? 'newsletter-images' : 'teacher-photos'
      if (!pathsByBucket.has(coverBucket)) pathsByBucket.set(coverBucket, [])
      pathsByBucket.get(coverBucket)!.push(row.cover_image_path)
    }
    for (const s of row.sections ?? []) {
      for (const img of s.section_images ?? []) {
        if (img.is_deleted) continue
        const bucket: string = img.source_bucket ?? 'newsletter-images'
        if (!pathsByBucket.has(bucket)) pathsByBucket.set(bucket, [])
        pathsByBucket.get(bucket)!.push(img.storage_path)
      }
    }
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
    ...row,
    status: row.status as 'draft' | 'published',
    view_mode: row.view_mode as 'traditional' | 'slideshow',
    access_password: row.access_password ?? null,
    cover_image_path: row.cover_image_path ?? null,
    cover_image_signed_url: row.cover_image_path
      ? (signedUrlMap.get(row.cover_image_path) ?? null)
      : null,
    sections: (row.sections ?? [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((s) => ({
        ...s,
        teacher_updates: (s.teacher_updates ?? []).map((tu) => {
          const user = nameMap.get(tu.teacher_id)
          return {
            ...tu,
            teacher_name: user?.full_name ?? null,
            teacher_avatar: user?.profile_image_url ?? null,
          } as DBTeacherUpdate
        }),
        images: (s.section_images ?? [])
          .filter((img) => !img.is_deleted)
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((img) => ({
            id: img.id,
            storage_path: img.storage_path,
            signed_url: signedUrlMap.get(img.storage_path) ?? null,
            sort_order: img.sort_order,
            source_bucket: img.source_bucket ?? 'newsletter-images',
          })) as DBSectionImage[],
      })),
    change_log: (row.change_log ?? [])
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map((entry) => {
        const user = nameMap.get(entry.teacher_id)
        return {
          ...entry,
          teacher_name: user?.full_name ?? null,
          teacher_avatar: user?.profile_image_url ?? null,
        }
      }),
  })) as DBNewsletter[]
}

const NEWSLETTER_SELECT = `
  id, title, week_range, status, view_mode, created_by, published_at, access_password, cover_image_path, created_at, updated_at,
  sections:sections(
    id, newsletter_id, label, body, visible, sort_order, is_class_updates, created_at, updated_at,
    teacher_updates:teacher_updates(id, section_id, teacher_id, body, updated_at),
    section_images:section_images(id, storage_path, sort_order, is_deleted, source_bucket)
  ),
  change_log:change_log(id, newsletter_id, teacher_id, summary, created_at)
`

export async function getNewsletters(): Promise<DBNewsletter[]> {
  const adminClient = createAdminClient()

  const { data: rows, error } = await adminClient
    .schema('newsletters')
    .from('newsletters')
    .select(NEWSLETTER_SELECT)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getNewsletters error:', error)
    return []
  }

  if (!rows || rows.length === 0) return []

  return resolveNewsletterRows(rows as NewsletterRowSelect[], adminClient)
}

export async function getNewsletterById(id: string): Promise<DBNewsletter | null> {
  const adminClient = createAdminClient()

  const { data: row, error } = await adminClient
    .schema('newsletters')
    .from('newsletters')
    .select(NEWSLETTER_SELECT)
    .eq('id', id)
    .eq('is_deleted', false)
    .single()

  if (error || !row) {
    console.error('getNewsletterById error:', error)
    return null
  }

  const results = await resolveNewsletterRows([row as NewsletterRowSelect], adminClient)
  return results[0] ?? null
}

// ─── Create ────────────────────────────────────────────────────────────────────

interface CreateNewsletterInput {
  title: string
  weekRange: string
  teacherIds: string[]
}

export async function createNewsletter(
  input: CreateNewsletterInput
): Promise<{ error?: string; data?: DBNewsletter }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const adminClient = createAdminClient()

  const { data: newsletter, error: nlError } = await adminClient
    .schema('newsletters')
    .from('newsletters')
    .insert({ title: input.title, week_range: input.weekRange, created_by: user.id })
    .select()
    .single()

  if (nlError || !newsletter) {
    console.error('createNewsletter error:', nlError)
    return { error: nlError?.message ?? 'Failed to create newsletter' }
  }

  const defaultSections = [
    { label: 'Welcome Message',  body: '', is_class_updates: false, sort_order: 0 },
    { label: 'Class Updates',    body: '', is_class_updates: true,  sort_order: 1 },
    { label: 'Upcoming Events',  body: '', is_class_updates: false, sort_order: 2 },
    { label: 'Parent Reminders', body: '', is_class_updates: false, sort_order: 3 },
    { label: 'Photo Gallery',    body: '', is_class_updates: false, sort_order: 4 },
  ]

  const { data: sections, error: secError } = await adminClient
    .schema('newsletters')
    .from('sections')
    .insert(
      defaultSections.map((s) => ({
        newsletter_id: newsletter.id,
        label: s.label,
        body: s.body,
        visible: true,
        sort_order: s.sort_order,
        is_class_updates: s.is_class_updates,
      }))
    )
    .select()

  if (secError || !sections) {
    console.error('createNewsletter sections error:', secError)
    return { error: secError?.message ?? 'Failed to create sections' }
  }

  const classUpdatesSection = sections.find((s) => s.is_class_updates)
  if (classUpdatesSection && input.teacherIds.length > 0) {
    const { error: tuError } = await adminClient
      .schema('newsletters')
      .from('teacher_updates')
      .insert(
        input.teacherIds.map((tid) => ({
          section_id: classUpdatesSection.id,
          teacher_id: tid,
          body: '',
        }))
      )
    if (tuError) {
      console.error('createNewsletter teacher_updates error:', tuError)
    }
  }

  const freshNewsletters = await getNewsletters()
  const created = freshNewsletters.find((n) => n.id === newsletter.id)
  if (!created) return { error: 'Failed to load created newsletter' }

  return { data: created }
}

// ─── Save Draft ────────────────────────────────────────────────────────────────

interface SaveSectionPayload {
  id: string
  label: string
  body: string
  visible: boolean
  sort_order: number
  is_class_updates: boolean
  teacher_updates: { teacher_id: string; body: string }[]
}

interface SaveDraftInput {
  newsletterId: string
  title: string
  viewMode: 'traditional' | 'slideshow'
  sections: SaveSectionPayload[]
  summary: string[]
}

export async function saveDraft(
  input: SaveDraftInput
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const adminClient = createAdminClient()

  // Update newsletter metadata
  const { error: nlError } = await adminClient
    .schema('newsletters')
    .from('newsletters')
    .update({ title: input.title, view_mode: input.viewMode, updated_at: new Date().toISOString() })
    .eq('id', input.newsletterId)

  if (nlError) {
    console.error('saveDraft newsletter update error:', nlError)
    return { error: nlError.message }
  }

  // Upsert all sections
  for (const section of input.sections) {
    const { error: secError } = await adminClient
      .schema('newsletters')
      .from('sections')
      .upsert(
        {
          id: section.id,
          newsletter_id: input.newsletterId,
          label: section.label,
          body: section.body,
          visible: section.visible,
          sort_order: section.sort_order,
          is_class_updates: section.is_class_updates,
        },
        { onConflict: 'id' }
      )

    if (secError) {
      console.error('saveDraft section upsert error:', secError)
      return { error: secError.message }
    }

    // Upsert teacher_updates for class updates sections
    if (section.is_class_updates && section.teacher_updates.length > 0) {
      const { error: tuError } = await adminClient
        .schema('newsletters')
        .from('teacher_updates')
        .upsert(
          section.teacher_updates.map((tu) => ({
            section_id: section.id,
            teacher_id: tu.teacher_id,
            body: tu.body,
          })),
          { onConflict: 'section_id,teacher_id' }
        )

      if (tuError) {
        console.error('saveDraft teacher_updates upsert error:', tuError)
      }
    }
  }

  // Append change_log entry if there are changes to record
  if (input.summary.length > 0) {
    const { error: logError } = await adminClient
      .schema('newsletters')
      .from('change_log')
      .insert({ newsletter_id: input.newsletterId, teacher_id: user.id, summary: input.summary })

    if (logError) {
      console.error('saveDraft change_log insert error:', logError)
    }
  }

  return { success: true }
}

// ─── Publish ───────────────────────────────────────────────────────────────────

export async function publishNewsletter(
  newsletterId: string,
  password: string,
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const adminClient = createAdminClient()

  const { error } = await adminClient
    .schema('newsletters')
    .from('newsletters')
    .update({ status: 'published', published_at: new Date().toISOString(), access_password: password })
    .eq('id', newsletterId)

  if (error) {
    console.error('publishNewsletter error:', error)
    return { error: error.message }
  }

  return { success: true }
}

export async function setNewsletterPassword(
  newsletterId: string,
  password: string,
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const adminClient = createAdminClient()

  const { error } = await adminClient
    .schema('newsletters')
    .from('newsletters')
    .update({ access_password: password })
    .eq('id', newsletterId)

  if (error) {
    console.error('setNewsletterPassword error:', error)
    return { error: error.message }
  }

  return { success: true }
}

// ─── Unpublish ─────────────────────────────────────────────────────────────────

export async function unpublishNewsletter(
  newsletterId: string
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const adminClient = createAdminClient()

  const { error } = await adminClient
    .schema('newsletters')
    .from('newsletters')
    .update({ status: 'draft', published_at: null })
    .eq('id', newsletterId)

  if (error) {
    console.error('unpublishNewsletter error:', error)
    return { error: error.message }
  }

  return { success: true }
}

// ─── Public (unauthenticated) access ──────────────────────────────────────────

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

  if (error || !data) return null
  return { id: data.id, title: data.title, week_range: data.week_range }
}

export async function getPublishedNewslettersList(): Promise<DBNewsletterListItem[]> {
  const adminClient = createAdminClient()

  const { data: rows, error } = await adminClient
    .schema('newsletters')
    .from('newsletters')
    .select('id, title, week_range, cover_image_path, access_password, published_at')
    .eq('is_deleted', false)
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  if (error || !rows || rows.length === 0) {
    if (error) console.error('getPublishedNewslettersList error:', error)
    return []
  }

  const pathsByBucket = new Map<string, string[]>()
  for (const row of rows) {
    if (!row.cover_image_path) continue
    const bucket = (row.cover_image_path as string).startsWith('covers/')
      ? 'newsletter-images'
      : 'teacher-photos'
    if (!pathsByBucket.has(bucket)) pathsByBucket.set(bucket, [])
    pathsByBucket.get(bucket)!.push(row.cover_image_path)
  }

  const signedUrlMap = new Map<string, string>()
  await Promise.all(
    Array.from(pathsByBucket.entries()).map(async ([bucket, paths]) => {
      const { data: signedUrls } = await adminClient.storage.from(bucket).createSignedUrls(paths, 86400)
      for (const entry of signedUrls ?? []) {
        if (entry.signedUrl && entry.path) signedUrlMap.set(entry.path, entry.signedUrl)
      }
    })
  )

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    week_range: row.week_range,
    cover_image_path: row.cover_image_path ?? null,
    cover_image_signed_url: row.cover_image_path ? (signedUrlMap.get(row.cover_image_path) ?? null) : null,
    access_password: row.access_password ?? null,
    published_at: row.published_at ?? null,
  }))
}

export async function verifyNewsletterPassword(
  id: string,
  password: string,
): Promise<{ data?: DBNewsletter; error?: string }> {
  const adminClient = createAdminClient()

  const { data: row, error } = await adminClient
    .schema('newsletters')
    .from('newsletters')
    .select(NEWSLETTER_SELECT)
    .eq('id', id)
    .eq('is_deleted', false)
    .eq('status', 'published')
    .single()

  if (error || !row) return { error: 'Newsletter not found' }
  if (!row.access_password || row.access_password.toLowerCase() !== password.toLowerCase()) return { error: 'Incorrect password' }

  const results = await resolveNewsletterRows([row as NewsletterRowSelect], adminClient)

  void sendDiscordNotification(
    createNewsletterViewedEmbed({
      newsletterId: row.id,
      title: row.title,
      weekRange: row.week_range,
    }),
  ).catch(() => {})

  return { data: results[0] }
}

// ─── Section Images ────────────────────────────────────────────────────────────

export async function uploadSectionImage(
  formData: FormData
): Promise<{ error?: string; data?: { id: string; storage_path: string; signed_url: string } }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const sectionId = formData.get('sectionId') as string
  const file = formData.get('file') as File
  if (!sectionId || !file) return { error: 'Missing sectionId or file' }

  const adminClient = createAdminClient()

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const storagePath = `${sectionId}/${Date.now()}-${safeName}`

  const { error: uploadError } = await adminClient.storage
    .from('newsletter-images')
    .upload(storagePath, file, { contentType: file.type, upsert: false })

  if (uploadError) {
    console.error('uploadSectionImage storage error:', uploadError)
    return { error: uploadError.message }
  }

  const { data: row, error: insertError } = await adminClient
    .schema('newsletters')
    .from('section_images')
    .insert({ section_id: sectionId, storage_path: storagePath, uploaded_by: user.id })
    .select('id, storage_path')
    .single()

  if (insertError || !row) {
    console.error('uploadSectionImage insert error:', insertError)
    return { error: insertError?.message ?? 'Failed to save image record' }
  }

  const { data: signed } = await adminClient.storage
    .from('newsletter-images')
    .createSignedUrl(storagePath, 3600)

  return { data: { id: row.id, storage_path: row.storage_path, signed_url: signed?.signedUrl ?? '' } }
}

export async function addLibraryPhotoToSection(
  sectionId: string,
  photoId: string
): Promise<{ error?: string; data?: DBSectionImage }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const adminClient = createAdminClient()

  const { data: photo, error: photoError } = await adminClient
    .schema('teachers')
    .from('photos')
    .select('id, storage_path')
    .eq('id', photoId)
    .eq('teacher_id', user.id)
    .eq('is_deleted', false)
    .single()

  if (photoError || !photo) {
    return { error: 'Photo not found or does not belong to you' }
  }

  const { data: existing } = await adminClient
    .schema('newsletters')
    .from('section_images')
    .select('id')
    .eq('section_id', sectionId)
    .eq('storage_path', photo.storage_path)
    .eq('source_bucket', 'teacher-photos')
    .eq('is_deleted', false)
    .maybeSingle()

  if (existing) {
    return { error: 'This photo is already in the section' }
  }

  const { data: row, error: insertError } = await adminClient
    .schema('newsletters')
    .from('section_images')
    .insert({
      section_id: sectionId,
      storage_path: photo.storage_path,
      uploaded_by: user.id,
      source_bucket: 'teacher-photos',
    })
    .select('id, storage_path, sort_order, source_bucket')
    .single()

  if (insertError || !row) {
    console.error('addLibraryPhotoToSection insert error:', insertError)
    return { error: insertError?.message ?? 'Failed to save image record' }
  }

  const { data: signed } = await adminClient.storage
    .from('teacher-photos')
    .createSignedUrl(photo.storage_path, 3600)

  return {
    data: {
      id: row.id,
      storage_path: row.storage_path,
      signed_url: signed?.signedUrl ?? null,
      sort_order: row.sort_order,
      source_bucket: row.source_bucket,
    },
  }
}

export async function deleteSectionImage(
  imageId: string
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const adminClient = createAdminClient()

  const { data: row, error: fetchError } = await adminClient
    .schema('newsletters')
    .from('section_images')
    .select('storage_path, source_bucket')
    .eq('id', imageId)
    .single()

  if (fetchError || !row) {
    console.error('deleteSectionImage fetch error:', fetchError)
    return { error: fetchError?.message ?? 'Image not found' }
  }

  const { error: updateError } = await adminClient
    .schema('newsletters')
    .from('section_images')
    .update({ is_deleted: true })
    .eq('id', imageId)

  if (updateError) {
    console.error('deleteSectionImage soft-delete error:', updateError)
    return { error: updateError.message }
  }

  // Only remove the file from storage for newsletter-owned uploads.
  // Library photos (source_bucket = 'teacher-photos') stay intact in the teacher's library.
  if ((row.source_bucket ?? 'newsletter-images') === 'newsletter-images') {
    await adminClient.storage.from('newsletter-images').remove([row.storage_path])
  }

  return { success: true }
}

// ─── Cover Image ───────────────────────────────────────────────────────────────

export async function uploadNewsletterCoverImage(
  formData: FormData
): Promise<{ error?: string; data?: { storage_path: string; signed_url: string } }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const newsletterId = formData.get('newsletterId') as string
  const file = formData.get('file') as File
  if (!newsletterId || !file) return { error: 'Missing newsletterId or file' }

  const adminClient = createAdminClient()

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const storagePath = `covers/${newsletterId}/${Date.now()}-${safeName}`

  const { error: uploadError } = await adminClient.storage
    .from('newsletter-images')
    .upload(storagePath, file, { contentType: file.type, upsert: false })

  if (uploadError) {
    console.error('uploadNewsletterCoverImage storage error:', uploadError)
    return { error: uploadError.message }
  }

  const { error: updateError } = await adminClient
    .schema('newsletters')
    .from('newsletters')
    .update({ cover_image_path: storagePath })
    .eq('id', newsletterId)

  if (updateError) {
    console.error('uploadNewsletterCoverImage update error:', updateError)
    return { error: updateError.message }
  }

  const { data: signed } = await adminClient.storage
    .from('newsletter-images')
    .createSignedUrl(storagePath, 3600)

  return { data: { storage_path: storagePath, signed_url: signed?.signedUrl ?? '' } }
}

export async function addLibraryCoverPhoto(
  newsletterId: string,
  photoId: string
): Promise<{ error?: string; data?: { storage_path: string; signed_url: string } }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const adminClient = createAdminClient()

  const { data: photo, error: photoError } = await adminClient
    .schema('teachers')
    .from('photos')
    .select('id, storage_path')
    .eq('id', photoId)
    .eq('teacher_id', user.id)
    .eq('is_deleted', false)
    .single()

  if (photoError || !photo) return { error: 'Photo not found or does not belong to you' }

  const { error: updateError } = await adminClient
    .schema('newsletters')
    .from('newsletters')
    .update({ cover_image_path: photo.storage_path })
    .eq('id', newsletterId)

  if (updateError) {
    console.error('addLibraryCoverPhoto update error:', updateError)
    return { error: updateError.message }
  }

  const { data: signed } = await adminClient.storage
    .from('teacher-photos')
    .createSignedUrl(photo.storage_path, 3600)

  return { data: { storage_path: photo.storage_path, signed_url: signed?.signedUrl ?? '' } }
}

export async function deleteNewsletterCoverImage(
  newsletterId: string
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const adminClient = createAdminClient()

  const { data: row, error: fetchError } = await adminClient
    .schema('newsletters')
    .from('newsletters')
    .select('cover_image_path')
    .eq('id', newsletterId)
    .single()

  if (fetchError || !row) return { error: 'Newsletter not found' }

  const { error: updateError } = await adminClient
    .schema('newsletters')
    .from('newsletters')
    .update({ cover_image_path: null })
    .eq('id', newsletterId)

  if (updateError) {
    console.error('deleteNewsletterCoverImage update error:', updateError)
    return { error: updateError.message }
  }

  // Only delete storage file for newsletter-owned uploads (paths starting with "covers/")
  if (row.cover_image_path && (row.cover_image_path as string).startsWith('covers/')) {
    await adminClient.storage.from('newsletter-images').remove([row.cover_image_path])
  }

  return { success: true }
}

// ─── Delete (soft) ─────────────────────────────────────────────────────────────

export async function deleteNewsletter(
  newsletterId: string
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const adminClient = createAdminClient()

  const { error } = await adminClient
    .schema('newsletters')
    .from('newsletters')
    .update({ is_deleted: true })
    .eq('id', newsletterId)

  if (error) {
    console.error('deleteNewsletter error:', error)
    return { error: error.message }
  }

  return { success: true }
}
