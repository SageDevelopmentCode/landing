'use server'

import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'
import { sendDiscordNotification } from '@/app/lib/discord'

const SUMMER_WEBHOOK = process.env.DISCORD_STUDENT_WEBHOOK_URL

// Week 1 is the week of May 26, 2026. May 26 is Memorial Day so the first
// school day is Tuesday May 27, but we anchor each week to its Monday for
// arithmetic. Week 1 Monday = May 25, 2026.
const SUMMER_WEEK1_MONDAY = new Date(2026, 4, 25) // May 25, 2026
const TOTAL_WEEKS = 12

export type SummerRecord = {
  id: string
  date: string
  student_id: string
  recorded_by: string
  notes: string | null
  paid_for_day: boolean
}

export type SummerStudentRow = {
  student_id: string
  name: string | null
  grade: string | null
  profile_image_url: string | null
  record: SummerRecord | null
  hasEnrollment: boolean
}

export type SummerDayData = {
  date: string
  students: SummerStudentRow[]
}

function toDateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function dateToSummerWeek(dateStr: string): number | null {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const diffDays = Math.floor(
    (date.getTime() - SUMMER_WEEK1_MONDAY.getTime()) / 86400000
  )
  if (diffDays < 0) return null
  const w = Math.floor(diffDays / 7) + 1
  return w >= 1 && w <= TOTAL_WEEKS ? w : null
}

// Maps JS getDay() (0=Sun) to the lowercase day names used in week_selections
const JS_DAY_TO_NAME: Record<number, string> = {
  0: 'sun', 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat',
}

function isTxPaidForDate(
  tx: { metadata: unknown; payment_type: string },
  dateStr: string
): boolean {
  const meta = (tx.metadata ?? {}) as Record<string, string>

  if (tx.payment_type === 'summer_tuition') {
    if (meta.plan_type === 'full') return true
    const weekNum = dateToSummerWeek(dateStr)
    if (weekNum === null) return false
    return meta.weeks?.split(',').map(Number).includes(weekNum) ?? false
  }

  if (tx.payment_type === 'homeschool_dropin') {
    if (meta.program !== 'summer_26') return false

    // week_selections is a JSON string: [{"week":1,"days":["mon","wed"]},...]
    // Each entry names the week number and which weekday names the child attends.
    if (meta.week_selections) {
      try {
        const selections = JSON.parse(meta.week_selections) as Array<{
          week: number
          days: string[]
        }>
        const weekNum = dateToSummerWeek(dateStr)
        if (weekNum === null) return false
        const [y, m, d] = dateStr.split('-').map(Number)
        const dayName = JS_DAY_TO_NAME[new Date(y, m - 1, d).getDay()]
        return selections.some(
          (s) => s.week === weekNum && s.days.includes(dayName)
        )
      } catch {
        // fall through to selected_days check below
      }
    }

    // Fallback: some older transactions may use comma-separated ISO dates
    return meta.selected_days?.split(',').includes(dateStr) ?? false
  }

  return false
}

export async function getSummerStudentsForDay(date: string): Promise<SummerStudentRow[]> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const adminClient = createAdminClient()

  const [
    { data: students },
    { data: summerTxData },
    { data: homeschoolTxData },
  ] = await Promise.all([
    adminClient
      .schema('admin')
      .from('students')
      .select('id, child_legal_name, child_grade, profile_image_url')
      .eq('is_deleted', false)
      .order('child_legal_name'),
    adminClient
      .schema('billing')
      .from('stripe_transactions')
      .select('student_id, metadata, payment_type')
      .eq('payment_type', 'summer_tuition')
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

  const paidIds = new Set<string>()
  const allTx = [...(summerTxData ?? []), ...(homeschoolTxData ?? [])]
  for (const tx of allTx) {
    if (!tx.student_id) continue
    if (isTxPaidForDate(tx, date)) {
      paidIds.add(tx.student_id)
    }
  }

  const allStudentIds = (students ?? []).map((s: { id: string }) => s.id)

  const { data: records } = await adminClient
    .schema('attendance')
    .from('summer_records')
    .select('id, date, student_id, recorded_by, notes, paid_for_day')
    .eq('date', date)
    .in('student_id', allStudentIds.length > 0 ? allStudentIds : ['00000000-0000-0000-0000-000000000000'])

  const recordMap = new Map<string, SummerRecord>()
  for (const r of records ?? []) {
    recordMap.set(r.student_id, {
      id: r.id,
      date: r.date,
      student_id: r.student_id,
      recorded_by: r.recorded_by,
      notes: r.notes ?? null,
      paid_for_day: r.paid_for_day ?? true,
    })
  }

  return (students ?? [])
    .filter((s: { id: string }) => paidIds.has(s.id) || recordMap.has(s.id))
    .map((s: { id: string; child_legal_name: string | null; child_grade: string | null; profile_image_url: string | null }) => ({
      student_id: s.id,
      name: s.child_legal_name,
      grade: s.child_grade,
      profile_image_url: s.profile_image_url ?? null,
      record: recordMap.get(s.id) ?? null,
      hasEnrollment: paidIds.has(s.id),
    }))
}

export async function getSummerStudentsForWeek(weekStartDate: string): Promise<SummerDayData[]> {
  const [y, m, d] = weekStartDate.split('-').map(Number)
  const dates: string[] = []
  for (let i = 0; i < 5; i++) {
    const date = new Date(y, m - 1, d + i)
    dates.push(toDateStr(date))
  }

  const dayDataResults = await Promise.all(dates.map(getSummerStudentsForDay))
  return dates.map((date, i) => ({ date, students: dayDataResults[i] }))
}

export async function upsertSummerAttendanceRecord(
  studentId: string,
  date: string,
  paidForDay: boolean = true,
): Promise<SummerRecord | null> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const adminClient = createAdminClient()
  const { data, error } = await adminClient
    .schema('attendance')
    .from('summer_records')
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
    .select('id, date, student_id, recorded_by, notes, paid_for_day')
    .single()

  if (error || !data) return null

  const record: SummerRecord = {
    id: data.id,
    date: data.date,
    student_id: data.student_id,
    recorded_by: data.recorded_by,
    notes: data.notes ?? null,
    paid_for_day: data.paid_for_day ?? true,
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
          title: '☀️ Student Marked Present — Summer 2026',
          color: 0xd97706,
          fields: [
            { name: 'Student', value: student?.child_legal_name ?? 'Unknown Student', inline: true },
            { name: 'Date', value: date, inline: true },
            { name: 'Paid', value: paidForDay ? '✅ Yes' : '❌ No', inline: true },
          ],
          timestamp: new Date().toISOString(),
        },
        SUMMER_WEBHOOK,
      )
    })

  return record
}

export async function removeSummerAttendanceRecord(recordId: string): Promise<{ ok: boolean }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false }

  const adminClient = createAdminClient()

  const { data: existing } = await adminClient
    .schema('attendance')
    .from('summer_records')
    .select('student_id, date, paid_for_day')
    .eq('id', recordId)
    .single()

  const { error } = await adminClient
    .schema('attendance')
    .from('summer_records')
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
            title: '🔴 Student Removed from Summer Attendance',
            color: 0xe74c3c,
            fields: [
              { name: 'Student', value: student?.child_legal_name ?? 'Unknown Student', inline: true },
              { name: 'Date', value: existing.date, inline: true },
            ],
            timestamp: new Date().toISOString(),
          },
          SUMMER_WEBHOOK,
        )
      })
  }

  return { ok: !error }
}
