'use server'

import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'
import { sendDiscordNotification, createCareLogEmbed } from '@/app/lib/discord'

const STUDENT_WEBHOOK = process.env.DISCORD_STUDENT_WEBHOOK_URL

export type CareActivity = 'sunscreen' | 'bug_spray'

export type CareLogEntry = {
  id: string
  activity: CareActivity
  logged_at: string
  notes: string | null
}

export type CareLogStudentRow = {
  student_id: string
  name: string | null
  grade: string | null
  profile_image_url: string | null
  entries: CareLogEntry[]
}

export async function getCareLogStudentsForDate(date: string): Promise<CareLogStudentRow[]> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const adminClient = createAdminClient()

  const [{ data: students }, { data: enrolledApps }, { data: existingEntries }] = await Promise.all([
    adminClient
      .schema('admin')
      .from('students')
      .select('id, child_legal_name, child_grade, profile_image_url')
      .eq('is_deleted', false)
      .order('child_legal_name'),
    adminClient
      .schema('parent_app')
      .from('applications')
      .select('student_id, admin_tags')
      .eq('status', 'enrolled'),
    adminClient
      .schema('care_log')
      .from('entries')
      .select('id, student_id, activity, logged_at, notes')
      .eq('date', date)
      .order('logged_at', { ascending: true }),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const enrolledIds = new Set((enrolledApps ?? []).map((a: any) => a.student_id).filter(Boolean))
  const dontIncludeIds = new Set(
    (enrolledApps ?? [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((a: any) => (a.admin_tags ?? []).includes("Don't Include"))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((a: any) => a.student_id)
      .filter(Boolean)
  )
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const enrolledStudents = (students ?? []).filter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (s: any) => enrolledIds.has(s.id) && !dontIncludeIds.has(s.id)
  )

  if (enrolledStudents.length === 0) return []

  const entryMap = new Map<string, CareLogEntry[]>()
  for (const e of existingEntries ?? []) {
    const arr = entryMap.get(e.student_id) ?? []
    arr.push({
      id: e.id,
      activity: e.activity as CareActivity,
      logged_at: e.logged_at,
      notes: e.notes ?? null,
    })
    entryMap.set(e.student_id, arr)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return enrolledStudents.map((s: any) => ({
    student_id: s.id,
    name: s.child_legal_name,
    grade: s.child_grade,
    profile_image_url: s.profile_image_url ?? null,
    entries: entryMap.get(s.id) ?? [],
  }))
}

export async function logCareActivityBatch(
  studentIds: string[],
  date: string,
  activity: CareActivity,
  notes?: string | null,
): Promise<Map<string, CareLogEntry>> {
  if (studentIds.length === 0) return new Map()

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Map()

  const adminClient = createAdminClient()

  const rows = studentIds.map((sid) => ({
    student_id: sid,
    activity,
    date,
    logged_by: user.id,
    notes: notes ?? null,
  }))

  const { data, error } = await adminClient
    .schema('care_log')
    .from('entries')
    .insert(rows)
    .select('id, student_id, activity, logged_at, notes')

  if (error || !data) {
    console.error('[careLog] logCareActivityBatch error:', error)
    return new Map()
  }

  const result = new Map<string, CareLogEntry>()
  for (const d of data) {
    result.set(d.student_id, {
      id: d.id,
      activity: d.activity as CareActivity,
      logged_at: d.logged_at,
      notes: d.notes ?? null,
    })
  }

  // fire-and-forget Discord notification
  void (async () => {
    const [{ data: teacher }, { data: studentRows }] = await Promise.all([
      adminClient.schema('admin').from('users').select('full_name').eq('id', user.id).single(),
      adminClient.schema('admin').from('students').select('child_legal_name').in('id', studentIds),
    ])
    const embed = createCareLogEmbed({
      teacherName: teacher?.full_name ?? 'Unknown',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      studentNames: (studentRows ?? []).map((s: any) => s.child_legal_name ?? '—'),
      activity,
      date,
    })
    sendDiscordNotification(embed, STUDENT_WEBHOOK)
  })()

  return result
}

export async function logCareActivity(
  studentId: string,
  date: string,
  activity: CareActivity,
  notes?: string | null,
): Promise<CareLogEntry | null> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const adminClient = createAdminClient()

  const { data, error } = await adminClient
    .schema('care_log')
    .from('entries')
    .insert({
      student_id: studentId,
      activity,
      date,
      logged_by: user.id,
      notes: notes ?? null,
    })
    .select('id, activity, logged_at, notes')
    .single()

  if (error || !data) {
    console.error('[careLog] logCareActivity error:', error)
    return null
  }

  // fire-and-forget Discord notification
  void (async () => {
    const [{ data: teacher }, { data: studentRows }] = await Promise.all([
      adminClient.schema('admin').from('users').select('full_name').eq('id', user.id).single(),
      adminClient.schema('admin').from('students').select('child_legal_name').in('id', [studentId]),
    ])
    const embed = createCareLogEmbed({
      teacherName: teacher?.full_name ?? 'Unknown',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      studentNames: (studentRows ?? []).map((s: any) => s.child_legal_name ?? '—'),
      activity,
      date,
    })
    sendDiscordNotification(embed, STUDENT_WEBHOOK)
  })()

  return {
    id: data.id,
    activity: data.activity as CareActivity,
    logged_at: data.logged_at,
    notes: data.notes ?? null,
  }
}
