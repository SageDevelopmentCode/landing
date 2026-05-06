import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next')
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createServerSupabaseClient()
    const { data: { session } } = await supabase.auth.exchangeCodeForSession(code)

    // If a `next` param was provided (e.g. for password reset), go there directly
    if (next) {
      return NextResponse.redirect(`${origin}${next}`)
    }

    if (session?.user) {
      const adminClient = createAdminClient()
      const [{ data: adminUser }, { data: grantRows }] = await Promise.all([
        adminClient
          .schema('admin')
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single(),
        adminClient
          .schema('parent_app')
          .from('dashboard_access_grants')
          .select('id')
          .eq('grantee_id', session.user.id)
          .eq('status', 'active')
          .limit(1),
      ])

      if (adminUser?.role === 'teacher') {
        return NextResponse.redirect(`${origin}/teacher/dashboard`)
      }

      if (adminUser?.role === 'parent' || adminUser?.role === 'super_admin') {
        if ((grantRows ?? []).length > 0) {
          return NextResponse.redirect(`${origin}/parent/dashboard`)
        }
        if (adminUser?.role === 'parent') {
          return NextResponse.redirect(`${origin}/apply/dashboard`)
        }
      }
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(`${origin}/admin`)
}
