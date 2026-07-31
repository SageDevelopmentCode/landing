import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'
import { ArchiveClient } from './ArchiveClient'
import { SUMMER_DATE_TO_WEEK, JS_DOW_TO_DAY_KEY } from '@/app/lib/summer-schedule'
import type { WeekSwapStudent } from '../week-swap/types'
import type { DaySwapStudent, WeekDayEntry } from '../day-swap/types'

const VALID_TABS = ['calendar', 'week-swap', 'day-swap'] as const

export type ArchiveTab = (typeof VALID_TABS)[number]

function expandWeekSelections(entries: WeekDayEntry[]): string[] {
  const dates: string[] = []
  for (const [isoDate, weekNum] of Object.entries(SUMMER_DATE_TO_WEEK)) {
    for (const entry of entries) {
      if (entry.week !== weekNum) continue
      const dow = new Date(isoDate + 'T00:00:00').getDay()
      const dayKey = JS_DOW_TO_DAY_KEY[dow]
      if (dayKey && entry.days.includes(dayKey)) dates.push(isoDate)
    }
  }
  return dates.sort()
}

async function loadWeekSwapStudents(client: ReturnType<typeof createAdminClient>): Promise<WeekSwapStudent[]> {
  const { data: appsData } = await client
    .schema('parent_app')
    .from('applications')
    .select('id, student_id, user_id, program, child_legal_name')
    .eq('status', 'enrolled')
    .eq('approved', true)
    .in('program', ['summer_26', 'both'])

  const apps = (appsData ?? []).filter((a) => !!a.student_id && !!a.user_id)
  const studentIds = [...new Set(apps.map((a) => a.student_id as string))]
  const parentIds = [...new Set(apps.map((a) => a.user_id as string))]

  const [{ data: studentsData }, { data: parentsData }, { data: txData }] = await Promise.all([
    studentIds.length > 0
      ? client.schema('admin').from('students').select('id, child_legal_name, profile_image_url').in('id', studentIds)
      : Promise.resolve({ data: [] }),
    parentIds.length > 0
      ? client.schema('admin').from('users').select('id, full_name, email').in('id', parentIds)
      : Promise.resolve({ data: [] }),
    studentIds.length > 0
      ? client
          .schema('billing')
          .from('stripe_transactions')
          .select('id, student_id, metadata, amount_cents, created_at')
          .in('student_id', studentIds)
          .eq('payment_type', 'summer_tuition')
          .eq('status', 'completed')
          .eq('is_deleted', false)
      : Promise.resolve({ data: [] }),
  ])

  const studentInfoMap: Record<string, { name: string; profileImageUrl: string | null }> = {}
  for (const s of studentsData ?? []) {
    if (s.id) studentInfoMap[s.id] = { name: s.child_legal_name ?? s.id, profileImageUrl: s.profile_image_url ?? null }
  }

  const parentInfoMap: Record<string, { name: string | null; email: string | null }> = {}
  for (const p of parentsData ?? []) {
    if (p.id) parentInfoMap[p.id] = { name: p.full_name ?? null, email: p.email ?? null }
  }

  const studentMap = new Map<string, WeekSwapStudent>()
  for (const app of apps) {
    const sid = app.student_id as string
    const uid = app.user_id as string
    if (studentMap.has(sid)) continue
    const info = studentInfoMap[sid]
    const parentInfo = parentInfoMap[uid]
    studentMap.set(sid, {
      studentId: sid,
      studentName: info?.name ?? app.child_legal_name ?? sid,
      profileImageUrl: info?.profileImageUrl ?? null,
      parentId: uid,
      parentName: parentInfo?.name ?? null,
      parentEmail: parentInfo?.email ?? null,
      transactions: [],
      allPaidWeeks: [],
    })
  }

  const allPaidWeeksByStudent: Record<string, Set<number>> = {}
  for (const tx of txData ?? []) {
    if (!tx.student_id) continue
    const student = studentMap.get(tx.student_id)
    if (!student) continue
    const meta = (tx.metadata ?? {}) as Record<string, string>
    if (meta.plan_type === 'full') continue
    const weeks = (meta.weeks ?? '').split(',').map(Number).filter(Boolean)
    if (weeks.length === 0) continue
    student.transactions.push({ id: tx.id, weeks, amountCents: tx.amount_cents, createdAt: tx.created_at })
    if (!allPaidWeeksByStudent[tx.student_id]) allPaidWeeksByStudent[tx.student_id] = new Set()
    weeks.forEach((w) => allPaidWeeksByStudent[tx.student_id].add(w))
  }

  for (const student of studentMap.values()) {
    student.allPaidWeeks = [...(allPaidWeeksByStudent[student.studentId] ?? [])].sort((a, b) => a - b)
  }

  return Array.from(studentMap.values()).sort((a, b) => {
    const aHas = a.allPaidWeeks.length > 0 ? 0 : 1
    const bHas = b.allPaidWeeks.length > 0 ? 0 : 1
    if (aHas !== bHas) return aHas - bHas
    return a.studentName.localeCompare(b.studentName)
  })
}

