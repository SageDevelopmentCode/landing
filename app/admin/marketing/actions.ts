'use server'

import { createAdminClient } from '@/app/lib/supabase-server'

export async function updateReferralStatus(id: string, status: string) {
  const adminClient = createAdminClient()
  await adminClient
    .schema('parent_app')
    .from('referrals')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
}
