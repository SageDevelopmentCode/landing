'use server'

import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'
import { sendDiscordNotification } from '@/app/lib/discord'

const FIELD_FRIDAY_WEBHOOK = process.env.DISCORD_FIELD_FRIDAY_WEBHOOK_URL

export type FieldFridayRecord = {
  id: string
  date: string
  student_id: string
  pickup_time: string | null
  picked_up_by_name: string | null
  picked_up_by_relationship: string | null
  recorded_by: string
  notes: string | null
  paid_for_day: boolean
}

export type FieldFridayStudentRow = {
  student_id: string
  name: string | null
  grade: string | null
  profile_image_url: string | null
  record: FieldFridayRecord | null
  hasEnrollment: boolean
}

function dateToFunFridayMonthKey(dateStr: string): string | null {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dow = new Date(y, m - 1, d).getDay()
  if (dow !== 5) return null
  if (y === 2026) {
    if (m === 5) return 'may'
    if (m === 6) return 'jun'
    if (m === 7) return 'jul'
    if (m === 8) return 'aug'
  }
  return null
}

export async function getFieldFridayStudentsForDate(date: string): Promise<FieldFridayStudentRow[]> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const adminClient = createAdminClient()

  const [{ data: students }, { data: enrolledApps }, { data: funFridayTxData }] = await Promise.all([
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
      .schema('billing')
      .from('stripe_transactions')
      .select('student_id, metadata')
      .eq('payment_type', 'fun_friday_tuition')
      .eq('status', 'completed')
      .eq('is_deleted', false),
  ])

  const enrolledIds = new Set((enrolledApps ?? []).map((a: { student_id: string; admin_tags: string[] | null }) => a.student_id).filter(Boolean))
  const dontIncludeIds = new Set(
    (enrolledApps ?? [])
      .filter((a: { student_id: string; admin_tags: string[] | null }) => (a.admin_tags ?? []).includes("Don't Include"))
      .map((a: { student_id: string; admin_tags: string[] | null }) => a.student_id)
      .filter(Boolean)
  )
  const enrolledStudents = (students ?? []).filter((s: { id: string }) => enrolledIds.has(s.id) && !dontIncludeIds.has(s.id))

  if (enrolledStudents.length === 0) return []

  const studentIds = enrolledStudents.map((s: { id: string }) => s.id)

  const monthKey = dateToFunFridayMonthKey(date)
  const paidIds = new Set<string>()

  for (const tx of funFridayTxData ?? []) {
    if (!tx.student_id) continue
    const meta = (tx.metadata ?? {}) as Record<string, string>
    const paidFridays = meta.selected_fridays?.split(',').filter(Boolean) ?? []
    const paidMonths = meta.selected_months?.split(',').filter(Boolean) ?? []
    if (paidFridays.includes(date) || (monthKey !== null && paidMonths.includes(monthKey))) {
      paidIds.add(tx.student_id)
    }
  }

  const { data: records } = await adminClient
    .schema('attendance')
    .from('field_friday_records')
    .select('id, date, student_id, pickup_time, picked_up_by_name, picked_up_by_relationship, recorded_by, notes, paid_for_day')
    .eq('date', date)
    .in('student_id', studentIds)

  const recordMap = new Map<string, FieldFridayRecord>()
  for (const r of records ?? []) {
    recordMap.set(r.student_id, {
      id: r.id,
      date: r.date,
      student_id: r.student_id,
      pickup_time: r.pickup_time ?? null,
      picked_up_by_name: r.picked_up_by_name ?? null,
      picked_up_by_relationship: r.picked_up_by_relationship ?? null,
      recorded_by: r.recorded_by,
      notes: r.notes ?? null,
      paid_for_day: r.paid_for_day ?? false,
    })
  }

  return enrolledStudents.map((s: { id: string; child_legal_name: string | null; child_grade: string | null; profile_image_url: string | null }) => ({
    student_id: s.id,
    name: s.child_legal_name,
    grade: s.child_grade,
    profile_image_url: s.profile_image_url ?? null,
    record: recordMap.get(s.id) ?? null,
    hasEnrollment: paidIds.has(s.id),
  }))
}

