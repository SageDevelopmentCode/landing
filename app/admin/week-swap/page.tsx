import { createAdminClient } from '@/app/lib/supabase-server'
import { Poppins } from 'next/font/google'
import { cssColors as colors } from '../design-system'
import { WeekSwapClient } from './WeekSwapClient'

const poppins = Poppins({ weight: ['300', '400', '700', '900'], subsets: ['latin'] })

export type WeekSwapTransaction = {
  id: string
  weeks: number[]
  amountCents: number
  createdAt: string
}

export type WeekSwapStudent = {
  studentId: string
  studentName: string
  profileImageUrl: string | null
  parentId: string
  parentName: string | null
  parentEmail: string | null
  transactions: WeekSwapTransaction[]
  allPaidWeeks: number[]
}

export default async function WeekSwapPage() {
  const client = createAdminClient()

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

  // Build student map — one entry per student
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

  // Attach transactions — only weekly-plan rows
  const allPaidWeeksByStudent: Record<string, Set<number>> = {}
  for (const tx of txData ?? []) {
    if (!tx.student_id) continue
    const student = studentMap.get(tx.student_id)
    if (!student) continue
    const meta = (tx.metadata ?? {}) as Record<string, string>
    if (meta.plan_type === 'full') continue // full-plan not eligible
    const weeks = (meta.weeks ?? '').split(',').map(Number).filter(Boolean)
    if (weeks.length === 0) continue
    student.transactions.push({ id: tx.id, weeks, amountCents: tx.amount_cents, createdAt: tx.created_at })
    if (!allPaidWeeksByStudent[tx.student_id]) allPaidWeeksByStudent[tx.student_id] = new Set()
    weeks.forEach((w) => allPaidWeeksByStudent[tx.student_id].add(w))
  }

  for (const student of studentMap.values()) {
    student.allPaidWeeks = [...(allPaidWeeksByStudent[student.studentId] ?? [])].sort((a, b) => a - b)
  }

  // Sort: students with paid weeks first, then alpha
  const students = Array.from(studentMap.values()).sort((a, b) => {
    const aHas = a.allPaidWeeks.length > 0 ? 0 : 1
    const bHas = b.allPaidWeeks.length > 0 ? 0 : 1
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
          Summer Week Swap
        </h1>
        <p className="text-sm mt-0.5" style={{ color: colors.textTertiary }}>
          Swap a parent's paid summer week for a different one (weekly-plan only).
        </p>
      </div>
      <div className="flex-1 overflow-hidden">
        <WeekSwapClient students={students} />
      </div>
    </div>
  )
}
