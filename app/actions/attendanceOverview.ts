'use server'

import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'

export type EnrolledStudentPreview = {
  student_id: string
  name: string | null
  profile_image_url: string | null
}

export type DayHeadcounts = {
  date: string
  aftercare: { enrolled: number; students: EnrolledStudentPreview[] }
  summer: { enrolled: number; students: EnrolledStudentPreview[] }
  fieldFriday: { enrolled: number; students: EnrolledStudentPreview[] } | null
}

function toDateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
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

const SUMMER_WEEK1_MONDAY = new Date(2026, 4, 25)
const TOTAL_SUMMER_WEEKS = 12
const JS_DAY_TO_NAME: Record<number, string> = {
  0: 'sun', 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat',
}

function isSummerTxPaidForDate(
  tx: { metadata: unknown; payment_type: string },
  dateStr: string
): boolean {
  const meta = (tx.metadata ?? {}) as Record<string, string>

  if (tx.payment_type === 'summer_tuition') {
    if (meta.plan_type === 'full') return true
    const [y, m, d] = dateStr.split('-').map(Number)
    const date = new Date(y, m - 1, d)
    const diffDays = Math.floor((date.getTime() - SUMMER_WEEK1_MONDAY.getTime()) / 86400000)
    if (diffDays < 0) return false
    const weekNum = Math.floor(diffDays / 7) + 1
    if (weekNum < 1 || weekNum > TOTAL_SUMMER_WEEKS) return false
    return meta.weeks?.split(',').map(Number).includes(weekNum) ?? false
  }

  if (tx.payment_type === 'homeschool_dropin') {
    if (meta.program !== 'summer_26') return false
    if (meta.week_selections) {
      try {
        const selections = JSON.parse(meta.week_selections) as Array<{ week: number; days: string[] }>
        const [y, m, d] = dateStr.split('-').map(Number)
        const date = new Date(y, m - 1, d)
        const diffDays = Math.floor((date.getTime() - SUMMER_WEEK1_MONDAY.getTime()) / 86400000)
        if (diffDays < 0) return false
        const weekNum = Math.floor(diffDays / 7) + 1
        if (weekNum < 1 || weekNum > TOTAL_SUMMER_WEEKS) return false
        const dayName = JS_DAY_TO_NAME[new Date(y, m - 1, d).getDay()]
        return selections.some((s) => s.week === weekNum && s.days.includes(dayName))
      } catch {
        // fall through
      }
    }
    return meta.selected_days?.split(',').includes(dateStr) ?? false
  }

  return false
}

