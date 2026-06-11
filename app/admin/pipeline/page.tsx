import { createAdminClient } from '@/app/lib/supabase-server'
import { Poppins } from 'next/font/google'
import { PipelineClient } from './PipelineClient'

const poppins = Poppins({ weight: ['300', '400', '700', '900'], subsets: ['latin'] })

export default async function PipelinePage() {
  const client = createAdminClient()

  const [{ data: transactions }, { data: emailLogs }] = await Promise.all([
    client
      .schema('billing')
      .from('stripe_transactions')
      .select('id, stripe_session_id, payment_type, status, amount_cents, payer_email, payer_name, application_id, parent_id, metadata, created_at')
      .order('created_at', { ascending: false })
      .limit(500),
    client
      .schema('email_logs')
      .from('sends')
      .select('id, application_id, to_address, subject, status, error_message, sent_at')
      .order('sent_at', { ascending: false })
      .limit(2000),
  ])

  return (
    <div className={poppins.className}>
      <PipelineClient transactions={transactions ?? []} emailLogs={emailLogs ?? []} />
    </div>
  )
}
