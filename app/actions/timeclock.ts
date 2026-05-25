'use server'

import { createAdminClient, createServerSupabaseClient } from '@/app/lib/supabase-server'
import { sendDiscordNotification, createTeacherClockInEmbed, createTeacherClockOutEmbed } from '@/app/lib/discord'

export type { ClockSession, SessionsByDay } from './teacherHours'

import type { ClockSession, SessionsByDay } from './teacherHours'

export type TimeclockTeacher = {
  id: string
  full_name: string | null
  profile_image_url: string | null
}

function toLocalDateKey(isoTimestamp: string): string {
  const d = new Date(isoTimestamp)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export async function lookupEmployeeByCode(code: string): Promise<TimeclockTeacher | null> {
  if (!/^\d{5}$/.test(code)) return null

  const adminClient = createAdminClient()
  const { data, error } = await adminClient
    .schema('admin')
    .from('users')
    .select('id, full_name, profile_image_url')
    .eq('employee_code', code)
    .in('role', ['teacher', 'super_admin'])
    .eq('is_deleted', false)
    .single()

  if (error || !data) return null
  return {
    id: data.id,
    full_name: data.full_name ?? null,
    profile_image_url: (data as { id: string; full_name: string | null; profile_image_url?: string | null }).profile_image_url ?? null,
  }
}

export async function getTeacherSessionsByUserId(userId: string): Promise<SessionsByDay> {
  const adminClient = createAdminClient()
  const { data, error } = await adminClient
    .schema('teachers')
    .from('clock_sessions')
    .select('id, clock_in_at, clock_out_at, note')
    .eq('teacher_id', userId)
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

export async function clockInByUserId(userId: string, teacherName: string | null): Promise<ClockSession | null> {
  const adminClient = createAdminClient()
  const { data, error } = await adminClient
    .schema('teachers')
    .from('clock_sessions')
    .insert({ teacher_id: userId, clock_in_at: new Date().toISOString() })
    .select('id, clock_in_at, clock_out_at, note')
    .single()

  if (error || !data) return null

  const session: ClockSession = {
    id: data.id,
    clockInAt: data.clock_in_at,
    clockOutAt: data.clock_out_at ?? null,
    note: data.note ?? '',
  }

  sendDiscordNotification(
    createTeacherClockInEmbed({
      teacherName: teacherName ?? 'Unknown',
      clockInAt: session.clockInAt,
    }),
    process.env.DISCORD_EMPLOYEE_WEBHOOK_URL,
  )

  return session
}

export async function clockOutByUserId(sessionId: string, userId: string, teacherName: string | null): Promise<string | null> {
  const now = new Date().toISOString()
  const adminClient = createAdminClient()

  const { data: session } = await adminClient
    .schema('teachers')
    .from('clock_sessions')
    .select('clock_in_at')
    .eq('id', sessionId)
    .eq('teacher_id', userId)
    .single()

  const { error } = await adminClient
    .schema('teachers')
    .from('clock_sessions')
    .update({ clock_out_at: now })
    .eq('id', sessionId)
    .eq('teacher_id', userId)

  if (error) return null

  if (session) {
    sendDiscordNotification(
      createTeacherClockOutEmbed({
        teacherName: teacherName ?? 'Unknown',
        clockInAt: session.clock_in_at,
        clockOutAt: now,
      }),
      process.env.DISCORD_EMPLOYEE_WEBHOOK_URL,
    )
  }

  return now
}

export async function updateSessionNoteByUserId(sessionId: string, note: string, userId: string): Promise<void> {
  const adminClient = createAdminClient()
  await adminClient
    .schema('teachers')
    .from('clock_sessions')
    .update({ note })
    .eq('id', sessionId)
    .eq('teacher_id', userId)
}

export async function deleteSessionByUserId(sessionId: string, userId: string): Promise<void> {
  const adminClient = createAdminClient()
  await adminClient
    .schema('teachers')
    .from('clock_sessions')
    .delete()
    .eq('id', sessionId)
    .eq('teacher_id', userId)
}

export type ClockSessionWithTeacher = {
  id: string
  teacher_id: string
  clock_in_at: string
  clock_out_at: string | null
  note: string | null
  created_at: string
  full_name: string | null
  profile_image_url: string | null
}

export async function getClockSessionsForDate(date: string): Promise<ClockSessionWithTeacher[]> {
  const adminClient = createAdminClient()

  const nextUtcDay = new Date(date + 'T00:00:00.000Z')
  nextUtcDay.setUTCDate(nextUtcDay.getUTCDate() + 1)
  const nextDayStr = nextUtcDay.toISOString().slice(0, 10)

  const { data: sessions } = await adminClient
    .schema('teachers')
    .from('clock_sessions')
    .select('id, teacher_id, clock_in_at, clock_out_at, note, created_at')
    .gte('clock_in_at', `${date}T00:00:00+00`)
    .lt('clock_in_at', `${nextDayStr}T00:00:00+00`)
    .order('clock_in_at', { ascending: false })

  if (!sessions || sessions.length === 0) return []

  const teacherIds = [...new Set((sessions as Array<{ teacher_id: string }>).map((s) => s.teacher_id))]
  const { data: users } = await adminClient
    .schema('admin')
    .from('users')
    .select('id, full_name, profile_image_url')
    .in('id', teacherIds)

  const userMap: Record<string, { full_name: string | null; profile_image_url: string | null }> = {}
  for (const u of (users ?? []) as Array<{ id: string; full_name: string | null; profile_image_url: string | null }>) {
    userMap[u.id] = { full_name: u.full_name, profile_image_url: u.profile_image_url }
  }

  return (sessions as Array<{
    id: string; teacher_id: string; clock_in_at: string
    clock_out_at: string | null; note: string | null; created_at: string
  }>).map((s) => ({
    ...s,
    full_name: userMap[s.teacher_id]?.full_name ?? null,
    profile_image_url: userMap[s.teacher_id]?.profile_image_url ?? null,
  }))
}

export async function setEmployeeCode(teacherId: string, code: string): Promise<{ error?: string }> {
  // Validate caller is super_admin
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const adminClient = createAdminClient()
  const { data: caller } = await adminClient
    .schema('admin')
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (caller?.role !== 'super_admin') return { error: 'Unauthorized' }

  if (!/^\d{5}$/.test(code)) return { error: 'Code must be exactly 5 digits' }

  const { error } = await adminClient
    .schema('admin')
    .from('users')
    .update({ employee_code: code })
    .eq('id', teacherId)

  if (error) {
    if (error.code === '23505') return { error: 'That code is already assigned to another employee' }
    return { error: 'Failed to save code' }
  }

  return {}
}
