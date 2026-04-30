import { createAdminClient } from '@/app/lib/supabase-server'
import { cssColors as colors } from '../design-system'
import { Poppins } from 'next/font/google'
import { PayrollClient } from './PayrollClient'
import { getAllPaystubs } from '@/app/actions/paystubs'

const poppins = Poppins({ weight: ['300', '400', '700', '900'], subsets: ['latin'] })

async function getTeachersWithRates() {
  const adminClient = createAdminClient()
  const { data } = await adminClient
    .schema('admin')
    .from('users')
    .select('id, full_name, email, hourly_rate')
    .in('role', ['teacher', 'super_admin'])
    .eq('is_deleted', false)
    .order('full_name')
  return (data ?? []) as Array<{
    id: string
    full_name: string | null
    email: string
    hourly_rate: number | null
  }>
}

export default async function AdminPayrollPage() {
  const [paystubs, teachers] = await Promise.all([
    getAllPaystubs(),
    getTeachersWithRates(),
  ])

  const pending  = paystubs.filter((p) => p.status === 'pending').length
  const approved = paystubs.filter((p) => p.status === 'approved').length

  return (
    <div className="space-y-6 pt-6">
      <div>
        <h1
          className={`text-2xl font-bold ${poppins.className}`}
          style={{ color: colors.mistyForest }}
        >
          Payroll
        </h1>
        <p className="mt-1 text-sm" style={{ color: colors.textSecondary }}>
          {paystubs.length} total &middot; {pending} pending &middot; {approved} approved
        </p>
      </div>

      <PayrollClient
        paystubs={paystubs}
        teachers={teachers}
      />
    </div>
  )
}
