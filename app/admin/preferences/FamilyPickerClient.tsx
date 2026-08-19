'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRight, Search, Users } from 'lucide-react'
import { cssColors as colors, cssShadows as shadows } from '../design-system'
import type { EnrolledFamilyRow } from './loadFamilyPreferenceData'

export function FamilyPickerClient({ families }: { families: EnrolledFamilyRow[] }) {
  const router = useRouter()
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return families
    return families.filter((f) => {
      const parentMatch =
        (f.full_name ?? '').toLowerCase().includes(q) ||
        (f.email ?? '').toLowerCase().includes(q)
      const childMatch = f.children.some((c) => c.name.toLowerCase().includes(q))
      return parentMatch || childMatch
    })
  }, [families, search])

  return (
    <div className="space-y-5">
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
          style={{ color: colors.textTertiary }}
        />
        <input
          type="text"
          placeholder="Search parent, email, or child name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-sm outline-none rounded-xl pl-10 pr-3 py-2.5"
          style={{
            backgroundColor: colors.elevated,
            border: `1px solid ${colors.border}`,
            color: colors.textPrimary,
          }}
        />
      </div>

      <div
        className="rounded-xl overflow-hidden"
        style={{ border: `1px solid ${colors.border}`, boxShadow: shadows.soft }}
      >
        {filtered.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Users className="w-8 h-8 mx-auto mb-3" style={{ color: colors.textQuaternary }} />
            <p className="text-sm" style={{ color: colors.textTertiary }}>
              No families match your search
            </p>
          </div>
        ) : (
          <ul>
            {filtered.map((family, i) => (
              <li
                key={family.id}
                style={{
                  borderBottom:
                    i < filtered.length - 1 ? `1px solid ${colors.border}` : 'none',
                }}
              >
                <button
                  type="button"
                  onClick={() => router.push(`/admin/preferences?parentId=${family.id}`)}
                  className="w-full flex items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-black/[0.02]"
                  style={{ backgroundColor: colors.surface }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-semibold"
                    style={{ backgroundColor: colors.accentLight, color: colors.accent }}
                  >
                    {(family.full_name ?? family.email ?? '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate" style={{ color: colors.textPrimary }}>
                      {family.full_name ?? 'Unnamed parent'}
                    </p>
                    {family.email && (
                      <p className="text-xs truncate mt-0.5" style={{ color: colors.textTertiary }}>
                        {family.email}
                      </p>
                    )}
                    <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                      {family.children.map((c) => c.name).join(' · ')}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 shrink-0" style={{ color: colors.textQuaternary }} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
