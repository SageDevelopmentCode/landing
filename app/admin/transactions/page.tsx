import { createAdminClient } from '@/app/lib/supabase-server'
import { colors } from '../design-system'
import { Merriweather } from 'next/font/google'
import { TransactionsClient } from './TransactionsClient'

const merriweather = Merriweather({
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
    <div className="space-y-6 pt-6">
      <div>
        <h1
          className={`text-2xl font-bold ${merriweather.className}`}
          style={{ color: colors.mistyForest }}
        >
          Transactions
        </h1>
        <p className="mt-2" style={{ color: colors.textSecondary }}>
          {rows.length} transaction{rows.length !== 1 ? 's' : ''}
        </p>
      </div>

      <TransactionsClient transactions={rows} studentMap={studentMap} parentNameMap={parentNameMap} pendingRequests={pendingRequests} />
    </div>
  )
}
