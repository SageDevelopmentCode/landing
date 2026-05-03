'use server'

import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'
import { sendDiscordNotification, createAftercareEmbed } from '@/app/lib/discord'

const STUDENT_WEBHOOK = process.env.DISCORD_AFTERCARE_WEBHOOK_URL

export type AftercareRecord = {
  id: string
  date: string
  student_id: string
  pickup_time: string | null
  recorded_by: string
  notes: string | null
}

export type AftercareStudentRow = {
  student_id: string
  name: string | null
  grade: string | null
  profile_image_url: string | null
  record: AftercareRecord | null
}

export async function getAftercareStudentsForDate(date: string): Promise<AftercareStudentRow[]> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const adminClient = createAdminClient()

  const [{ data: students }, { data: enrolledApps }] = await Promise.all([
    adminClient
      .schema('admin')
      .from('students')
      .select('id, child_legal_name, child_grade, profile_image_url')
      .eq('is_deleted', false)
      .order('child_legal_name'),
    adminClient
      .schema('parent_app')
      .from('applications')
      .select('student_id')
      .eq('status', 'enrolled'),
  ])

  const enrolledIds = new Set((enrolledApps ?? []).map((a: { student_id: string }) => a.student_id).filter(Boolean))
  const enrolledStudents = (students ?? []).filter((s: { id: string }) => enrolledIds.has(s.id))

  if (enrolledStudents.length === 0) return []

  const studentIds = enrolledStudents.map((s: { id: string }) => s.id)

  const { data: records } = await adminClient
    .schema('attendance')
    .from('aftercare_records')
    .select('id, date, student_id, pickup_time, recorded_by, notes')
    .eq('date', date)
    .in('student_id', studentIds)

  const recordMap = new Map<string, AftercareRecord>()
  for (const r of records ?? []) {
    recordMap.set(r.student_id, {
      id: r.id,
      date: r.date,
      student_id: r.student_id,
      pickup_time: r.pickup_time ?? null,
      recorded_by: r.recorded_by,
      notes: r.notes ?? null,
    })
  }

  return enrolledStudents.map((s: { id: string; child_legal_name: string | null; child_grade: string | null; profile_image_url: string | null }) => ({
    student_id: s.id,
    name: s.child_legal_name,
    grade: s.child_grade,
    profile_image_url: s.profile_image_url ?? null,
    record: recordMap.get(s.id) ?? null,
  }))
}

export async function upsertAfterCareRecord(
  studentId: string,
  date: string,
  pickupTime: string | null,
): Promise<AftercareRecord | null> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const adminClient = createAdminClient()
  const { data, error } = await adminClient
    .schema('attendance')
    .from('aftercare_records')
    .upsert(
      {
        student_id: studentId,
        date,
        pickup_time: pickupTime ?? null,
        recorded_by: user.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'student_id,date' },
    )
    .select('id, date, student_id, pickup_time, recorded_by, notes')
    .single()

  if (error || !data) return null

  const record: AftercareRecord = {
    id: data.id,
    date: data.date,
    student_id: data.student_id,
    pickup_time: data.pickup_time ?? null,
    recorded_by: data.recorded_by,
    notes: data.notes ?? null,
  }

  // Fire-and-forget Discord notification
  adminClient
    .schema('admin')
    .from('students')
    .select('child_legal_name')
    .eq('id', studentId)
    .single()
    .then(({ data: student }) => {
      const studentName = student?.child_legal_name ?? 'Unknown Student'
      const event = pickupTime ? 'pickup_time_set' : 'checked_in'
      void sendDiscordNotification(
        createAftercareEmbed({ studentName, date, event, pickupTime }),
        STUDENT_WEBHOOK,
      )
    })

  return record
}

export async function removeAfterCareRecord(recordId: string): Promise<{ ok: boolean }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false }

  const adminClient = createAdminClient()

  // Fetch record details before deleting so we can notify
  const { data: existing } = await adminClient
    .schema('attendance')
    .from('aftercare_records')
    .select('student_id, date')
    .eq('id', recordId)
    .single()

  const { error } = await adminClient
    .schema('attendance')
    .from('aftercare_records')
    .delete()
    .eq('id', recordId)

  if (!error && existing) {
    adminClient
      .schema('admin')
      .from('students')
      .select('child_legal_name')
      .eq('id', existing.student_id)
      .single()
      .then(({ data: student }) => {
        void sendDiscordNotification(
          createAftercareEmbed({
            studentName: student?.child_legal_name ?? 'Unknown Student',
            date: existing.date,
            event: 'checked_out',
          }),
          STUDENT_WEBHOOK,
        )
      })
  }

  return { ok: !error }
}
