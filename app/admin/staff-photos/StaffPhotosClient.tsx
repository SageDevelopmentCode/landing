'use client'

import { useRef, useState } from 'react'
import { Camera, Loader2 } from 'lucide-react'
import { cssColors as colors, radius } from '../design-system'
import { uploadStaffProfileImageAsAdmin } from '@/app/actions/uploadStaffProfileImageAsAdmin'
import { compressImage } from '@/app/utils/compressImage'

export type StaffMember = {
  id: string
  full_name: string | null
  email: string | null
  role: string | null
  profile_image_url: string | null
}

const ROLE_LABELS: Record<string, string> = {
  teacher: 'Teacher',
  super_admin: 'Super admin',
  teacher_aide: 'Teacher aide',
}

function initialsFor(name: string | null, email: string | null): string {
  if (name?.trim()) {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('')
  }
  return (email?.charAt(0) ?? '?').toUpperCase()
}

function StaffAvatar({
  name,
  email,
  imageUrl,
}: {
  name: string | null
  email: string | null
  imageUrl: string | null
}) {
  const initials = initialsFor(name, email)
  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt={name ?? email ?? 'Staff'}
        className="w-14 h-14 rounded-full object-cover shrink-0"
        style={{ border: `2px solid ${colors.border}` }}
      />
    )
  }
  return (
    <div
      className="w-14 h-14 rounded-full flex items-center justify-center text-sm font-semibold shrink-0"
      style={{
        backgroundColor: colors.pastelSage,
        color: colors.mistyForest,
        border: `2px solid ${colors.border}`,
      }}
    >
      {initials}
    </div>
  )
}

export function StaffPhotosClient({ staff }: { staff: StaffMember[] }) {
  const [imageUrls, setImageUrls] = useState<Record<string, string | null>>(() =>
    Object.fromEntries(staff.map((s) => [s.id, s.profile_image_url])),
  )
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [errorById, setErrorById] = useState<Record<string, string>>({})
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  async function handleFileChange(userId: string, e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.files?.[0]
    e.target.value = ''
    if (!raw) return

    setUploadingId(userId)
    setErrorById((prev) => {
      const next = { ...prev }
      delete next[userId]
      return next
    })

    try {
      const file = await compressImage(raw, { maxDimension: 400 })
      const formData = new FormData()
      formData.append('userId', userId)
      formData.append('file', file)
      const result = await uploadStaffProfileImageAsAdmin(formData)
      if ('error' in result) {
        setErrorById((prev) => ({ ...prev, [userId]: result.error }))
      } else {
        setImageUrls((prev) => ({
          ...prev,
          [userId]: `${result.url}?t=${Date.now()}`,
        }))
      }
    } finally {
      setUploadingId(null)
    }
  }

  if (staff.length === 0) {
    return (
      <p className="text-sm" style={{ color: colors.textSecondary }}>
        No staff accounts found.
      </p>
    )
  }

  return (
    <ul className="space-y-3">
      {staff.map((member) => {
        const uploading = uploadingId === member.id
        const err = errorById[member.id]
        const roleLabel = ROLE_LABELS[member.role ?? ''] ?? member.role ?? '—'

        return (
          <li
            key={member.id}
            className="flex flex-wrap items-center gap-4 p-4"
            style={{
              backgroundColor: colors.surface,
              borderRadius: radius.md,
              border: `1px solid ${colors.border}`,
            }}
          >
            <StaffAvatar
              name={member.full_name}
              email={member.email}
              imageUrl={imageUrls[member.id] ?? null}
            />
            <div className="flex-1 min-w-[12rem]">
              <p className="font-medium text-sm" style={{ color: colors.textPrimary }}>
                {member.full_name ?? '—'}
              </p>
              <p className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>
                {member.email ?? '—'}
              </p>
              <p className="text-xs mt-0.5" style={{ color: colors.textTertiary }}>
                {roleLabel}
              </p>
              {err ? (
                <p className="text-xs mt-1" style={{ color: colors.error }}>
                  {err}
                </p>
              ) : null}
            </div>
            <div>
              <input
                ref={(el) => {
                  fileInputRefs.current[member.id] = el
                }}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => handleFileChange(member.id, e)}
              />
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInputRefs.current[member.id]?.click()}
                className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-opacity disabled:opacity-50"
                style={{
                  backgroundColor: colors.mistyForest,
                  color: 'white',
                }}
              >
                {uploading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Camera className="w-3.5 h-3.5" />
                )}
                {imageUrls[member.id] ? 'Replace photo' : 'Upload photo'}
              </button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
