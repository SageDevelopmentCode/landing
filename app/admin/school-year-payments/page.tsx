import { createAdminClient } from '@/app/lib/supabase-server'
import { SchoolYearPaymentsClient } from './SchoolYearPaymentsClient'

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

export default async function SchoolYearPaymentsPage() {
  const client = createAdminClient()

  const { data: transactions } = await client
    .schema('billing')
    .from('stripe_transactions')
    .select('*')
    .in('payment_type', ['supply_fee', 'school_year_tuition', 'homeschool_dropin', 'homeschool'])
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })

  const rows = (transactions ?? []) as StripeTransaction[]

  const studentIds = [...new Set(rows.map(t => t.student_id).filter(Boolean))] as string[]
  const parentIds = [...new Set(rows.map(t => t.parent_id).filter(Boolean))] as string[]

  const [studentsResult, parentsResult] = await Promise.all([
    studentIds.length > 0
      ? client.schema('admin').from('students').select('id, child_legal_name').in('id', studentIds)
      : Promise.resolve({ data: [] }),
    parentIds.length > 0
      ? client.schema('admin').from('users').select('id, full_name').in('id', parentIds)
      : Promise.resolve({ data: [] }),
  ])

  const studentMap: Record<string, string> = {}
  for (const s of studentsResult.data ?? []) {
    if (s.child_legal_name) studentMap[s.id] = s.child_legal_name
  }

  const parentNameMap: Record<string, string> = {}
  for (const p of parentsResult.data ?? []) {
    if (p.full_name) parentNameMap[p.id] = p.full_name
  }

  return (
    <SchoolYearPaymentsClient
      transactions={rows}
      studentMap={studentMap}
      parentNameMap={parentNameMap}
    />
  )
}
