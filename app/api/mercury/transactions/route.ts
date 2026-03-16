import { NextResponse } from 'next/server'

export async function GET() {
  const token = process.env.MERCURY_API_TOKEN?.trim()
  console.log('[Mercury] token repr:', JSON.stringify(token))
  if (!token) {
    return NextResponse.json({ error: 'MERCURY_API_TOKEN not configured' }, { status: 500 })
  }

  const headers = new Headers()
  headers.set('Authorization', `Bearer ${token}`)
  headers.set('Content-Type', 'application/json')
  console.log('[Mercury] auth header:', headers.get('Authorization')?.slice(0, 30))

  try {
    const accountsRes = await fetch('https://api.mercury.com/api/v1/accounts', {
      headers,
      cache: 'no-store',
    })
    if (!accountsRes.ok) {
      const errBody = await accountsRes.text()
      console.error('[Mercury] 401 body:', errBody)   // TODO: remove after debugging
      return NextResponse.json({ error: `Mercury accounts API error: ${accountsRes.status}`, detail: errBody }, { status: accountsRes.status })
    }
    const accountsData = await accountsRes.json()
    const accounts: Array<{ id: string; name: string; accountNumber: string }> =
      accountsData.accounts ?? []
    const txArrays = await Promise.all(
      accounts.map(async (account) => {
        const txHeaders = new Headers()
        txHeaders.set('Authorization', `Bearer ${token}`)
        txHeaders.set('Content-Type', 'application/json')
        const res = await fetch(
          `https://api.mercury.com/api/v1/account/${account.id}/transactions`,
          { headers: txHeaders, cache: 'no-store' }
        )
        if (!res.ok) {
          const body = await res.text()
          console.error(`[Mercury] tx fetch ${account.id} ${res.status}:`, body)
          return []
        }
        const data = await res.json()
        const txs: unknown[] = data.transactions ?? []
        return txs.map((tx) => ({
          ...(tx as Record<string, unknown>),
          accountName: account.name,
          accountNumber: account.accountNumber,
        }))
      })
    )

    const allTransactions = txArrays
      .flat()
      .sort((a, b) => {
        const dateA = (a as Record<string, unknown>).postedAt ?? (a as Record<string, unknown>).createdAt ?? ''
        const dateB = (b as Record<string, unknown>).postedAt ?? (b as Record<string, unknown>).createdAt ?? ''
        return String(dateB).localeCompare(String(dateA))
      })

    return NextResponse.json({ transactions: allTransactions, accounts })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
