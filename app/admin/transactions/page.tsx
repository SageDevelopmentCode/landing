import { createAdminClient } from '@/app/lib/supabase-server'
import { colors } from '../design-system'
import { Merriweather } from 'next/font/google'
import { TransactionsClient } from './TransactionsClient'

const merriweather = Merriweather({
  weight: ['300', '400', '700', '900'],
  subsets: ['latin'],
})

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
}

export default async function TransactionsPage() {
  const client = createAdminClient()

  const { data: transactions } = await client
    .schema('billing')
    .from('stripe_transactions')
    .select('*')
    .order('created_at', { ascending: false })

  const rows = (transactions ?? []) as StripeTransaction[]

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

      <TransactionsClient transactions={rows} />
    </div>
  )
}
