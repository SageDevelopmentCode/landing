'use client'

export default function SharedAccessBanner({
  isSharedAccess,
  primaryOwnerName,
}: {
  isSharedAccess: boolean
  primaryOwnerName: string | null
}) {
  if (!isSharedAccess) return null

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-5 py-2 text-sm text-amber-800 text-center">
      You are viewing <strong>{primaryOwnerName ?? "another parent"}</strong>&apos;s dashboard.
    </div>
  )
}
