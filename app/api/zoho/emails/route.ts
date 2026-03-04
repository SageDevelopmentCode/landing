import { NextRequest, NextResponse } from 'next/server'
import { fetchSentEmails, isZohoConfigured } from '@/app/lib/zoho'
import { createServerSupabaseClient } from '@/app/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if Zoho is configured
    if (!(await isZohoConfigured())) {
      return NextResponse.json(
        {
          error: 'Zoho Mail API is not configured',
          message:
            'Please set up ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REDIRECT_URI, and ZOHO_REFRESH_TOKEN in your environment variables',
        },
        { status: 503 }
      )
    }

    // Get limit from query params (default 50)
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    // Fetch sent emails
    const emails = await fetchSentEmails(limit)

    return NextResponse.json({
      success: true,
      count: emails.length,
      data: emails,
    })
  } catch (error) {
    console.error('Error fetching sent emails:', error)

    return NextResponse.json(
      {
        error: 'Failed to fetch sent emails',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
