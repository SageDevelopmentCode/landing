'use server'

import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'

export type ClockSession = {
  id: string
  clockInAt: string       // ISO timestamp string
  clockOutAt: string | null
  note: string
}

// Keyed by local date "YYYY-MM-DD"
export type SessionsByDay = {
  [isoDate: string]: ClockSession[]
}

function toLocalDateKey(isoTimestamp: string): string {
  // Parse as local date to avoid UTC offset shifting the day
  const d = new Date(isoTimestamp)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export async function getTeacherSessions(): Promise<SessionsByDay> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return {}

  const adminClient = createAdminClient()
  const { data, error } = await adminClient
    .schema('teachers')
    .from('clock_sessions')
    .select('id, clock_in_at, clock_out_at, note')
    .eq('teacher_id', user.id)
    .order('clock_in_at', { ascending: true })

  if (error || !data) return {}

  const grouped: SessionsByDay = {}
  for (const row of data) {
    const dateKey = toLocalDateKey(row.clock_in_at)
    if (!grouped[dateKey]) grouped[dateKey] = []
    grouped[dateKey].push({
      id: row.id,
      clockInAt: row.clock_in_at,
      clockOutAt: row.clock_out_at ?? null,
      note: row.note ?? '',
    })
  }
  return grouped
}

export async function clockIn(): Promise<ClockSession | null> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const adminClient = createAdminClient()
  const { data, error } = await adminClient
    .schema('teachers')
    .from('clock_sessions')
    .insert({ teacher_id: user.id, clock_in_at: new Date().toISOString() })
    .select('id, clock_in_at, clock_out_at, note')
    .single()

  if (error || !data) return null
  return {
    id: data.id,
    clockInAt: data.clock_in_at,
    clockOutAt: data.clock_out_at ?? null,
    note: data.note ?? '',
  }
}

export async function clockOut(sessionId: string): Promise<string | null> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const now = new Date().toISOString()
  const adminClient = createAdminClient()
  await adminClient
    .schema('teachers')
    .from('clock_sessions')
    .update({ clock_out_at: now })
    .eq('id', sessionId)
    .eq('teacher_id', user.id)

  return now
}

export async function deleteSession(sessionId: string): Promise<void> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const adminClient = createAdminClient()
  await adminClient
    .schema('teachers')
    .from('clock_sessions')
    .delete()
    .eq('id', sessionId)
    .eq('teacher_id', user.id)
}

export async function updateSessionNote(sessionId: string, note: string): Promise<void> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const adminClient = createAdminClient()
  await adminClient
    .schema('teachers')
    .from('clock_sessions')
    .update({ note })
    .eq('id', sessionId)
    .eq('teacher_id', user.id)
}
