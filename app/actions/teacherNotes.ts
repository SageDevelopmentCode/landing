'use server'

import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'

export type TeacherNoteAttachment = {
  id: string
  file_name: string
  file_path: string
  file_type: 'image' | 'file'
  url: string
}

export type TeacherNoteRecord = {
  id: string
  note_text: string
  category: 'general' | 'behavioral' | 'academic' | 'social' | 'health'
  is_shared: boolean
  created_at: string
  teacher_note_attachments: TeacherNoteAttachment[]
}

export async function getTeacherNotes(studentId: string): Promise<TeacherNoteRecord[]> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const adminClient = createAdminClient()

  const { data: assignment } = await adminClient
    .schema('teachers')
    .from('teacher_students')
    .select('id')
    .eq('teacher_id', user.id)
    .eq('student_id', studentId)
    .eq('is_deleted', false)
    .limit(1)
    .maybeSingle()

  if (!assignment) return []

  const { data: notes, error } = await adminClient
    .schema('teachers')
    .from('teacher_notes')
    .select('id, note_text, category, is_shared, created_at, teacher_note_attachments(id, file_name, file_path, file_type)')
    .eq('teacher_id', user.id)
    .eq('student_id', studentId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })

  if (error || !notes) return []

  const withUrls = await Promise.all(
    notes.map(async (note) => {
      const attachmentsWithUrls = await Promise.all(
        ((note.teacher_note_attachments as Omit<TeacherNoteAttachment, 'url'>[]) ?? []).map(async (att) => {
          const { data } = await adminClient.storage
            .from('teacher-note-attachments')
            .createSignedUrl(att.file_path, 60 * 60)
          return { ...att, url: data?.signedUrl ?? '' }
        })
      )
      return { ...note, teacher_note_attachments: attachmentsWithUrls } as TeacherNoteRecord
    })
  )

  return withUrls
}

export async function createTeacherNote(formData: FormData): Promise<
  { note: TeacherNoteRecord; error?: never } | { error: string; note?: never }
> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const studentId = formData.get('studentId') as string
  const noteText  = formData.get('noteText') as string
  const category  = formData.get('category') as string
  const isShared  = formData.get('isShared') === 'true'
  const files     = formData.getAll('files') as File[]

  if (!studentId || !noteText?.trim()) return { error: 'Missing required fields' }

  const adminClient = createAdminClient()

  const { data: assignment } = await adminClient
    .schema('teachers')
    .from('teacher_students')
    .select('id')
    .eq('teacher_id', user.id)
    .eq('student_id', studentId)
    .eq('is_deleted', false)
    .limit(1)
    .maybeSingle()

  if (!assignment) return { error: 'Unauthorized' }

  const { data: note, error: noteError } = await adminClient
    .schema('teachers')
    .from('teacher_notes')
    .insert({
      teacher_id: user.id,
      student_id: studentId,
      note_text: noteText.trim(),
      category,
      is_shared: isShared,
    })
    .select('id, note_text, category, is_shared, created_at')
    .single()

  if (noteError || !note) return { error: noteError?.message ?? 'Failed to create note' }

  const attachments: TeacherNoteAttachment[] = []

  for (const file of files) {
    if (!file || file.size === 0) continue

    const timestamp  = Date.now()
    const safeName   = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const path       = `${user.id}/${studentId}/${note.id}/${timestamp}-${safeName}`
    const fileType   = file.type.startsWith('image/') ? 'image' as const : 'file' as const

    const { error: uploadError } = await adminClient.storage
      .from('teacher-note-attachments')
      .upload(path, file, { contentType: file.type, upsert: false })

    if (uploadError) {
      console.error('[createTeacherNote] Upload error:', uploadError.message)
      continue
    }

    const { data: att, error: attError } = await adminClient
      .schema('teachers')
      .from('teacher_note_attachments')
      .insert({ note_id: note.id, file_name: file.name, file_path: path, file_type: fileType })
      .select('id, file_name, file_path, file_type')
      .single()

    if (attError || !att) continue

    const { data: signed } = await adminClient.storage
      .from('teacher-note-attachments')
      .createSignedUrl(path, 60 * 60)

    attachments.push({ ...att, file_type: fileType, url: signed?.signedUrl ?? '' })
  }

  return { note: { ...note, teacher_note_attachments: attachments } as TeacherNoteRecord }
}

export async function updateTeacherNote(formData: FormData): Promise<
  { note: TeacherNoteRecord; error?: never } | { error: string; note?: never }
> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const noteId   = formData.get('noteId') as string
  const noteText = formData.get('noteText') as string
  const category = formData.get('category') as string
  const isShared = formData.get('isShared') === 'true'

  if (!noteId || !noteText?.trim()) return { error: 'Missing required fields' }

  const adminClient = createAdminClient()

  const { data: existing } = await adminClient
    .schema('teachers')
    .from('teacher_notes')
    .select('id, student_id, teacher_note_attachments(id, file_name, file_path, file_type)')
    .eq('id', noteId)
    .eq('teacher_id', user.id)
    .eq('is_deleted', false)
    .maybeSingle()

  if (!existing) return { error: 'Note not found or unauthorized' }

  const { data: updated, error: updateError } = await adminClient
    .schema('teachers')
    .from('teacher_notes')
    .update({ note_text: noteText.trim(), category, is_shared: isShared })
    .eq('id', noteId)
    .select('id, note_text, category, is_shared, created_at')
    .single()

  if (updateError || !updated) return { error: updateError?.message ?? 'Failed to update note' }

  const attachmentsWithUrls = await Promise.all(
    ((existing.teacher_note_attachments as Omit<TeacherNoteAttachment, 'url'>[]) ?? []).map(async (att) => {
      const { data } = await adminClient.storage
        .from('teacher-note-attachments')
        .createSignedUrl(att.file_path, 60 * 60)
      return { ...att, url: data?.signedUrl ?? '' }
    })
  )

  return { note: { ...updated, teacher_note_attachments: attachmentsWithUrls } as TeacherNoteRecord }
}

export async function deleteTeacherNote(noteId: string): Promise<{ success: true } | { error: string }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const adminClient = createAdminClient()

  const { error } = await adminClient
    .schema('teachers')
    .from('teacher_notes')
    .update({ is_deleted: true })
    .eq('id', noteId)
    .eq('teacher_id', user.id)

  if (error) return { error: error.message }
  return { success: true }
}
