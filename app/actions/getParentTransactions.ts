'use server'
import { createAdminClient } from '@/app/lib/supabase-server'

export async function getParentTransactions(parentId: string) {
  const client = createAdminClient()
  const { data } = await client
    .schema('billing')
    .from('stripe_transactions')
    .select('*')
    .eq('parent_id', parentId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
  return data ?? []
}
