import { createAdminClient } from '@/app/lib/supabase-server'
import { Poppins } from 'next/font/google'
import { cssColors as colors } from '../design-system'
import { DaySwapClient } from './DaySwapClient'
import { SUMMER_DATE_TO_WEEK, JS_DOW_TO_DAY_KEY } from '@/app/lib/summer-schedule'

const poppins = Poppins({ weight: ['300', '400', '700', '900'], subsets: ['latin'] })

export type WeekDayEntry = { week: number; days: string[] }

export type DaySwapTransaction = {
  id: string
  days: string[]              // YYYY-MM-DD — derived from week_selections
  weekSelections: WeekDayEntry[]  // raw, for server action to update
  amountCents: number
  createdAt: string
}

export type DaySwapStudent = {
  studentId: string
  studentName: string
  profileImageUrl: string | null
  parentId: string
  parentName: string | null
  parentEmail: string | null
  transactions: DaySwapTransaction[]
  allPaidDays: string[]   // sorted YYYY-MM-DD
}

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

export default async function DaySwapPage() {
  const client = createAdminClient()

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

  // Build student map — one entry per student
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

  // Attach transactions
  const allPaidDaysByStudent: Record<string, Set<string>> = {}
  for (const tx of txData ?? []) {
    if (!tx.student_id) continue
    const student = studentMap.get(tx.student_id)
    if (!student) continue
    const meta = (tx.metadata ?? {}) as Record<string, string>

    let weekSelections: WeekDayEntry[] = []
    if (meta.week_selections) {
      try { weekSelections = JSON.parse(meta.week_selections) } catch {}
    }
    if (!weekSelections.length) {
      // legacy fallback: derive from selected_weeks + selected_days
      const weeks = (meta.selected_weeks ?? '').split(',').map(Number).filter(Boolean)
      const days = (meta.selected_days ?? '').split(',').map((d: string) => d.trim()).filter(Boolean)
      weekSelections = weeks.map(w => ({ week: w, days }))
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

  // Sort: students with paid days first, then alpha
  const students = Array.from(studentMap.values()).sort((a, b) => {
    const aHas = a.allPaidDays.length > 0 ? 0 : 1
    const bHas = b.allPaidDays.length > 0 ? 0 : 1
    if (aHas !== bHas) return aHas - bHas
    return a.studentName.localeCompare(b.studentName)
  })

  return (
    <div className={poppins.className} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div
        className="px-6 pt-6 pb-2 flex-shrink-0"
        style={{ borderBottom: `1px solid ${colors.border}` }}
      >
        <h1 className="text-xl font-bold" style={{ color: colors.textPrimary }}>
          Homeschool Day Swap
        </h1>
        <p className="text-sm mt-0.5" style={{ color: colors.textTertiary }}>
          Swap a parent's paid homeschool drop-in day for a different date.
        </p>
      </div>
      <div className="flex-1 overflow-hidden">
        <DaySwapClient students={students} />
      </div>
    </div>
  )
}