async function loadDaySwapStudents(client: ReturnType<typeof createAdminClient>): Promise<DaySwapStudent[]> {
  const { data: appsData } = await client
    .schema('parent_app')
    .from('applications')
    .select('id, student_id, user_id, program, drop_in_program, child_legal_name')
    .eq('status', 'enrolled')
    .eq('approved', true)
    .eq('program', 'homeschool_drop_in')

  const apps = (appsData ?? []).filter((a) => !!a.student_id && !!a.user_id)
  const studentIds = [...new Set(apps.map((a) => a.student_id as string))]
  const parentIds = [...new Set(apps.map((a) => a.user_id as string))]

  const [{ data: studentsData }, { data: parentsData }, { data: txData }] = await Promise.all([
    studentIds.length > 0
      ? client.schema('admin').from('students').select('id, child_legal_name, profile_image_url').in('id', studentIds)
      : Promise.resolve({ data: [] }),
    parentIds.length > 0
      ? client.schema('admin').from('users').select('id, full_name, email').in('id', parentIds)
      : Promise.resolve({ data: [] }),
    studentIds.length > 0
      ? client
          .schema('billing')
          .from('stripe_transactions')
          .select('id, student_id, metadata, amount_cents, created_at')
          .in('student_id', studentIds)
          .eq('payment_type', 'homeschool_dropin')
          .eq('status', 'completed')
          .eq('is_deleted', false)
      : Promise.resolve({ data: [] }),
  ])

  const studentInfoMap: Record<string, { name: string; profileImageUrl: string | null }> = {}
  for (const s of studentsData ?? []) {
    if (s.id) studentInfoMap[s.id] = { name: s.child_legal_name ?? s.id, profileImageUrl: s.profile_image_url ?? null }
  }

  const parentInfoMap: Record<string, { name: string | null; email: string | null }> = {}
  for (const p of parentsData ?? []) {
    if (p.id) parentInfoMap[p.id] = { name: p.full_name ?? null, email: p.email ?? null }
  }

  const studentMap = new Map<string, DaySwapStudent>()
  for (const app of apps) {
    const sid = app.student_id as string
    const uid = app.user_id as string
    if (studentMap.has(sid)) continue
    const info = studentInfoMap[sid]
    const parentInfo = parentInfoMap[uid]
    studentMap.set(sid, {
      studentId: sid,
      studentName: info?.name ?? app.child_legal_name ?? sid,
      profileImageUrl: info?.profileImageUrl ?? null,
      parentId: uid,
      parentName: parentInfo?.name ?? null,
      parentEmail: parentInfo?.email ?? null,
      transactions: [],
      allPaidDays: [],
    })
  }

  const allPaidDaysByStudent: Record<string, Set<string>> = {}
  for (const tx of txData ?? []) {
    if (!tx.student_id) continue
    const student = studentMap.get(tx.student_id)
    if (!student) continue
    const meta = (tx.metadata ?? {}) as Record<string, string>

    let weekSelections: WeekDayEntry[] = []
    if (meta.week_selections) {
      try { weekSelections = JSON.parse(meta.week_selections) } catch { /* ignore */ }
    }
    if (!weekSelections.length) {
      const weeks = (meta.selected_weeks ?? '').split(',').map(Number).filter(Boolean)
      const days = (meta.selected_days ?? '').split(',').map((d: string) => d.trim()).filter(Boolean)
      weekSelections = weeks.map((w) => ({ week: w, days }))
    }

    const days = expandWeekSelections(weekSelections)
    if (days.length === 0) continue

    student.transactions.push({ id: tx.id, days, weekSelections, amountCents: tx.amount_cents, createdAt: tx.created_at })
    if (!allPaidDaysByStudent[tx.student_id]) allPaidDaysByStudent[tx.student_id] = new Set()
    days.forEach((d: string) => allPaidDaysByStudent[tx.student_id].add(d))
  }

  for (const student of studentMap.values()) {
    student.allPaidDays = [...(allPaidDaysByStudent[student.studentId] ?? [])].sort()
  }

  return Array.from(studentMap.values()).sort((a, b) => {
    const aHas = a.allPaidDays.length > 0 ? 0 : 1
    const bHas = b.allPaidDays.length > 0 ? 0 : 1
    if (aHas !== bHas) return aHas - bHas
    return a.studentName.localeCompare(b.studentName)
  })
}

export default async function ArchivePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab } = await searchParams
  const initialTab: ArchiveTab = VALID_TABS.includes(tab as ArchiveTab)
    ? (tab as ArchiveTab)
    : 'calendar'

  const supabase = await createServerSupabaseClient()
  const adminClient = createAdminClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let currentUser: { full_name: string; role: string; id: string } | null = null

  if (user) {
    const { data } = await adminClient
      .schema('admin')
      .from('users')
      .select('full_name, role')
      .eq('id', user.id)
      .single()

    if (data) {
      currentUser = { full_name: data.full_name, role: data.role, id: user.id }
    }
  }

  const [{ data: events }, { data: adminUsers }, weekSwapStudents, daySwapStudents] = await Promise.all([
    adminClient
      .schema('calendar')
      .from('events')
      .select('id, title, event_date, is_all_day, start_time, end_time, color, category, shared_with, programs, description, location, recurrence, recurrence_end_date, attachment_links, rsvp_enabled, reminder_email, reminder_in_app, reminder_timing, internal_notes, created_by')
      .order('event_date', { ascending: true }),
    adminClient
      .schema('admin')
      .from('users')
      .select('id, full_name'),
    loadWeekSwapStudents(adminClient),
    loadDaySwapStudents(adminClient),
  ])

  const usersMap: Record<string, string> = {}
  for (const u of adminUsers ?? []) {
    usersMap[u.id] = u.full_name
  }

  return (
    <ArchiveClient
      initialTab={initialTab}
      currentUser={currentUser}
      initialEvents={events ?? []}
      usersMap={usersMap}
      weekSwapStudents={weekSwapStudents}
      daySwapStudents={daySwapStudents}
    />
  )
}
