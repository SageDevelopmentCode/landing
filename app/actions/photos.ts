'use server'

import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'

export type ConsentLevel = 'FULL' | 'LIMITED' | 'NO'

export type PublicationLabel = 'newsletter' | 'social_media' | 'website'

export type PhotoStudentTag = {
  student_id: string
  name: string | null
  profile_image_url: string | null
  consent_level: ConsentLevel | null
}

export type StudentWithConsent = {
  student_id: string
  name: string | null
  profile_image_url: string | null
  consent_level: ConsentLevel | null
}

export type TeacherPhoto = {
  id: string
  teacher_id: string
  storage_path: string
  signed_url: string | null
  caption: string | null
  taken_on: string | null
  created_at: string
  tags: PhotoStudentTag[]
  publication_labels: string[]
}

export async function getPhotos(): Promise<TeacherPhoto[]> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const adminClient = createAdminClient()
  const { data, error } = await adminClient.rpc('get_teacher_photos', { p_teacher_id: user.id })

  if (error) {
    console.error('[getPhotos] RPC error:', error)
    return []
  }

  if (!data) return []

  return (data as any[]).map((p: any) => ({
    id: p.id,
    teacher_id: p.teacher_id,
    storage_path: p.storage_path,
    signed_url: null,
    caption: p.caption ?? null,
    taken_on: p.taken_on ?? null,
    created_at: p.created_at,
    tags: (p.tags ?? []) as PhotoStudentTag[],
    publication_labels: (p.publication_labels ?? []) as string[],
  }))
}

export async function getSignedUrls(storagePaths: string[]): Promise<Record<string, string>> {
  if (storagePaths.length === 0) return {}
  const adminClient = createAdminClient()
  const bucket = adminClient.storage.from('teacher-photos')
  const entries = await Promise.all(
    storagePaths.map(async (path) => {
      const { data } = await bucket.createSignedUrl(path, 3600)
      return [path, data?.signedUrl ?? null] as const
    })
  )
  return Object.fromEntries(entries.filter(([, url]) => url !== null)) as Record<string, string>
}

export async function getFullResSignedUrl(storagePath: string): Promise<string | null> {
  const adminClient = createAdminClient()
  const { data } = await adminClient.storage.from('teacher-photos').createSignedUrl(storagePath, 3600)
  return data?.signedUrl ?? null
}

export async function getPhotoSignedUrlsBatch(
  storagePaths: string[]
): Promise<Record<string, string>> {
  if (storagePaths.length === 0) return {}
  const adminClient = createAdminClient()
  const { data } = await adminClient.storage
    .from('teacher-photos')
    .createSignedUrls(storagePaths, 3600)
  return Object.fromEntries(
    (data ?? []).filter((e) => e.signedUrl).map((e) => [e.path, e.signedUrl])
  ) as Record<string, string>
}

export async function getAllSchoolPhotos(): Promise<TeacherPhoto[]> {
  const adminClient = createAdminClient()
  const { data, error } = await adminClient.rpc('get_all_school_photos')
  if (error || !data) return []
  return (data as any[]).map((p: any) => ({
    id: p.id,
    teacher_id: p.teacher_id,
    storage_path: p.storage_path,
    signed_url: null,
    caption: p.caption ?? null,
    taken_on: p.taken_on ?? null,
    created_at: p.created_at,
    tags: (p.tags ?? []) as PhotoStudentTag[],
    publication_labels: (p.publication_labels ?? []) as string[],
  }))
}

export async function getEnrolledStudentsWithConsent(): Promise<StudentWithConsent[]> {
  const adminClient = createAdminClient()

  const { data: enrolledApps } = await adminClient
    .schema('parent_app')
    .from('applications')
    .select('student_id')
    .eq('status', 'enrolled')

  if (!enrolledApps || enrolledApps.length === 0) return []

  const studentIds = [...new Set(enrolledApps.map((r) => r.student_id).filter(Boolean))]

  const [{ data: students }, { data: consentRows }] = await Promise.all([
    adminClient
      .schema('admin')
      .from('students')
      .select('id, child_legal_name, profile_image_url')
      .in('id', studentIds)
      .eq('is_deleted', false)
      .order('child_legal_name'),
    adminClient
      .schema('parent_app')
      .from('student_photo_release_consent')
      .select('student_id, consent_level')
      .in('student_id', studentIds),
  ])

  const consentMap = new Map((consentRows ?? []).map((c) => [c.student_id, c.consent_level as ConsentLevel]))

  return (students ?? []).map((s) => ({
    student_id: s.id,
    name: s.child_legal_name ?? null,
    profile_image_url: s.profile_image_url ?? null,
    consent_level: consentMap.get(s.id) ?? null,
  }))
}

