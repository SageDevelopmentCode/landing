import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'
import { redirect } from 'next/navigation'
import HelpWidgetWrapper from './components/HelpWidgetWrapper'

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const adminClient = createAdminClient()
  const { data: adminUser } = await adminClient
    .schema('admin')
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (adminUser?.role === 'teacher' || adminUser?.role === 'super_admin') {
    redirect('/teacher/dashboard')
  }

  return (
    <>
      {children}
      <HelpWidgetWrapper />
    </>
  )
}