export async function getWeekHeadcounts(weekMonday: string): Promise<DayHeadcounts[]> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const adminClient = createAdminClient()

  const [
    { data: students },
    { data: enrolledApps },
    { data: aftercareTxData },
    { data: funFridayTxData },
    { data: summerTxData },
  ] = await Promise.all([
    adminClient
      .schema('admin')
      .from('students')
      .select('id, child_legal_name, profile_image_url')
      .eq('is_deleted', false)
      .order('child_legal_name'),
    adminClient
      .schema('parent_app')
      .from('applications')
      .select('student_id, program, admin_tags')
      .eq('status', 'enrolled'),
    adminClient
      .schema('billing')
      .from('stripe_transactions')
      .select('student_id, metadata')
      .eq('payment_type', 'aftercare_tuition')
      .eq('status', 'completed')
      .eq('is_deleted', false),
    adminClient
      .schema('billing')
      .from('stripe_transactions')
      .select('student_id, metadata')
      .eq('payment_type', 'fun_friday_tuition')
      .eq('status', 'completed')
      .eq('is_deleted', false),
    adminClient
      .schema('billing')
      .from('stripe_transactions')
      .select('student_id, metadata, payment_type')
      .in('payment_type', ['summer_tuition', 'homeschool_dropin'])
      .eq('status', 'completed')
      .eq('is_deleted', false),
  ])

  type AppRow = { student_id: string; program: string; admin_tags: string[] | null }
  const enrolledIds = new Set((enrolledApps ?? []).map((a: AppRow) => a.student_id).filter(Boolean))
  const dontIncludeIds = new Set(
    (enrolledApps ?? [])
      .filter((a: AppRow) => (a.admin_tags ?? []).includes("Don't Include"))
      .map((a: AppRow) => a.student_id)
      .filter(Boolean)
  )

  type StudentRow = { id: string; child_legal_name: string | null; profile_image_url: string | null }
  const studentMap = new Map<string, { name: string | null; profile_image_url: string | null }>()
  const validStudentIds = new Set<string>()
  for (const s of (students ?? []) as StudentRow[]) {
    if (enrolledIds.has(s.id) && !dontIncludeIds.has(s.id)) {
      validStudentIds.add(s.id)
      studentMap.set(s.id, { name: s.child_legal_name, profile_image_url: s.profile_image_url ?? null })
    }
  }

  // Compute the 5 weekday dates
  const [wy, wm, wd] = weekMonday.split('-').map(Number)
  const dates: string[] = Array.from({ length: 5 }, (_, i) => {
    return toDateStr(new Date(wy, wm - 1, wd + i))
  })

  function idsToStudents(ids: Set<string>): EnrolledStudentPreview[] {
    return Array.from(ids)
      .map((id) => {
        const info = studentMap.get(id)
        return {
          student_id: id,
          name: info?.name ?? null,
          profile_image_url: info?.profile_image_url ?? null,
        }
      })
      .sort((a, b) => {
        const aHasPhoto = a.profile_image_url ? 0 : 1
        const bHasPhoto = b.profile_image_url ? 0 : 1
        if (aHasPhoto !== bHasPhoto) return aHasPhoto - bHasPhoto
        return (a.name ?? '').localeCompare(b.name ?? '')
      })
  }

  return dates.map((date) => {
    const dow = new Date(date).getDay() // 1=Mon … 5=Fri

    // Aftercare: Mon–Thu
    let aftercareStudents: EnrolledStudentPreview[] = []
    if (dow >= 1 && dow <= 4) {
      const monthKey = dateToAftercareMonthKey(date)
      const paidIds = new Set<string>()
      for (const tx of aftercareTxData ?? []) {
        if (!tx.student_id || !validStudentIds.has(tx.student_id)) continue
        const meta = (tx.metadata ?? {}) as Record<string, string>
        const paidDays = meta.selected_days?.split(',').filter(Boolean) ?? []
        const paidMonths = meta.selected_months?.split(',').filter(Boolean) ?? []
        if (paidDays.includes(date) || (monthKey !== null && paidMonths.includes(monthKey))) {
          paidIds.add(tx.student_id)
        }
      }
      aftercareStudents = idsToStudents(paidIds)
    }

    // Summer: Mon–Thu
    let summerStudents: EnrolledStudentPreview[] = []
    if (dow >= 1 && dow <= 4) {
      const paidIds = new Set<string>()
      for (const tx of summerTxData ?? []) {
        if (!tx.student_id || !validStudentIds.has(tx.student_id)) continue
        if (isSummerTxPaidForDate(tx, date)) {
          paidIds.add(tx.student_id)
        }
      }
      summerStudents = idsToStudents(paidIds)
    }

    // Field Fun Fridays: Friday only
    let fieldFriday: { enrolled: number; students: EnrolledStudentPreview[] } | null = null
    if (dow === 5) {
      const monthKey = dateToFunFridayMonthKey(date)
      const paidIds = new Set<string>()
      for (const tx of funFridayTxData ?? []) {
        if (!tx.student_id || !validStudentIds.has(tx.student_id)) continue
        const meta = (tx.metadata ?? {}) as Record<string, string>
        const paidFridays = meta.selected_fridays?.split(',').filter(Boolean) ?? []
        const paidMonths = meta.selected_months?.split(',').filter(Boolean) ?? []
        if (paidFridays.includes(date) || (monthKey !== null && paidMonths.includes(monthKey))) {
          paidIds.add(tx.student_id)
        }
      }
      const ffStudents = idsToStudents(paidIds)
      fieldFriday = { enrolled: ffStudents.length, students: ffStudents }
    }

    return {
      date,
      aftercare: { enrolled: aftercareStudents.length, students: aftercareStudents },
      summer: { enrolled: summerStudents.length, students: summerStudents },
      fieldFriday,
    }
  })
}
