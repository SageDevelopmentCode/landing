'use server'

import { createAdminClient } from '@/app/lib/supabase-server'

export type AdminAttendanceRow = {
  student_id: string
  name: string | null
  grade: string | null
  profile_image_url: string | null
  record: AdminAftercareRecord | null
  hasEnrollment: boolean
}

export type AdminAftercareRecord = {
  id: string
  date: string
  student_id: string
  pickup_time: string | null
  recorded_by: string
  notes: string | null
  paid_for_day: boolean
}

export type AdminFieldFridayRecord = {
  id: string
  date: string
  student_id: string
  recorded_by: string
  notes: string | null
  paid_for_day: boolean
}

export type AdminFieldFridayRow = {
  student_id: string
  name: string | null
  grade: string | null
  profile_image_url: string | null
  record: AdminFieldFridayRecord | null
  hasEnrollment: boolean
}

export type AttendanceStats = {
  totalEnrolled: number
  totalSessions: number
  avgPerSession: number
  paidRate: number
  totalAttendances: number
  paidAttendances: number
  unpaidAttendances: number
}

function dateToAftercareMonthKey(dateStr: string): string | null {
  const [y, m, d] = dateStr.split('-').map(Number)
  if (y === 2026) {
    if (m === 5 && d >= 26 && d <= 30) return 'may'
    if (m === 6 && d >= 1 && d <= 30) return 'jun'
    if (m === 7 && d >= 1 && d <= 31) return 'jul'
    if (m === 8 && d >= 3 && d <= 13) return 'aug'
  }
  return null
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

export async function getAdminAftercareForDate(date: string): Promise<AdminAttendanceRow[]> {
  const adminClient = createAdminClient()

  const [{ data: students }, { data: enrolledApps }, { data: aftercareTxData }] = await Promise.all([
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
    adminClient
      .schema('billing')
      .from('stripe_transactions')
      .select('student_id, metadata')
      .eq('payment_type', 'aftercare_tuition')
      .eq('status', 'completed')
      .eq('is_deleted', false),
  ])

  const enrolledIds = new Set((enrolledApps ?? []).map((a: { student_id: string }) => a.student_id).filter(Boolean))
  const enrolledStudents = (students ?? []).filter((s: { id: string }) => enrolledIds.has(s.id))

  if (enrolledStudents.length === 0) return []

  const studentIds = enrolledStudents.map((s: { id: string }) => s.id)

  const monthKey = dateToAftercareMonthKey(date)
  const enrolledForDateIds = new Set<string>()
  for (const tx of aftercareTxData ?? []) {
    if (!tx.student_id) continue
    const meta = (tx.metadata ?? {}) as Record<string, string>
    const paidDays = meta.selected_days?.split(',').filter(Boolean) ?? []
    const paidMonths = meta.selected_months?.split(',').filter(Boolean) ?? []
    if (paidDays.includes(date) || (monthKey !== null && paidMonths.includes(monthKey))) {
      enrolledForDateIds.add(tx.student_id)
    }
  }

  const { data: records } = await adminClient
    .schema('attendance')
    .from('aftercare_records')
    .select('id, date, student_id, pickup_time, recorded_by, notes, paid_for_day')
    .eq('date', date)
    .in('student_id', studentIds)

  const recordMap = new Map<string, AdminAftercareRecord>()
  for (const r of records ?? []) {
    recordMap.set(r.student_id, {
      id: r.id,
      date: r.date,
      student_id: r.student_id,
      pickup_time: r.pickup_time ?? null,
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
    hasEnrollment: enrolledForDateIds.has(s.id),
  }))
}

export async function getAdminFieldFridayForDate(date: string): Promise<AdminFieldFridayRow[]> {
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
      .select('student_id')
      .eq('status', 'enrolled'),
    adminClient
      .schema('billing')
      .from('stripe_transactions')
      .select('student_id, metadata')
      .eq('payment_type', 'fun_friday_tuition')
      .eq('status', 'completed')
      .eq('is_deleted', false),
  ])

  const enrolledIds = new Set((enrolledApps ?? []).map((a: { student_id: string }) => a.student_id).filter(Boolean))
  const enrolledStudents = (students ?? []).filter((s: { id: string }) => enrolledIds.has(s.id))

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
    .select('id, date, student_id, recorded_by, notes, paid_for_day')
    .eq('date', date)
    .in('student_id', studentIds)

  const recordMap = new Map<string, AdminFieldFridayRecord>()
  for (const r of records ?? []) {
    recordMap.set(r.student_id, {
      id: r.id,
      date: r.date,
      student_id: r.student_id,
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

export async function getAttendanceStats(program: 'aftercare' | 'field_friday'): Promise<AttendanceStats> {
  const adminClient = createAdminClient()

  const table = program === 'aftercare' ? 'aftercare_records' : 'field_friday_records'
  const paymentType = program === 'aftercare' ? 'aftercare_tuition' : 'fun_friday_tuition'

  const [{ data: enrolledApps }, { data: allRecords }] = await Promise.all([
    adminClient
      .schema('parent_app')
      .from('applications')
      .select('student_id')
      .eq('status', 'enrolled'),
    adminClient
      .schema('attendance')
      .from(table)
      .select('date, student_id, paid_for_day'),
  ])

  const totalEnrolled = new Set((enrolledApps ?? []).map((a: { student_id: string }) => a.student_id).filter(Boolean)).size

  const records = allRecords ?? []
  const distinctDates = new Set(records.map((r: { date: string }) => r.date))
  const totalSessions = distinctDates.size
  const totalAttendances = records.length
  const paidAttendances = records.filter((r: { paid_for_day: boolean }) => r.paid_for_day).length
  const unpaidAttendances = totalAttendances - paidAttendances
  const avgPerSession = totalSessions > 0 ? Math.round((totalAttendances / totalSessions) * 10) / 10 : 0
  const paidRate = totalAttendances > 0 ? Math.round((paidAttendances / totalAttendances) * 100) : 0

  return {
    totalEnrolled,
    totalSessions,
    avgPerSession,
    paidRate,
    totalAttendances,
    paidAttendances,
    unpaidAttendances,
  }
}
