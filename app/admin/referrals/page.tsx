import { createAdminClient } from '@/app/lib/supabase-server'
import { ReferralsClient } from './ReferralsClient'

export type AdminReferral = {
  id: string
  referrer_id: string
  referred_email: string | null
  referred_user_id: string | null
  application_id: string | null
  status: string
  created_at: string
  updated_at: string
  referrer_name: string | null
  referrer_email: string | null
  referred_name: string | null
}

async function updateReferralStatus(id: string, status: string) {
  'use server'
  const adminClient = createAdminClient()
  await adminClient
    .schema('parent_app')
    .from('referrals')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
}

export default async function ReferralsPage() {
  const adminClient = createAdminClient()

  const { data: referrals } = await adminClient
    .schema('parent_app')
    .from('referrals')
    .select('*')
    .order('created_at', { ascending: false })

  const rows = referrals ?? []

  // Collect all unique user IDs to resolve names in one query
  const referrerIds = [...new Set(rows.map((r) => r.referrer_id).filter(Boolean))]
  const referredIds = [...new Set(rows.map((r) => r.referred_user_id).filter(Boolean))]
  const allIds = [...new Set([...referrerIds, ...referredIds])]

  const { data: users } = allIds.length > 0
    ? await adminClient
        .schema('admin')
        .from('users')
        .select('id, full_name, email')
        .in('id', allIds)
    : { data: [] }

  const userMap: Record<string, { full_name: string | null; email: string | null }> = {}
  for (const u of users ?? []) {
    userMap[u.id] = { full_name: u.full_name, email: u.email }
  }

  const enriched: AdminReferral[] = rows.map((r) => ({
    ...r,
    referrer_name: userMap[r.referrer_id]?.full_name ?? null,
    referrer_email: userMap[r.referrer_id]?.email ?? null,
    referred_name: r.referred_user_id ? (userMap[r.referred_user_id]?.full_name ?? null) : null,
  }))

  return (
    <div className="space-y-6 pt-6">
      <div>
        <h1 className="text-xl font-semibold" style={{ color: 'var(--admin-text-primary)' }}>
          Referrals
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--admin-text-tertiary)' }}>
          {enriched.length} total · {enriched.filter((r) => r.status === 'applied').length} pending review
        </p>
      </div>
      <ReferralsClient referrals={enriched} updateReferralStatus={updateReferralStatus} />
    </div>
  )
}
