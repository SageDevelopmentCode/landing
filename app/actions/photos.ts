'use server'

import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'

export type ConsentLevel = 'FULL' | 'LIMITED' | 'NO'

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
}

export async function getPhotos(): Promise<TeacherPhoto[]> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const adminClient = createAdminClient()

  const { data: photos } = await adminClient
    .schema('teachers')
    .from('photos')
    .select('id, teacher_id, storage_path, caption, taken_on, created_at')
    .eq('teacher_id', user.id)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })

  if (!photos || photos.length === 0) return []

  const photoIds = photos.map((p) => p.id)
  const storagePaths = photos.map((p) => p.storage_path)

  const [{ data: tagRows }, { data: signedUrls }] = await Promise.all([
    adminClient
      .schema('teachers')
      .from('photo_student_tags')
      .select('photo_id, student_id')
      .in('photo_id', photoIds),
    adminClient.storage.from('teacher-photos').createSignedUrls(storagePaths, 3600),
  ])

  const signedMap = new Map<string, string>()
  for (const entry of signedUrls ?? []) {
    if (entry.signedUrl && entry.path) signedMap.set(entry.path, entry.signedUrl)
  }

  const studentIds = [...new Set((tagRows ?? []).map((t) => t.student_id))]
  const studentMap = new Map<string, { name: string | null; profile_image_url: string | null; consent_level: ConsentLevel | null }>()

  if (studentIds.length > 0) {
    const [{ data: students }, { data: consentRows }] = await Promise.all([
      adminClient
        .schema('admin')
        .from('students')
        .select('id, child_legal_name, profile_image_url')
        .in('id', studentIds),
      adminClient
        .schema('parent_app')
        .from('student_photo_release_consent')
        .select('student_id, consent_level')
        .in('student_id', studentIds),
    ])
    const consentMap = new Map((consentRows ?? []).map((c) => [c.student_id, c.consent_level as ConsentLevel]))
    for (const s of students ?? []) {
      studentMap.set(s.id, {
        name: s.child_legal_name ?? null,
        profile_image_url: s.profile_image_url ?? null,
        consent_level: consentMap.get(s.id) ?? null,
      })
    }
  }

  const tagsMap = new Map<string, PhotoStudentTag[]>()
  for (const tag of tagRows ?? []) {
    const list = tagsMap.get(tag.photo_id) ?? []
    const student = studentMap.get(tag.student_id)
    list.push({
      student_id: tag.student_id,
      name: student?.name ?? null,
      profile_image_url: student?.profile_image_url ?? null,
      consent_level: student?.consent_level ?? null,
    })
    tagsMap.set(tag.photo_id, list)
  }

  return photos.map((p) => ({
    id: p.id,
    teacher_id: p.teacher_id,
    storage_path: p.storage_path,
    signed_url: signedMap.get(p.storage_path) ?? null,
    caption: p.caption ?? null,
    taken_on: p.taken_on ?? null,
    created_at: p.created_at,
    tags: tagsMap.get(p.id) ?? [],
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
    .insert({ id: photoId, teacher_id: user.id, storage_path: storagePath, caption, taken_on: takenOn })
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
    },
  }
}

export async function updatePhotoMeta({
  photoId,
  caption,
  takenOn,
}: {
  photoId: string
  caption: string | null
  takenOn: string | null
}): Promise<{ error?: string }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const adminClient = createAdminClient()
  const { error } = await adminClient
    .schema('teachers')
    .from('photos')
    .update({ caption, taken_on: takenOn, updated_at: new Date().toISOString() })
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
