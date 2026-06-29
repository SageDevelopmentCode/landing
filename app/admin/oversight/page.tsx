import { createServerSupabaseClient } from '@/app/lib/supabase-server'
import { redirect } from 'next/navigation'
import { getSummerAttendanceTrend } from '@/app/actions/oversightActions'
import { getClockSessionsForRange } from '@/app/actions/timeclock'
import { OversightClient } from './OversightClient'
import { EmployeeHoursChart } from './EmployeeHoursChart'

function toDateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export default async function OversightPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const today = new Date()
  const start28 = new Date(today)
  start28.setDate(today.getDate() - 27)

  const [trend, sessions] = await Promise.all([
    getSummerAttendanceTrend(),
    getClockSessionsForRange(toDateStr(start28), toDateStr(today)),
  ])

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
      <EmployeeHoursChart sessions={sessions} />
    </div>
  )
}
