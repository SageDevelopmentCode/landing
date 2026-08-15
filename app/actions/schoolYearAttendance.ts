'use server'

import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'
import { sendDiscordNotification } from '@/app/lib/discord'
import {
  isSchoolYearFieldFridayPaid,
  isSchoolYearWeekdayPaid,
} from '@/shared/billing/school-year-attendance'

const SCHOOL_YEAR_WEBHOOK = process.env.DISCORD_STUDENT_WEBHOOK_URL
const SY_FIELD_FRIDAY_WEBHOOK = process.env.DISCORD_FIELD_FRIDAY_WEBHOOK_URL

export type SchoolYearRecord = {
  id: string
  date: string
  student_id: string
  recorded_by: string
  notes: string | null
  paid_for_day: boolean
  marked_absent: boolean
  pickup_time: string | null
  picked_up_by_name: string | null
  picked_up_by_relationship: string | null
}

export type SchoolYearFieldFridayRecord = {
  id: string
  date: string
  student_id: string
  recorded_by: string
  notes: string | null
  paid_for_day: boolean
  marked_absent: boolean
  pickup_time: string | null
  picked_up_by_name: string | null
  picked_up_by_relationship: string | null
}

export type SchoolYearStudentRow = {
  student_id: string
  name: string | null
  grade: string | null
  profile_image_url: string | null
  record: SchoolYearRecord | null
  hasEnrollment: boolean
  isHomeschool: boolean
}

export type SchoolYearFieldFridayStudentRow = {
  student_id: string
  name: string | null
  grade: string | null
  profile_image_url: string | null
  record: SchoolYearFieldFridayRecord | null
  hasEnrollment: boolean
}

type AppRow = {
  student_id: string
  program: string
  drop_in_program: string | null
  admin_tags: string[] | null
}

function isSchoolYearEnrolledApp(app: AppRow): boolean {
  if (app.program === 'school_year_26_27' || app.program === 'both') return true
  if (app.program === 'homeschool_drop_in') {
    return (
      app.drop_in_program === 'school_year_26_27' || app.drop_in_program === 'both'
    )
  }
  return false
}

export async function getSchoolYearStudentsForDay(
  date: string,
  includeDontInclude = false,
): Promise<SchoolYearStudentRow[]> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const adminClient = createAdminClient()

  const [
    { data: students },
    { data: enrolledApps },
    { data: tuitionTxData },
    { data: homeschoolTxData },
  ] = await Promise.all([
    adminClient
      .schema('admin')
      .from('students')
      .select('id, child_legal_name, child_grade, profile_image_url')
      .eq('is_deleted', false)
      .order('child_legal_name'),
    adminClient
      .schema('parent_app')
      .from('applications')
      .select('student_id, program, drop_in_program, admin_tags')
      .eq('status', 'enrolled'),
    adminClient
      .schema('billing')
      .from('stripe_transactions')
      .select('student_id, metadata, payment_type')
      .eq('payment_type', 'school_year_tuition')
      .eq('status', 'completed')
      .eq('is_deleted', false),
    adminClient
      .schema('billing')
      .from('stripe_transactions')
      .select('student_id, metadata, payment_type')
      .eq('payment_type', 'homeschool_dropin')
      .eq('status', 'completed')
      .eq('is_deleted', false),
  ])

  const syApps = (enrolledApps ?? []).filter((a: AppRow) =>
    isSchoolYearEnrolledApp(a),
  )
  const enrolledIds = new Set(syApps.map((a: AppRow) => a.student_id).filter(Boolean))
  const dontIncludeIds = new Set(
    syApps
      .filter((a: AppRow) => (a.admin_tags ?? []).includes("Don't Include"))
      .map((a: AppRow) => a.student_id)
      .filter(Boolean),
  )
  const homeschoolIds = new Set(
    syApps
      .filter((a: AppRow) => a.program === 'homeschool_drop_in')
      .map((a: AppRow) => a.student_id)
      .filter(Boolean),
  )

  const enrolledStudents = (students ?? []).filter(
    (s: { id: string }) =>
      enrolledIds.has(s.id) && (includeDontInclude || !dontIncludeIds.has(s.id)),
  )

  if (enrolledStudents.length === 0) return []

  const studentIds = enrolledStudents.map((s: { id: string }) => s.id)

  const paidIds = new Set<string>()
  const allTx = [...(tuitionTxData ?? []), ...(homeschoolTxData ?? [])]
  for (const tx of allTx) {
    if (!tx.student_id) continue
    if (
      isSchoolYearWeekdayPaid(
        { payment_type: tx.payment_type, metadata: tx.metadata as Record<string, unknown> | null },
        date,
      )
    ) {
      paidIds.add(tx.student_id)
    }
  }

  const { data: records } = await adminClient
    .schema('attendance')
    .from('school_year_records')
    .select(
      'id, date, student_id, recorded_by, notes, paid_for_day, marked_absent, pickup_time, picked_up_by_name, picked_up_by_relationship',
    )
    .eq('date', date)
    .in('student_id', studentIds)

  const recordMap = new Map<string, SchoolYearRecord>()
  for (const r of records ?? []) {
    recordMap.set(r.student_id, {
      id: r.id,
      date: r.date,
      student_id: r.student_id,
      recorded_by: r.recorded_by,
      notes: r.notes ?? null,
      paid_for_day: r.paid_for_day ?? true,
      marked_absent: r.marked_absent ?? false,
      pickup_time: r.pickup_time ?? null,
      picked_up_by_name: r.picked_up_by_name ?? null,
      picked_up_by_relationship: r.picked_up_by_relationship ?? null,
    })
  }

  return enrolledStudents
    .filter(
      (s: { id: string }) =>
        paidIds.has(s.id) || recordMap.has(s.id),
    )
    .map(
      (s: {
        id: string
        child_legal_name: string | null
        child_grade: string | null
        profile_image_url: string | null
      }) => ({
        student_id: s.id,
        name: s.child_legal_name,
        grade: s.child_grade,
        profile_image_url: s.profile_image_url ?? null,
        record: recordMap.get(s.id) ?? null,
        hasEnrollment: paidIds.has(s.id),
        isHomeschool: homeschoolIds.has(s.id),
      }),
    )
}

