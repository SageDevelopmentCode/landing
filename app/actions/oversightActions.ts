'use server'

import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'

export type WeekTrend = {
  week: number
  label: string
  mondayDate: string
  enrolled: number
  students: { id: string; name: string | null; profileImageUrl: string | null }[]
}

const SUMMER_WEEK1_MONDAY = new Date(2026, 4, 25) // May 25, 2026
const TOTAL_SUMMER_WEEKS = 12

const JS_DAY_TO_NAME: Record<number, string> = {
  0: 'sun', 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat',
}

function toDateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function isSummerTxPaidForWeek(
  tx: { metadata: unknown; payment_type: string },
  weekNum: number
): boolean {
  const meta = (tx.metadata ?? {}) as Record<string, string>

  if (tx.payment_type === 'summer_tuition') {
    if (meta.plan_type === 'full') return true
    return meta.weeks?.split(',').map(Number).includes(weekNum) ?? false
  }

  if (tx.payment_type === 'homeschool_dropin') {
    if (meta.program !== 'summer_26') return false
    if (meta.week_selections) {
      try {
        const selections = JSON.parse(meta.week_selections) as Array<{ week: number; days: string[] }>
        return selections.some((s) => s.week === weekNum)
      } catch {
        // fall through
      }
    }
    // For selected_days format, check if any selected day falls in this week
    const selectedDays = meta.selected_days?.split(',').filter(Boolean) ?? []
    for (const dateStr of selectedDays) {
      const [y, m, d] = dateStr.split('-').map(Number)
      const date = new Date(y, m - 1, d)
      const diffDays = Math.floor((date.getTime() - SUMMER_WEEK1_MONDAY.getTime()) / 86400000)
      if (diffDays >= 0) {
        const w = Math.floor(diffDays / 7) + 1
        if (w === weekNum) return true
      }
    }
    return false
  }

  return false
}

export async function getSummerAttendanceTrend(): Promise<WeekTrend[]> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const adminClient = createAdminClient()

  const [
    { data: students },
    { data: enrolledApps },
    { data: summerTxData },
  ] = await Promise.all([
    adminClient
      .schema('admin')
      .from('students')
      .select('id, child_legal_name, profile_image_url')
      .eq('is_deleted', false),
    adminClient
      .schema('parent_app')
      .from('applications')
      .select('student_id, admin_tags')
      .eq('status', 'enrolled'),
    adminClient
      .schema('billing')
      .from('stripe_transactions')
      .select('student_id, metadata, payment_type')
      .in('payment_type', ['summer_tuition', 'homeschool_dropin'])
      .eq('status', 'completed')
      .eq('is_deleted', false),
  ])

  type AppRow = { student_id: string; admin_tags: string[] | null }
  const enrolledIds = new Set((enrolledApps ?? []).map((a: AppRow) => a.student_id).filter(Boolean))
  const dontIncludeIds = new Set(
    (enrolledApps ?? [])
      .filter((a: AppRow) => (a.admin_tags ?? []).includes("Don't Include"))
      .map((a: AppRow) => a.student_id)
      .filter(Boolean)
  )

  const studentMap = new Map<string, { name: string | null; profileImageUrl: string | null }>()
  const validStudentIds = new Set<string>()
  for (const s of (students ?? []) as { id: string; child_legal_name: string | null; profile_image_url: string | null }[]) {
    studentMap.set(s.id, { name: s.child_legal_name, profileImageUrl: s.profile_image_url ?? null })
    if (enrolledIds.has(s.id) && !dontIncludeIds.has(s.id)) {
      validStudentIds.add(s.id)
    }
  }

  const MONTH_ABBRS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  const weeks: WeekTrend[] = []
  for (let w = 1; w <= TOTAL_SUMMER_WEEKS; w++) {
    const mondayMs = SUMMER_WEEK1_MONDAY.getTime() + (w - 1) * 7 * 86400000
    const monday = new Date(mondayMs)
    const friday = new Date(mondayMs + 4 * 86400000)
    const mondayStr = toDateStr(monday)
    const monLabel = `${MONTH_ABBRS[monday.getMonth()]} ${monday.getDate()}`
    const friLabel = `${MONTH_ABBRS[friday.getMonth()]} ${friday.getDate()}`

    const enrolledThisWeek = new Set<string>()
    for (const tx of summerTxData ?? []) {
      if (!tx.student_id || !validStudentIds.has(tx.student_id)) continue
      if (isSummerTxPaidForWeek(tx, w)) {
        enrolledThisWeek.add(tx.student_id)
      }
    }

    const studentsList = Array.from(enrolledThisWeek)
      .map((id) => {
        const s = studentMap.get(id)
        return { id, name: s?.name ?? null, profileImageUrl: s?.profileImageUrl ?? null }
      })
      .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))

    weeks.push({
      week: w,
      label: `Wk ${w}\n${monLabel}`,
      mondayDate: mondayStr,
      enrolled: enrolledThisWeek.size,
      students: studentsList,
    })
  }

  return weeks
}
