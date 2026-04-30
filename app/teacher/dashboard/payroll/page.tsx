import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import ProfileDropdown from '@/app/apply/dashboard/ProfileDropdown'
import TeacherNav from '../TeacherNav'
import PayrollPageClient from './PayrollPageClient'
import { getMyPaystubs, getMyHourlyRate } from '@/app/actions/paystubs'
import { getTeacherSessions } from '@/app/actions/teacherHours'

export default async function PayrollPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const adminClient = createAdminClient()
  const { data: adminUser } = await adminClient
    .schema('admin')
    .from('users')
    .select('full_name, profile_image_url')
    .eq('id', user.id)
    .single()

  const [paystubs, hourlyRate, sessionsByDay] = await Promise.all([
    getMyPaystubs(),
    getMyHourlyRate(),
    getTeacherSessions(),
  ])

  return (
    <div className="bg-welcome-bg min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-100 px-5 py-3 grid grid-cols-[auto_1fr_auto] items-center">
        <div className="flex items-center">
          <Link href="/">
            <Image src="/assets/Logo.png" alt="Sage Field" width={50} height={24} className="object-contain" />
          </Link>
        </div>
        <div className="flex items-center justify-center">
          <TeacherNav />
        </div>
        <div className="flex items-center justify-end">
          {user?.email && (
            <ProfileDropdown
              email={user.email}
              fullName={adminUser?.full_name ?? null}
              userId={user.id}
              profileImageUrl={adminUser?.profile_image_url ?? null}
            />
          )}
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <PayrollPageClient
          paystubs={paystubs}
          hourlyRate={hourlyRate}
          sessionsByDay={sessionsByDay}
        />
      </main>
    </div>
  )
}