export async function getSchoolYearFieldFridayStudentsForDate(
  date: string,
  includeDontInclude = false,
): Promise<SchoolYearFieldFridayStudentRow[]> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const adminClient = createAdminClient()

  const [{ data: students }, { data: enrolledApps }, { data: funFridayTxData }] =
    await Promise.all([
      adminClient
        .schema('admin')
        .from('students')
        .select('id, child_legal_name, child_grade, profile_image_url')
        .eq('is_deleted', false)
        .order('child_legal_name'),
      adminClient
        .schema('parent_app')
        .from('applications')
        .select('student_id, program, drop_in_program, admin_tags')
        .eq('status', 'enrolled'),
      adminClient
        .schema('billing')
        .from('stripe_transactions')
        .select('student_id, metadata, payment_type')
        .eq('payment_type', 'fun_friday_tuition')
        .eq('status', 'completed')
        .eq('is_deleted', false),
    ])

  const syApps = (enrolledApps ?? []).filter((a: AppRow) =>
    isSchoolYearEnrolledApp(a),
  )
  const enrolledIds = new Set(syApps.map((a: AppRow) => a.student_id).filter(Boolean))
  const dontIncludeIds = new Set(
    syApps
      .filter((a: AppRow) => (a.admin_tags ?? []).includes("Don't Include"))
      .map((a: AppRow) => a.student_id)
      .filter(Boolean),
  )

  const enrolledStudents = (students ?? []).filter(
    (s: { id: string }) =>
      enrolledIds.has(s.id) && (includeDontInclude || !dontIncludeIds.has(s.id)),
  )

  if (enrolledStudents.length === 0) return []

  const studentIds = enrolledStudents.map((s: { id: string }) => s.id)

  const paidIds = new Set<string>()
  for (const tx of funFridayTxData ?? []) {
    if (!tx.student_id) continue
    if (
      isSchoolYearFieldFridayPaid(
        { payment_type: tx.payment_type, metadata: tx.metadata as Record<string, unknown> | null },
        date,
      )
    ) {
      paidIds.add(tx.student_id)
    }
  }

  const { data: records } = await adminClient
    .schema('attendance')
    .from('school_year_field_friday_records')
    .select(
      'id, date, student_id, recorded_by, notes, paid_for_day, marked_absent, pickup_time, picked_up_by_name, picked_up_by_relationship',
    )
    .eq('date', date)
    .in('student_id', studentIds)

  const recordMap = new Map<string, SchoolYearFieldFridayRecord>()
  for (const r of records ?? []) {
    recordMap.set(r.student_id, {
      id: r.id,
      date: r.date,
      student_id: r.student_id,
      recorded_by: r.recorded_by,
      notes: r.notes ?? null,
      paid_for_day: r.paid_for_day ?? false,
      marked_absent: r.marked_absent ?? false,
      pickup_time: r.pickup_time ?? null,
      picked_up_by_name: r.picked_up_by_name ?? null,
      picked_up_by_relationship: r.picked_up_by_relationship ?? null,
    })
  }

  return enrolledStudents
    .filter(
      (s: { id: string }) =>
        paidIds.has(s.id) || recordMap.has(s.id),
    )
    .map(
      (s: {
        id: string
        child_legal_name: string | null
        child_grade: string | null
        profile_image_url: string | null
      }) => ({
        student_id: s.id,
        name: s.child_legal_name,
        grade: s.child_grade,
        profile_image_url: s.profile_image_url ?? null,
        record: recordMap.get(s.id) ?? null,
        hasEnrollment: paidIds.has(s.id),
      }),
    )
}

