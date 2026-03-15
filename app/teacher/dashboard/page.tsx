import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import ProfileDropdown from '@/app/apply/dashboard/ProfileDropdown'
import Footer from '@/app/components/Footer'
import TeacherNav from './TeacherNav'

export default async function TeacherDashboard() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const adminClient = createAdminClient()
  const { data: adminUser } = await adminClient
    .schema('admin')
    .from('users')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const fullName = adminUser?.full_name ?? null

  return (
    <div className="bg-welcome-bg">
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-5 py-3 grid grid-cols-3 items-center">
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
          <div className="flex items-center justify-end">
            {user?.email && (
              <ProfileDropdown email={user.email} fullName={fullName} />
            )}
          </div>
        </header>

        <main className="flex-1 max-w-4xl mx-auto px-6 py-12">
          {/* Welcome */}
          <div className="mb-10">
            <h1 className="text-3xl font-bold font-heading text-gray-800 mb-2">
              Welcome, {fullName ?? 'Teacher'}.
            </h1>
          </div>

          {/* Placeholder sections */}
          <div className="space-y-6">
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">My Students</h2>
              <p className="text-sm text-gray-400">Your student roster will appear here.</p>
            </section>

            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">Schedule</h2>
              <p className="text-sm text-gray-400">Your class schedule will appear here.</p>
            </section>

            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">Messages</h2>
              <p className="text-sm text-gray-400">Your messages will appear here.</p>
            </section>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  )
}
