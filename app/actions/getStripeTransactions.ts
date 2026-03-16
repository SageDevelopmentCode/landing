'use server'
import { createAdminClient } from '@/app/lib/supabase-server'

export async function getStripeTransactions() {
  const client = createAdminClient()
  const { data } = await client
    .schema('billing')
    .from('stripe_transactions')
    .select('*')
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
  return data ?? []
}
