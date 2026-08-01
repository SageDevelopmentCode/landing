import { createAdminClient } from '@/app/lib/supabase-server'
import { cssColors as colors } from '../design-system'
import { Poppins } from 'next/font/google'
import { TransactionsClient } from './TransactionsClient'

const merriweather = Poppins({
  weight: ['300', '400', '700', '900'],
  subsets: ['latin'],
})

type PendingPaymentRequest = {
  id: string
  parent_id: string
  student_id: string | null
  program: string
  payment_type: string
  week: string | null
  month: string | null
  label: string
  amount_cents: number | null
  created_at: string
}

type EnrolledChild = {
  studentId: string
  name: string
  program: string
  applicationId: string
  dropInProgram: string | null
}

type PaidHomeschoolEntry = {
  weeks: number[]
  tier: string
  days: string[]
  weekDays: Record<number, string[]>
  amountCents: number
  createdAt: string
}

type PaidHomeschoolByStudent = Record<string, {
  summer: PaidHomeschoolEntry[]
  schoolYear: PaidHomeschoolEntry[]
}>

type StripeTransaction = {
  id: string
  stripe_session_id: string | null
  stripe_payment_intent_id: string | null
  payment_type: string
  status: string
  amount_cents: number
  intended_amount_cents: number | null
  currency: string
  cover_fees: boolean | null
  payer_name: string | null
  payer_email: string | null
  description: string | null
  student_id: string | null
  application_id: string | null
  parent_id: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string | null
  is_deleted: boolean
  exclude_from_revenue: boolean
}

export default async function TransactionsPage() {
  const client = createAdminClient()

  const { data: transactions } = await client
    .schema('billing')
    .from('stripe_transactions')
    .select('*')
    .eq('is_deleted', false)
    .eq('exclude_from_revenue', false)
    .order('created_at', { ascending: false })

  const rows = (transactions ?? []) as StripeTransaction[]

  const studentIds = [...new Set(rows.map(t => t.student_id).filter(Boolean))] as string[]
  const { data: students } = studentIds.length > 0
    ? await client
        .schema('admin')
        .from('students')
        .select('id, child_legal_name')
        .in('id', studentIds)
    : { data: [] }

  const studentMap: Record<string, string> = {}
  for (const s of students ?? []) {
    studentMap[s.id] = s.child_legal_name
  }

  const parentIds = [...new Set(rows.map(t => t.parent_id).filter(Boolean))] as string[]
  const { data: parentUsers } = parentIds.length > 0
    ? await client
        .schema('admin')
        .from('users')
        .select('id, full_name')
        .in('id', parentIds)
    : { data: [] }

  const parentNameMap: Record<string, string> = {}
  for (const p of parentUsers ?? []) {
    if (p.full_name) parentNameMap[p.id] = p.full_name
  }

  // Fetch enrolled applications so we can resolve children/programs for parents
  // whose registration_fee transaction has no student_id (combined payment flow)
  const { data: enrolledApps } = await client
    .schema('parent_app')
    .from('applications')
    .select('id, user_id, student_id, child_legal_name, program, drop_in_program')
    .eq('approved', true)
    .eq('status', 'enrolled')

  const enrolledChildrenMap: Record<string, EnrolledChild[]> = {}
  for (const app of enrolledApps ?? []) {
    if (!app.user_id || !app.student_id) continue
    enrolledChildrenMap[app.user_id] ??= []
    enrolledChildrenMap[app.user_id].push({
      studentId: app.student_id,
      name: app.child_legal_name ?? app.student_id.slice(0, 8),
      program: app.program ?? 'school_year_26_27',
      applicationId: app.id,
      dropInProgram: (app.drop_in_program as string | null) ?? null,
    })
    // Ensure studentMap includes these students
    if (app.student_id && app.child_legal_name && !studentMap[app.student_id]) {
      studentMap[app.student_id] = app.child_legal_name
    }
  }

  const paidHomeschoolByStudent: PaidHomeschoolByStudent = {}
  for (const tx of rows) {
    if (tx.payment_type !== 'homeschool_dropin' || !tx.student_id) continue
    const status = tx.status
    if (status !== 'completed' && status !== 'succeeded' && status !== 'paid') continue
    const meta = (tx.metadata ?? {}) as Record<string, string>
    const program = meta.program ?? 'summer_26'
    const tier = meta.tier ?? 'dropin'
    const days = meta.selected_days?.split(',').filter(Boolean) ?? []
    const weeks = meta.selected_weeks?.split(',').map(Number).filter(Boolean) ?? []
    const weekDays: Record<number, string[]> = {}
    if (meta.week_selections) {
      try {
        const parsed: { week: number; days: string[] }[] = JSON.parse(meta.week_selections)
        parsed.forEach(({ week, days: d }) => { weekDays[week] = d })
      } catch { /* fall through */ }
    }
    if (Object.keys(weekDays).length === 0) {
      weeks.forEach((w) => { weekDays[w] = days })
    }
    paidHomeschoolByStudent[tx.student_id] ??= { summer: [], schoolYear: [] }
    const entry: PaidHomeschoolEntry = { weeks, tier, days, weekDays, amountCents: tx.amount_cents, createdAt: tx.created_at }
    if (program === 'summer_26') {
      paidHomeschoolByStudent[tx.student_id].summer.push(entry)
    } else {
      paidHomeschoolByStudent[tx.student_id].schoolYear.push(entry)
    }
  }

  const { data: pendingData } = parentIds.length > 0
    ? await client
        .schema('billing')
        .from('pending_payment_requests')
        .select('id, parent_id, student_id, program, payment_type, week, month, label, amount_cents, created_at')
        .in('parent_id', parentIds)
        .eq('status', 'pending')
    : { data: [] }
  const pendingRequests = (pendingData ?? []) as PendingPaymentRequest[]

  return (
    <TransactionsClient transactions={rows} studentMap={studentMap} parentNameMap={parentNameMap} pendingRequests={pendingRequests} enrolledChildrenMap={enrolledChildrenMap} paidHomeschoolByStudent={paidHomeschoolByStudent} />
  )
}