export async function upsertSchoolYearAttendanceRecord(
  studentId: string,
  date: string,
  paidForDay: boolean = true,
): Promise<SchoolYearRecord | null> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const adminClient = createAdminClient()
  const { data, error } = await adminClient
    .schema('attendance')
    .from('school_year_records')
    .upsert(
      {
        student_id: studentId,
        date,
        paid_for_day: paidForDay,
        marked_absent: false,
        recorded_by: user.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'student_id,date' },
    )
    .select(
      'id, date, student_id, recorded_by, notes, paid_for_day, marked_absent, pickup_time, picked_up_by_name, picked_up_by_relationship',
    )
    .single()

  if (error || !data) return null

  const record: SchoolYearRecord = {
    id: data.id,
    date: data.date,
    student_id: data.student_id,
    recorded_by: data.recorded_by,
    notes: data.notes ?? null,
    paid_for_day: data.paid_for_day ?? true,
    marked_absent: data.marked_absent ?? false,
    pickup_time: data.pickup_time ?? null,
    picked_up_by_name: data.picked_up_by_name ?? null,
    picked_up_by_relationship: data.picked_up_by_relationship ?? null,
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
          title: '🎒 Student Marked Present — School Year 26–27',
          color: 0x6366f1,
          fields: [
            { name: 'Student', value: student?.child_legal_name ?? 'Unknown Student', inline: true },
            { name: 'Date', value: date, inline: true },
            { name: 'Paid', value: paidForDay ? '✅ Yes' : '❌ No', inline: true },
          ],
          timestamp: new Date().toISOString(),
        },
        SCHOOL_YEAR_WEBHOOK,
      )
    })

  return record
}

export async function removeSchoolYearAttendanceRecord(
  recordId: string,
): Promise<{ ok: boolean }> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false }

  const adminClient = createAdminClient()

  const { data: existing } = await adminClient
    .schema('attendance')
    .from('school_year_records')
    .select('student_id, date, paid_for_day')
    .eq('id', recordId)
    .single()

  const { error } = await adminClient
    .schema('attendance')
    .from('school_year_records')
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
            title: '🔴 Student Removed from School Year Attendance',
            color: 0xe74c3c,
            fields: [
              { name: 'Student', value: student?.child_legal_name ?? 'Unknown Student', inline: true },
              { name: 'Date', value: existing.date, inline: true },
            ],
            timestamp: new Date().toISOString(),
          },
          SCHOOL_YEAR_WEBHOOK,
        )
      })
  }

  return { ok: !error }
}

export async function upsertSchoolYearFieldFridayRecord(
  studentId: string,
  date: string,
  paidForDay: boolean = false,
): Promise<SchoolYearFieldFridayRecord | null> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const adminClient = createAdminClient()
  const { data, error } = await adminClient
    .schema('attendance')
    .from('school_year_field_friday_records')
    .upsert(
      {
        student_id: studentId,
        date,
        paid_for_day: paidForDay,
        marked_absent: false,
        recorded_by: user.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'student_id,date' },
    )
    .select(
      'id, date, student_id, recorded_by, notes, paid_for_day, marked_absent, pickup_time, picked_up_by_name, picked_up_by_relationship',
    )
    .single()

  if (error || !data) return null

  const record: SchoolYearFieldFridayRecord = {
    id: data.id,
    date: data.date,
    student_id: data.student_id,
    recorded_by: data.recorded_by,
    notes: data.notes ?? null,
    paid_for_day: data.paid_for_day ?? false,
    marked_absent: data.marked_absent ?? false,
    pickup_time: data.pickup_time ?? null,
    picked_up_by_name: data.picked_up_by_name ?? null,
    picked_up_by_relationship: data.picked_up_by_relationship ?? null,
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
          title: '🌿 Student Added to School Year Field Fun Fridays',
          color: 0x7c3aed,
          fields: [
            { name: 'Student', value: student?.child_legal_name ?? 'Unknown Student', inline: true },
            { name: 'Date', value: date, inline: true },
            { name: 'Paid', value: paidForDay ? '✅ Yes' : '❌ No', inline: true },
          ],
          timestamp: new Date().toISOString(),
        },
        SY_FIELD_FRIDAY_WEBHOOK,
      )
    })

  return record
}

export async function removeSchoolYearFieldFridayRecord(
  recordId: string,
): Promise<{ ok: boolean }> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false }

  const adminClient = createAdminClient()

  const { data: existing } = await adminClient
    .schema('attendance')
    .from('school_year_field_friday_records')
    .select('student_id, date, paid_for_day')
    .eq('id', recordId)
    .single()

  const { error } = await adminClient
    .schema('attendance')
    .from('school_year_field_friday_records')
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
            title: '🔴 Student Removed from School Year Field Fun Fridays',
            color: 0xe74c3c,
            fields: [
              { name: 'Student', value: student?.child_legal_name ?? 'Unknown Student', inline: true },
              { name: 'Date', value: existing.date, inline: true },
            ],
            timestamp: new Date().toISOString(),
          },
          SY_FIELD_FRIDAY_WEBHOOK,
        )
      })
  }

  return { ok: !error }
}
