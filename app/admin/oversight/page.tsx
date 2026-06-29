import { createServerSupabaseClient } from '@/app/lib/supabase-server'
import { redirect } from 'next/navigation'
import { getSummerAttendanceTrend } from '@/app/actions/oversightActions'
import { OversightClient } from './OversightClient'

export default async function OversightPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const trend = await getSummerAttendanceTrend()

  return (
    <div className="space-y-6 pt-6">
      <div>
        <h1 className="text-xl font-semibold" style={{ color: 'var(--admin-text-primary)' }}>
          Oversight
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--admin-text-tertiary)' }}>
          Summer 2026 enrollment summary across all 12 weeks
        </p>
      </div>
      <OversightClient trend={trend} />
    </div>
  )
}
