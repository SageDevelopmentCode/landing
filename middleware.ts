import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from '@/app/lib/supabase-middleware'

export async function middleware(request: NextRequest) {
  const { user, supabaseResponse } = await updateSession(request)

  // Protected admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirectTo', request.nextUrl.pathname)
      return NextResponse.redirect(url)
    }

    // Check if user is an admin
    // This will be validated server-side in the admin layout as well
    // The middleware just does basic auth check
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/admin/:path*', '/apply/:path*'],
  runtime: 'nodejs',
}
