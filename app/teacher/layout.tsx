import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'
import { redirect } from 'next/navigation'

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
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

  if (adminUser?.role === 'parent') {
    redirect('/apply/dashboard')
  }

  if (adminUser?.role === 'super_admin') {
    redirect('/admin')
  }

  if (adminUser?.role !== 'teacher') {
    redirect('/login')
  }

  return <>{children}</>
}
