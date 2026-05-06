import { redirect } from 'next/navigation'
import { acceptDashboardInvite } from '@/app/actions/dashboard-access'

export default async function AcceptDashboardInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-sm text-center">
          <p className="text-gray-600">This invite link is invalid or has already been used.</p>
        </div>
      </div>
    )
  }

  const result = await acceptDashboardInvite(token)

  if ('error' in result && result.error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-sm text-center">
          <p className="text-gray-600">{result.error}</p>
        </div>
      </div>
    )
  }

  redirect('/parent/dashboard')
}
