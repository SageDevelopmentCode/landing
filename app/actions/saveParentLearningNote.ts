'use server'

import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'
import { sendDiscordNotification, createErrorEmbed } from '@/app/lib/discord'

function createLearningNoteEmbed(data: {
  parentName: string
  parentEmail: string
  childName: string
  category: LearningNoteCategory
  noteText: string
}) {
  const CATEGORY_LABELS: Record<LearningNoteCategory, string> = {
    academic: 'Academic',
    social: 'Social',
    behavioral: 'Behavioral',
    health: 'Health',
    other: 'Other',
  }
  return {
    title: '📝 New Parent Special Request',
    color: 0x4a7c59,
    fields: [
      { name: 'Parent', value: data.parentName || 'N/A', inline: true },
      { name: 'Email', value: data.parentEmail || 'N/A', inline: true },
      { name: 'Child', value: data.childName || 'N/A', inline: true },
      { name: 'Category', value: CATEGORY_LABELS[data.category], inline: true },
      { name: 'Note', value: data.noteText.length > 1024 ? data.noteText.substring(0, 1021) + '...' : data.noteText, inline: false },
    ],
    timestamp: new Date().toISOString(),
  }
}

export type LearningNoteCategory = 'academic' | 'social' | 'behavioral' | 'health' | 'other'

export interface LearningNote {
  id: string
  parent_id: string
  student_id: string
  category: LearningNoteCategory
  note_text: string
  is_deleted: boolean
  created_at: string
  updated_at: string
}

export async function saveParentLearningNote(payload: {
  studentId: string
  category: LearningNoteCategory
  noteText: string
}): Promise<{ error?: string; note?: LearningNote }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  if (!payload.studentId?.trim()) return { error: 'Missing student ID' }
  if (!payload.noteText?.trim()) return { error: 'Note cannot be empty' }

  const adminClient = createAdminClient()

  const { data, error } = await adminClient
    .schema('parent_app')
    .from('student_learning_notes')
    .insert({
      parent_id: user.id,
      student_id: payload.studentId,
      category: payload.category,
      note_text: payload.noteText.trim(),
    })
    .select()
    .single()

  if (error) {
    void (async () => {
      let parentName = 'N/A', childName = 'N/A'
      try {
        const [{ data: u }, { data: s }] = await Promise.all([
          adminClient.schema('admin').from('users').select('full_name').eq('id', user.id).single(),
          adminClient.schema('admin').from('students').select('child_legal_name').eq('id', payload.studentId).single(),
        ])
        parentName = u?.full_name ?? 'N/A'
        childName = s?.child_legal_name ?? 'N/A'
      } catch {}
      await sendDiscordNotification(createErrorEmbed({
        context: 'Parent Learning Note – Insert',
        error: error.message,
        details: { 'Parent': parentName, 'Email': user.email ?? 'N/A', 'Child': childName, 'Student ID': payload.studentId },
      }))
    })().catch(() => {})
    return { error: error.message }
  }

  // Notify Discord of the new request (fire-and-forget)
  void (async () => {
    let parentName = 'N/A', childName = 'N/A'
    try {
      const [{ data: u }, { data: s }] = await Promise.all([
        adminClient.schema('admin').from('users').select('full_name').eq('id', user.id).single(),
        adminClient.schema('admin').from('students').select('child_legal_name').eq('id', payload.studentId).single(),
      ])
      parentName = u?.full_name ?? 'N/A'
      childName = s?.child_legal_name ?? 'N/A'
    } catch {}
    await sendDiscordNotification(createLearningNoteEmbed({
      parentName,
      parentEmail: user.email ?? 'N/A',
      childName,
      category: payload.category,
      noteText: payload.noteText.trim(),
    }))
  })().catch(() => {})

  return { note: data as LearningNote }
}

export async function updateParentLearningNote(payload: {
  noteId: string
  category: LearningNoteCategory
  noteText: string
}): Promise<{ error?: string; note?: LearningNote }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  if (!payload.noteText?.trim()) return { error: 'Note cannot be empty' }

  const adminClient = createAdminClient()

  const { data, error } = await adminClient
    .schema('parent_app')
    .from('student_learning_notes')
    .update({
      category: payload.category,
      note_text: payload.noteText.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', payload.noteId)
    .eq('parent_id', user.id)
    .select()
    .single()

  if (error) {
    void sendDiscordNotification(createErrorEmbed({
      context: 'Parent Learning Note – Update',
      error: error.message,
      details: { 'Note ID': payload.noteId, 'Parent': user.id },
    })).catch(() => {})
    return { error: error.message }
  }

  return { note: data as LearningNote }
}

export async function deleteParentLearningNote(noteId: string): Promise<{ error?: string }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const adminClient = createAdminClient()

  const { error } = await adminClient
    .schema('parent_app')
    .from('student_learning_notes')
    .update({ is_deleted: true, updated_at: new Date().toISOString() })
    .eq('id', noteId)
    .eq('parent_id', user.id)

  if (error) {
    void sendDiscordNotification(createErrorEmbed({
      context: 'Parent Learning Note – Delete',
      error: error.message,
      details: { 'Note ID': noteId, 'Parent': user.id },
    })).catch(() => {})
    return { error: error.message }
  }

  return {}
}
