'use server'
import { createAdminClient } from '@/app/lib/supabase-server'
import { buildFunFridayConfirmationEmail, sendZohoEmail } from '../lib/zoho'

export async function sendFunFridayConfirmationEmail(opts: {
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
    .eq('payment_type', 'fun_friday_tuition')
    .eq('status', 'completed')
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!tx) return { success: false, error: 'No completed Fun Friday transaction found' }

  const meta = (tx.metadata ?? {}) as Record<string, string>
  const planType = (meta.plan_type === 'dropin' ? 'dropin' : 'monthly') as 'monthly' | 'dropin'
  const selectedMonths = meta.selected_months
    ? meta.selected_months.split(',').filter(Boolean)
    : []
  const selectedFridays = meta.selected_fridays
    ? meta.selected_fridays.split(',').filter(Boolean)
    : []
  const amountDollars = (tx.amount_cents / 100).toFixed(2)

  const { subject, content } = await buildFunFridayConfirmationEmail({
    g1FullName: opts.g1FullName,
    childLegalName: opts.childLegalName,
    planType,
    selectedMonths,
    selectedFridays,
    amountDollars,
  })

  return sendZohoEmail({ toAddress: opts.email, subject, content })
}
