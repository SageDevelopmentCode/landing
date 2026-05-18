import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import ProfileDropdown from '@/app/apply/dashboard/ProfileDropdown'
import TeacherNotificationBell from '../../components/TeacherNotificationBell'
import TeacherNav from '../TeacherNav'
import InventoryPageClient from './InventoryPageClient'
import { getInventoryItems } from '@/app/actions/inventory'

export default async function InventoryPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const adminClient = createAdminClient()
  const [{ data: adminUser }, initialItems] = await Promise.all([
    adminClient
      .schema('admin')
      .from('users')
      .select('full_name, profile_image_url')
      .eq('id', user.id)
      .single(),
    getInventoryItems(),
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
        <div className="flex items-center justify-end gap-2">
          <TeacherNotificationBell userId={user.id} />
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
        <InventoryPageClient
          initialItems={initialItems}
          currentUserId={user.id}
          currentUserName={adminUser?.full_name ?? 'You'}
        />
      </main>
    </div>
  )
}
