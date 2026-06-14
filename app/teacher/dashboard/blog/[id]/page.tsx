import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import ProfileDropdown from '@/app/apply/dashboard/ProfileDropdown'
import TeacherNav from '../../TeacherNav'
import TeacherNotificationBell from '../../../components/TeacherNotificationBell'
import BlogEditorClient from './BlogEditorClient'
import { getBlogPostById } from '@/app/actions/blog'

export default async function BlogEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const adminClient = createAdminClient()

  const [{ data: adminUser }, post] = await Promise.all([
    adminClient
      .schema('admin')
      .from('users')
      .select('full_name, profile_image_url')
      .eq('id', user.id)
      .single(),
    getBlogPostById(id),
  ])

  if (!post) notFound()

  const fullName = adminUser?.full_name ?? null
  const profileImageUrl = adminUser?.profile_image_url ?? null

  return (
    <div className="bg-white h-screen flex flex-col">
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
        <BlogEditorClient post={post} currentUserId={user.id} />
      </main>
    </div>
  )
}
