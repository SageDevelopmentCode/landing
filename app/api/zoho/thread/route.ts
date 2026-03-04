import { NextRequest, NextResponse } from 'next/server'
import { fetchEmailThread, isZohoConfigured } from '@/app/lib/zoho'
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

    // Get email address from query params
    const searchParams = request.nextUrl.searchParams
    const emailAddress = searchParams.get('email')

    if (!emailAddress) {
      return NextResponse.json(
        { error: 'Email address is required', message: 'Please provide an email query parameter' },
        { status: 400 }
      )
    }

    // Get limit from query params (default 50)
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    // Fetch email thread
    console.log(`[API] Fetching email thread for: ${emailAddress}`)
    const emails = await fetchEmailThread(emailAddress, limit)
    console.log(`[API] Returned ${emails.length} emails for ${emailAddress}`)

    return NextResponse.json({
      success: true,
      email: emailAddress,
      count: emails.length,
      data: emails,
    })
  } catch (error) {
    console.error('Error fetching email thread:', error)

    return NextResponse.json(
      {
        error: 'Failed to fetch email thread',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