export async function upsertFieldFridayRecord(
  studentId: string,
  date: string,
  paidForDay: boolean = false,
): Promise<FieldFridayRecord | null> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const adminClient = createAdminClient()
  const { data, error } = await adminClient
    .schema('attendance')
    .from('field_friday_records')
    .upsert(
      {
        student_id: studentId,
        date,
        paid_for_day: paidForDay,
        recorded_by: user.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'student_id,date' },
    )
    .select('id, date, student_id, pickup_time, picked_up_by_name, picked_up_by_relationship, recorded_by, notes, paid_for_day')
    .single()

  if (error || !data) return null

  const record: FieldFridayRecord = {
    id: data.id,
    date: data.date,
    student_id: data.student_id,
    pickup_time: data.pickup_time ?? null,
    picked_up_by_name: data.picked_up_by_name ?? null,
    picked_up_by_relationship: data.picked_up_by_relationship ?? null,
    recorded_by: data.recorded_by,
    notes: data.notes ?? null,
    paid_for_day: data.paid_for_day ?? false,
  }

  adminClient
    .schema('admin')
    .from('students')
    .select('child_legal_name')
    .eq('id', studentId)
    .single()
    .then(({ data: student }) => {
      const studentName = student?.child_legal_name ?? 'Unknown Student'
      void sendDiscordNotification(
        {
          title: '🌿 Student Added to Field Fun Fridays',
          color: 0x16a34a,
          fields: [
            { name: 'Student', value: studentName, inline: true },
            { name: 'Date', value: date, inline: true },
            { name: 'Paid', value: paidForDay ? '✅ Yes' : '❌ No', inline: true },
          ],
          timestamp: new Date().toISOString(),
        },
        FIELD_FRIDAY_WEBHOOK,
      )
    })

  return record
}

export async function removeFieldFridayRecord(recordId: string): Promise<{ ok: boolean }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false }

  const adminClient = createAdminClient()

  const { data: existing } = await adminClient
    .schema('attendance')
    .from('field_friday_records')
    .select('student_id, date, paid_for_day')
    .eq('id', recordId)
    .single()

  const { error } = await adminClient
    .schema('attendance')
    .from('field_friday_records')
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
          {
            title: '🔴 Student Removed from Field Fun Fridays',
            color: 0xe74c3c,
            fields: [
              { name: 'Student', value: student?.child_legal_name ?? 'Unknown Student', inline: true },
              { name: 'Date', value: existing.date, inline: true },
            ],
            timestamp: new Date().toISOString(),
          },
          FIELD_FRIDAY_WEBHOOK,
        )
      })
  }

  return { ok: !error }
}

export async function recordFieldFridayPickup(
  studentId: string,
  date: string,
  pickupTime: string,
  pickedUpByName: string,
  pickedUpByRelationship: string,
): Promise<FieldFridayRecord | null> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const adminClient = createAdminClient()
  const { data, error } = await adminClient
    .schema('attendance')
    .from('field_friday_records')
    .upsert(
      {
        student_id: studentId,
        date,
        recorded_by: user.id,
        pickup_time: pickupTime,
        picked_up_by_name: pickedUpByName,
        picked_up_by_relationship: pickedUpByRelationship,
        pickup_recorded_by: user.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'student_id,date' },
    )
    .select('id, date, student_id, pickup_time, picked_up_by_name, picked_up_by_relationship, recorded_by, notes, paid_for_day')
    .single()

  if (error || !data) return null

  const record: FieldFridayRecord = {
    id: data.id,
    date: data.date,
    student_id: data.student_id,
    pickup_time: data.pickup_time ?? null,
    picked_up_by_name: data.picked_up_by_name ?? null,
    picked_up_by_relationship: data.picked_up_by_relationship ?? null,
    recorded_by: data.recorded_by,
    notes: data.notes ?? null,
    paid_for_day: data.paid_for_day ?? false,
  }

  adminClient
    .schema('admin')
    .from('students')
    .select('child_legal_name')
    .eq('id', studentId)
    .single()
    .then(({ data: student }) => {
      void sendDiscordNotification(
        {
          title: '🚗 Field Fun Friday Pickup Recorded',
          color: 0x4a7c59,
          fields: [
            { name: 'Student', value: student?.child_legal_name ?? 'Unknown Student', inline: true },
            { name: 'Picked Up By', value: pickedUpByName, inline: true },
            { name: 'Pickup Time', value: pickupTime, inline: true },
            { name: 'Date', value: date, inline: true },
          ],
          timestamp: new Date().toISOString(),
        },
        FIELD_FRIDAY_WEBHOOK,
      )
    })

  return record
}
