'use server'

import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DBTeacherUpdate {
  id: string
  section_id: string
  teacher_id: string
  body: string
  updated_at: string
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

export interface DBNewsletter {
  id: string
  title: string
  week_range: string
  status: 'draft' | 'published'
  view_mode: 'traditional' | 'slideshow'
  created_by: string
  published_at: string | null
  created_at: string
  updated_at: string
  sections: DBSection[]
  change_log: DBChangeEntry[]
}

// ─── Read ──────────────────────────────────────────────────────────────────────

export async function getNewsletters(): Promise<DBNewsletter[]> {
  const adminClient = createAdminClient()

  const { data: rows, error } = await adminClient
    .schema('newsletters')
    .from('newsletters')
    .select(`
      id, title, week_range, status, view_mode, created_by, published_at, created_at, updated_at,
      sections:sections(
        id, newsletter_id, label, body, visible, sort_order, is_class_updates, created_at, updated_at,
        teacher_updates:teacher_updates(id, section_id, teacher_id, body, updated_at)
      ),
      change_log:change_log(id, newsletter_id, teacher_id, summary, created_at)
    `)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getNewsletters error:', error)
    return []
  }

  if (!rows || rows.length === 0) return []

  // Collect teacher IDs from change_log rows to resolve names/avatars
  const teacherIds = new Set<string>()
  for (const row of rows) {
    for (const entry of (row.change_log as any[]) ?? []) {
      teacherIds.add(entry.teacher_id)
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

  return rows.map((row) => ({
    ...row,
    status: row.status as 'draft' | 'published',
    view_mode: row.view_mode as 'traditional' | 'slideshow',
    sections: ((row.sections as any[]) ?? [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((s) => ({
        ...s,
        teacher_updates: (s.teacher_updates as DBTeacherUpdate[]) ?? [],
      })),
    change_log: ((row.change_log as any[]) ?? [])
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
    { label: 'Welcome Message',  is_class_updates: false, sort_order: 0 },
    { label: 'Class Updates',    is_class_updates: true,  sort_order: 1 },
    { label: 'Upcoming Events',  is_class_updates: false, sort_order: 2 },
    { label: 'Parent Reminders', is_class_updates: false, sort_order: 3 },
    { label: 'Photo Gallery',    is_class_updates: false, sort_order: 4 },
  ]

  const { data: sections, error: secError } = await adminClient
    .schema('newsletters')
    .from('sections')
    .insert(
      defaultSections.map((s) => ({
        newsletter_id: newsletter.id,
        label: s.label,
        body: '',
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
  newsletterId: string
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const adminClient = createAdminClient()

  const { error } = await adminClient
    .schema('newsletters')
    .from('newsletters')
    .update({ status: 'published', published_at: new Date().toISOString() })
    .eq('id', newsletterId)

  if (error) {
    console.error('publishNewsletter error:', error)
    return { error: error.message }
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
