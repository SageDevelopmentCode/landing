'use server'
import { createAdminClient } from '@/app/lib/supabase-server'
import { buildHomeschoolDropInConfirmationEmail, sendZohoEmail } from '../lib/zoho'

export async function sendHomeschoolDropInConfirmationEmail(opts: {
  g1FullName: string
  childLegalName: string
  email: string
  applicationId: string
}): Promise<{ success: boolean; error?: string }> {
  const client = createAdminClient()

  const { data: tx } = await client
    .schema('billing')
    .from('stripe_transactions')
    .select('*')
    .eq('application_id', opts.applicationId)
    .eq('payment_type', 'homeschool_dropin')
    .eq('status', 'completed')
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!tx) return { success: false, error: 'No completed homeschool drop-in transaction found' }

  const meta = (tx.metadata ?? {}) as Record<string, string>
  const program = meta.program ?? 'summer_26'
  const tier = meta.tier ?? 'dropin'
  const selectedDays = meta.selected_days
    ? meta.selected_days.split(',').filter(Boolean)
    : []
  const selectedWeeks = meta.selected_weeks
    ? meta.selected_weeks.split(',').map(Number).filter(Boolean)
    : []
  const amountDollars = (tx.amount_cents / 100).toFixed(2)

  const { subject, content } = await buildHomeschoolDropInConfirmationEmail({
    g1FullName: opts.g1FullName,
    childLegalName: opts.childLegalName,
    program,
    tier,
    selectedDays,
    selectedWeeks,
    amountDollars,
  })

  return sendZohoEmail({ toAddress: opts.email, subject, content })
}