export async function uploadPhoto(
  formData: FormData
): Promise<{ error?: string; data?: TeacherPhoto }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const file = formData.get('file') as File
  const caption = (formData.get('caption') as string | null) || null
  const takenOn = (formData.get('taken_on') as string | null) || null

  if (!file) return { error: 'No file provided' }

  const adminClient = createAdminClient()
  const photoId = crypto.randomUUID()
  const storagePath = `${user.id}/${photoId}/${Date.now()}.webp`

  const { error: uploadError } = await adminClient.storage
    .from('teacher-photos')
    .upload(storagePath, file, { contentType: 'image/webp', upsert: false })

  if (uploadError) {
    console.error('[uploadPhoto] storage upload error:', uploadError)
    return { error: uploadError.message }
  }

  const { data: row, error: insertError } = await adminClient
    .schema('teachers')
    .from('photos')
    .insert({ id: photoId, teacher_id: user.id, storage_path: storagePath, caption, taken_on: takenOn, publication_labels: [] })
    .select('id, teacher_id, storage_path, caption, taken_on, created_at')
    .single()

  if (insertError || !row) {
    console.error('[uploadPhoto] DB insert error:', insertError)
    await adminClient.storage.from('teacher-photos').remove([storagePath])
    return { error: insertError?.message ?? 'Failed to save photo' }
  }

  const { data: signed } = await adminClient.storage.from('teacher-photos').createSignedUrl(storagePath, 3600)

  return {
    data: {
      id: row.id,
      teacher_id: row.teacher_id,
      storage_path: row.storage_path,
      signed_url: signed?.signedUrl ?? null,
      caption: row.caption ?? null,
      taken_on: row.taken_on ?? null,
      created_at: row.created_at,
      tags: [],
      publication_labels: [],
    },
  }
}

export async function updatePhotoMeta({
  photoId,
  caption,
  takenOn,
  publicationLabels,
}: {
  photoId: string
  caption: string | null
  takenOn: string | null
  publicationLabels: string[]
}): Promise<{ error?: string }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const adminClient = createAdminClient()
  const { error } = await adminClient
    .schema('teachers')
    .from('photos')
    .update({ caption, taken_on: takenOn, publication_labels: publicationLabels, updated_at: new Date().toISOString() })
    .eq('id', photoId)
    .eq('teacher_id', user.id)

  if (error) return { error: error.message }
  return {}
}

export async function setPhotoTags({
  photoId,
  studentIds,
}: {
  photoId: string
  studentIds: string[]
}): Promise<{ error?: string }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const adminClient = createAdminClient()

  const { data: photo } = await adminClient
    .schema('teachers')
    .from('photos')
    .select('id')
    .eq('id', photoId)
    .eq('teacher_id', user.id)
    .single()

  if (!photo) return { error: 'Photo not found' }

  await adminClient.schema('teachers').from('photo_student_tags').delete().eq('photo_id', photoId)

  if (studentIds.length > 0) {
    const { error } = await adminClient
      .schema('teachers')
      .from('photo_student_tags')
      .insert(studentIds.map((student_id) => ({ photo_id: photoId, student_id })))
    if (error) return { error: error.message }
  }

  return {}
}

export async function deletePhoto(photoId: string): Promise<{ error?: string }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const adminClient = createAdminClient()

  const { data: photo } = await adminClient
    .schema('teachers')
    .from('photos')
    .select('storage_path')
    .eq('id', photoId)
    .eq('teacher_id', user.id)
    .single()

  if (!photo) return { error: 'Photo not found' }

  const { error } = await adminClient
    .schema('teachers')
    .from('photos')
    .update({ is_deleted: true, updated_at: new Date().toISOString() })
    .eq('id', photoId)

  if (error) return { error: error.message }

  await adminClient.storage.from('teacher-photos').remove([photo.storage_path])
  return {}
}
