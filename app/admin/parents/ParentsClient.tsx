'use client'

import { useState } from 'react'
import { ParentDetailSidebar } from '../components/ParentDetailSidebar'
import { cssColors as colors } from '../design-system'

type Parent = {
  id: string
  email: string | null
  full_name: string | null
  profile_image_url?: string | null
  g1_cell_phone: string | null
  g1_work_phone: string | null
  g1_preferred_contact: boolean | null
  g1_lives_with_child: boolean | null
  g1_has_custody: boolean | null
  g2_full_name: string | null
  g2_relationship: string | null
  g2_email: string | null
  g2_cell_phone: string | null
  g2_work_phone: string | null
  [key: string]: unknown
}

type ParentDetail = {
  children: {
    id: string
    child_legal_name: string | null
    dob_month: string | null
    dob_day: string | null
    dob_year: string | null
  }[]
  applications: {
    id: string
    child_legal_name: string | null
    program: string | null
    drop_in_program: string | null
    status: string
    approved: boolean
    approved_at: string | null
    updated_at: string | null
  }[]
}

interface ParentsClientProps {
  parents: Parent[]
  fetchParentDetail: (parentId: string) => Promise<ParentDetail>
}

const HEADERS = ['Full Name', 'G1 Cell Phone', 'G2 Full Name', 'G2 Relationship', 'G2 Email', 'G2 Cell Phone']
const COLS = 'grid-cols-[2fr_1fr_1.5fr_1fr_1.5fr_1fr]'

const AVATAR_COLORS = [
  '#4a7c59', '#5E7C68', '#6b9e7a', '#3d6b4f', '#527a60',
  '#4f8865', '#3a6b52', '#629973', '#456a55', '#5a8c6a',
]

function avatarColor(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) & 0xfffffff
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

function getInitials(name: string | null): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function ParentsClient({ parents: initialParents, fetchParentDetail }: ParentsClientProps) {
  const [parents, setParents] = useState<Parent[]>(initialParents)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedParent, setSelectedParent] = useState<Parent | null>(null)
  const [detail, setDetail] = useState<ParentDetail | null>(null)
  const [loading, setLoading] = useState(false)

  const handleRowClick = async (parent: Parent) => {
    setSelectedParent(parent)
    setDetail(null)
    setLoading(true)
    try {
      const result = await fetchParentDetail(parent.id)
      setDetail(result)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setSelectedParent(null)
    setDetail(null)
  }

  const handleParentDeleted = (parentId: string) => {
    setParents((prev) => prev.filter((p) => p.id !== parentId))
  }

  const filteredParents = searchQuery
    ? parents.filter((p) => {
        const q = searchQuery.toLowerCase()
        return (
          p.full_name?.toLowerCase().includes(q) ||
          p.email?.toLowerCase().includes(q) ||
          p.g1_cell_phone?.toLowerCase().includes(q) ||
          p.g2_full_name?.toLowerCase().includes(q) ||
          p.g2_email?.toLowerCase().includes(q) ||
          p.g2_cell_phone?.toLowerCase().includes(q)
        )
      })
    : parents

  return (
    <>
      <div className="flex items-center gap-1.5 p-1 rounded-xl w-fit mb-4" style={{ backgroundColor: '#F5F0E8', border: '1px solid #E8E0D0' }}>
        <svg className="ml-1.5 w-3.5 h-3.5 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pr-2 py-0.5 text-xs font-semibold bg-transparent border-none outline-none w-40 placeholder:font-normal text-gray-500"
        />
      </div>

      {/* Column header row */}
      <div
        className={`grid ${COLS} gap-4 px-2 py-2`}
        style={{ borderBottom: `1px solid ${colors.border}` }}
      >
        {HEADERS.map((h) => (
          <span
            key={h}
            className="text-[11px] font-semibold uppercase tracking-wide"
            style={{ color: colors.textTertiary }}
          >
            {h}
          </span>
        ))}
      </div>

      {/* Rows */}
      <div className="divide-y" style={{ borderColor: colors.border }}>
        {filteredParents.length === 0 && (
          <div className="px-2 py-12 text-center text-sm" style={{ color: colors.textTertiary }}>
            No parents found.
          </div>
        )}
        {filteredParents.map((parent) => (
          <div
            key={parent.id}
            onClick={() => handleRowClick(parent)}
            className={`grid ${COLS} gap-4 px-2 py-2.5 cursor-pointer transition-colors duration-100 hover:bg-[var(--admin-elevated)] items-center`}
            style={{ borderColor: colors.border }}
          >
            {/* Name + avatar */}
            <div className="flex items-center gap-2.5 min-w-0">
              {parent.profile_image_url ? (
                <img
                  src={parent.profile_image_url}
                  alt={parent.full_name ?? 'Parent'}
                  className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                  style={{ backgroundColor: avatarColor(parent.id) }}
                >
                  {getInitials(parent.full_name)}
                </div>
              )}
              <span className="text-xs font-medium truncate" style={{ color: colors.textPrimary }}>
                {parent.full_name ?? '—'}
              </span>
            </div>
            <span className="text-xs truncate" style={{ color: colors.textSecondary }}>
              {parent.g1_cell_phone ?? '—'}
            </span>
            <span className="text-xs truncate" style={{ color: colors.textSecondary }}>
              {parent.g2_full_name ?? '—'}
            </span>
            <span className="text-xs truncate" style={{ color: colors.textSecondary }}>
              {parent.g2_relationship ?? '—'}
            </span>
            <span className="text-xs truncate" style={{ color: colors.textSecondary }}>
              {parent.g2_email ?? '—'}
            </span>
            <span className="text-xs truncate" style={{ color: colors.textSecondary }}>
              {parent.g2_cell_phone ?? '—'}
            </span>
          </div>
        ))}
      </div>

      <ParentDetailSidebar
        parent={selectedParent}
        detail={detail}
        loading={loading}
        onClose={handleClose}
        onParentDeleted={handleParentDeleted}
      />
    </>
  )
}
