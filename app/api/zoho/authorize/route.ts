import { NextResponse } from 'next/server'
import { getAuthorizationUrl } from '@/app/lib/zoho'

export async function GET() {
  try {
    const authUrl = await getAuthorizationUrl()
    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error('Error generating authorization URL:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate authorization URL',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
