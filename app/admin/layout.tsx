import { createServerSupabaseClient } from '@/app/lib/supabase-server'
import { redirect } from 'next/navigation'
import { signOut } from '@/app/actions/auth'
import { Sidebar } from './components/Sidebar'
import { TopBar } from './components/TopBar'
import { colors, radius, shadows } from './design-system'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user is admin
  const { data: adminUser } = await supabase
    .schema('admin')
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!adminUser) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: colors.softCloud }}
      >
        <div
          className="bg-white p-8 max-w-md w-full text-center"
          style={{
            borderRadius: radius.lg,
            boxShadow: shadows.medium,
            border: `1px solid ${colors.border}`,
          }}
        >
          <h1
            className="text-2xl font-bold mb-4"
            style={{ color: colors.errorText }}
          >
            Access Denied
          </h1>
          <p className="mb-6" style={{ color: colors.textSecondary }}>
            You do not have permission to access the admin area.
          </p>
          <form action={signOut}>
            <button
              type="submit"
              className="px-6 py-3 text-white text-sm font-medium transition-all duration-200 hover:opacity-90"
              style={{
                backgroundColor: colors.mistyForest,
                borderRadius: radius.md,
                boxShadow: shadows.soft,
                border: 'none',
              }}
            >
              Sign Out
            </button>
          </form>
        </div>
      </div>
    )
  }

  async function handleSignOut() {
    'use server'
    await signOut()
  }

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: colors.softCloud }}
    >
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar userEmail={user.email} onSignOut={handleSignOut} />
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
