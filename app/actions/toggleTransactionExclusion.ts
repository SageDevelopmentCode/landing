'use server'
import { createAdminClient } from '@/app/lib/supabase-server'

export async function toggleTransactionExclusion(id: string, exclude: boolean) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .schema('billing')
    .from('stripe_transactions')
    .update({ exclude_from_revenue: exclude })
    .eq('id', id)
  if (error) return { success: false, error: error.message }
  return { success: true }
}
