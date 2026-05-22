import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import ProfileDropdown from '@/app/apply/dashboard/ProfileDropdown'
import TeacherNav from '../TeacherNav'
import TeacherNotificationBell from '../../components/TeacherNotificationBell'
import NewsletterPageClient from './NewsletterPageClient'
import { getNewsletters } from '@/app/actions/newsletter'

export default async function NewsletterPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const adminClient = createAdminClient()

  const [{ data: adminUser }, { data: teachersRaw }, newsletters] = await Promise.all([
    adminClient
      .schema('admin')
      .from('users')
      .select('full_name, profile_image_url')
      .eq('id', user.id)
      .single(),
    adminClient
      .schema('admin')
      .from('users')
      .select('id, full_name, profile_image_url, role')
      .in('role', ['teacher', 'super_admin'])
      .eq('is_deleted', false)
      .neq('full_name', 'Test Teacher')
      .order('full_name'),
    getNewsletters(),
  ])

  const fullName = adminUser?.full_name ?? null
  const profileImageUrl = adminUser?.profile_image_url ?? null
  const teachers = (teachersRaw ?? []) as {
    id: string
    full_name: string | null
    profile_image_url: string | null
    role: string | null
  }[]

  return (
    <div className="bg-white min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-100 px-5 py-3 grid grid-cols-[auto_1fr_auto] items-center">
        <div className="flex items-center">
          <Link href="/">
            <Image
              src="/assets/Logo.png"
              alt="Sage Field"
              width={50}
              height={24}
              className="object-contain"
            />
          </Link>
        </div>
        <div className="flex items-center justify-center">
          <TeacherNav />
        </div>
        <div className="flex items-center justify-end gap-2">
          <TeacherNotificationBell userId={user.id} />
          {user?.email && (
            <ProfileDropdown email={user.email} fullName={fullName} userId={user.id} profileImageUrl={profileImageUrl} />
          )}
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <NewsletterPageClient teachers={teachers} currentUserId={user.id} initialNewsletters={newsletters} />
      </main>
    </div>
  )
}
