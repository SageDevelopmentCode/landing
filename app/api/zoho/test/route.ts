import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/app/lib/supabase-server'

export async function GET() {
  try {
    // Check authentication
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const ZOHO_CLIENT_ID = process.env.ZOHO_CLIENT_ID
    const ZOHO_CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET
    const ZOHO_REDIRECT_URI = process.env.ZOHO_REDIRECT_URI
    const ZOHO_REFRESH_TOKEN = process.env.ZOHO_REFRESH_TOKEN
    const ZOHO_ACCOUNT_ID = process.env.ZOHO_ACCOUNT_ID

    // Check configuration
    const config = {
      hasClientId: !!ZOHO_CLIENT_ID,
      hasClientSecret: !!ZOHO_CLIENT_SECRET,
      hasRedirectUri: !!ZOHO_REDIRECT_URI,
      hasRefreshToken: !!ZOHO_REFRESH_TOKEN,
      hasAccountId: !!ZOHO_ACCOUNT_ID,
      clientIdPreview: ZOHO_CLIENT_ID?.substring(0, 10) + '...',
      redirectUri: ZOHO_REDIRECT_URI,
    }

    if (!ZOHO_REFRESH_TOKEN) {
      return NextResponse.json({
        error: 'Missing refresh token',
        config,
      })
    }

    // Try to get access token
    const params = new URLSearchParams({
      refresh_token: ZOHO_REFRESH_TOKEN,
      grant_type: 'refresh_token',
      client_id: ZOHO_CLIENT_ID!,
      client_secret: ZOHO_CLIENT_SECRET!,
    })

    const tokenResponse = await fetch('https://accounts.zoho.com/oauth/v2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    if (!tokenResponse.ok) {
      const tokenError = await tokenResponse.text()
      return NextResponse.json({
        error: 'Failed to refresh token',
        details: tokenError,
        config,
      })
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    // Get account info
    const accountsResponse = await fetch('https://mail.zoho.com/api/accounts', {
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
      },
    })

    if (!accountsResponse.ok) {
      const accountsError = await accountsResponse.text()
      return NextResponse.json({
        error: 'Failed to fetch accounts',
        details: accountsError,
        config,
      })
    }

    const accountsData = await accountsResponse.json()
    const accountId = accountsData.data?.[0]?.accountId || ZOHO_ACCOUNT_ID

    // Try to search for any emails and specifically for ayoizstacia@gmail.com
    const testEmail = 'ayoizstacia@gmail.com'
    const searchTests = [
      { name: 'All sent emails', query: 'in:sent' },
      { name: `Search: ${testEmail}`, query: testEmail },
      { name: `Search: to:${testEmail}`, query: `to:${testEmail}` },
      { name: `Search: from:${testEmail}`, query: `from:${testEmail}` },
      { name: `Search: (to:${testEmail} OR from:${testEmail})`, query: `(to:${testEmail} OR from:${testEmail})` },
      { name: `Search: to:${testEmail} OR from:${testEmail}`, query: `to:${testEmail} OR from:${testEmail}` },
      { name: `Search in sent: in:sent ${testEmail}`, query: `in:sent ${testEmail}` },
      { name: `Search in sent: in:sent to:${testEmail}`, query: `in:sent to:${testEmail}` },
    ]

    const results = []

    for (const test of searchTests) {
      const searchUrl = `https://mail.zoho.com/api/accounts/${accountId}/messages/search?searchKey=${encodeURIComponent(test.query)}&limit=5`

      const searchResponse = await fetch(searchUrl, {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
        },
      })

      const searchData = await searchResponse.json()

      results.push({
        test: test.name,
        query: test.query,
        url: searchUrl,
        status: searchResponse.status,
        count: searchData.data?.length || 0,
        statusCode: searchData.status?.code,
        statusDesc: searchData.status?.description,
        sample: searchData.data?.[0] || null,
      })
    }

    return NextResponse.json({
      success: true,
      config,
      accountInfo: {
        accountId,
        accountEmail: accountsData.data?.[0]?.primaryEmailAddress,
        accountName: accountsData.data?.[0]?.accountName,
      },
      searchTests: results,
    })
  } catch (error) {
    console.error('Test endpoint error:', error)
    return NextResponse.json(
      {
        error: 'Test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
