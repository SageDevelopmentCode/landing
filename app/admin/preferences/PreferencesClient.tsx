'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import { cssColors as colors, cssShadows as shadows } from '../design-system'
import { adminSetStudentDefaultPreference } from '@/app/actions/adminPreferences'
import type { StudentPrefRow } from './page'

type ParticipationLevel = 'watch' | 'cook_no_eat' | 'full'
type FilterKey = 'all' | 'set' | 'not_set'

const LEVEL_STYLES: Record<ParticipationLevel, { bg: string; color: string; label: string }> = {
  watch:       { bg: 'rgba(100,116,139,0.15)', color: '#64748B', label: 'Watch only' },
  cook_no_eat: { bg: 'rgba(245,158,11,0.15)',  color: '#D97706', label: 'Cook, don\'t eat' },
  full:        { bg: 'rgba(34,197,94,0.15)',   color: '#16A34A', label: 'Full participation' },
}

function PrefBadge({ level }: { level: ParticipationLevel | null }) {
  if (!level) {
    return (
      <span
        className="inline-flex items-center font-medium rounded-full"
        style={{
          backgroundColor: 'rgba(82,82,82,0.12)',
          color: colors.textTertiary,
          fontSize: '11px',
          padding: '3px 10px',
          whiteSpace: 'nowrap',
        }}
      >
        —
      </span>
    )
  }
  const style = LEVEL_STYLES[level]
  return (
    <span
      className="inline-flex items-center font-medium rounded-full"
      style={{
        backgroundColor: style.bg,
        color: style.color,
        fontSize: '11px',
        padding: '3px 10px',
        whiteSpace: 'nowrap',
      }}
    >
      {style.label}
    </span>
  )
}

function PrefSelect({
  studentId,
  parentId,
  current,
  onChange,
}: {
  studentId: string
  parentId: string
  current: ParticipationLevel | null
  onChange: (studentId: string, level: ParticipationLevel | null) => void
}) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value
    const level = val === '' ? null : (val as ParticipationLevel)
    setSaving(true)
    setError(null)
    onChange(studentId, level) // optimistic
    const result = await adminSetStudentDefaultPreference(parentId, studentId, level)
    setSaving(false)
    if (result.error) {
      setError(result.error)
      onChange(studentId, current) // revert
    }
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={current ?? ''}
        onChange={handleChange}
        disabled={saving}
        className="text-xs rounded-lg px-2 py-1.5 outline-none"
        style={{
          backgroundColor: colors.elevated,
          border: `1px solid ${colors.border}`,
          color: colors.textPrimary,
          opacity: saving ? 0.6 : 1,
          cursor: saving ? 'not-allowed' : 'pointer',
          minWidth: '150px',
        }}
      >
        <option value="">— Not set —</option>
        <option value="watch">Watch only</option>
        <option value="cook_no_eat">Cook, don&apos;t eat</option>
        <option value="full">Full participation</option>
      </select>
      {error && (
        <span className="text-xs" style={{ color: '#EF4444' }}>
          Error
        </span>
      )}
    </div>
  )
}

export function PreferencesClient({
  rows: initialRows,
  totalCount,
  setCount,
  notSetCount,
}: {
  rows: StudentPrefRow[]
  totalCount: number
  setCount: number
  notSetCount: number
}) {
  const [rows, setRows] = useState<StudentPrefRow[]>(initialRows)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterKey>('all')

  function handleLevelChange(studentId: string, level: ParticipationLevel | null) {
    setRows((prev) =>
      prev.map((r) => (r.student_id === studentId ? { ...r, participation_level: level } : r))
    )
  }

  const currentSetCount = rows.filter((r) => r.participation_level !== null).length
  const currentNotSetCount = rows.filter((r) => r.participation_level === null).length

  const filtered = useMemo(() => {
    let result = rows

    if (filter === 'set') result = result.filter((r) => r.participation_level !== null)
    else if (filter === 'not_set') result = result.filter((r) => r.participation_level === null)

    const q = search.trim().toLowerCase()
    if (q) {
      result = result.filter(
        (r) =>
          r.student_name.toLowerCase().includes(q) ||
          (r.parent_name ?? '').toLowerCase().includes(q)
      )
    }

    return result
  }, [rows, filter, search])

  const FILTER_TABS: { key: FilterKey; label: string; count: number }[] = [
    { key: 'all',     label: 'All',     count: totalCount },
    { key: 'set',     label: 'Set',     count: currentSetCount },
    { key: 'not_set', label: 'Not set', count: currentNotSetCount },
  ]

  const CHIP_STYLES: Record<FilterKey, { color: string; bg: string }> = {
    all:     { color: colors.textSecondary,  bg: 'rgba(82,82,82,0.12)' },
    set:     { color: '#16A34A',              bg: 'rgba(34,197,94,0.15)' },
    not_set: { color: colors.textTertiary,   bg: 'rgba(82,82,82,0.12)' },
  }

  return (
    <div className="space-y-5">
      {/* Stats chips */}
      <div className="flex items-center gap-3 flex-wrap">
        <div
          className="rounded-xl px-4 py-3 flex items-center gap-2"
          style={{ backgroundColor: colors.elevated, border: `1px solid ${colors.border}` }}
        >
          <span className="text-lg font-bold" style={{ color: colors.textPrimary }}>
            {totalCount}
          </span>
          <span className="text-xs" style={{ color: colors.textTertiary }}>
            Enrolled
          </span>
        </div>
        <div
          className="rounded-xl px-4 py-3 flex items-center gap-2"
          style={{ backgroundColor: colors.elevated, border: `1px solid rgba(34,197,94,0.3)` }}
        >
          <span className="text-lg font-bold" style={{ color: '#16A34A' }}>
            {currentSetCount}
          </span>
          <span className="text-xs" style={{ color: '#16A34A' }}>
            Preference set
          </span>
        </div>
        <div
          className="rounded-xl px-4 py-3 flex items-center gap-2"
          style={{ backgroundColor: colors.elevated, border: `1px solid ${colors.border}` }}
        >
          <span className="text-lg font-bold" style={{ color: colors.textTertiary }}>
            {currentNotSetCount}
          </span>
          <span className="text-xs" style={{ color: colors.textTertiary }}>
            Not set
          </span>
        </div>
      </div>

      {/* Filters + search */}
      <div className="flex flex-wrap items-center gap-3">
        <div
          className="flex items-center gap-1 rounded-lg p-1"
          style={{ backgroundColor: colors.elevated, border: `1px solid ${colors.border}` }}
        >
          {FILTER_TABS.map((tab) => {
            const isActive = filter === tab.key
            const style = CHIP_STYLES[tab.key]
            return (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className="flex items-center gap-1.5 rounded-md text-xs font-medium transition-all duration-150"
                style={{
                  padding: '5px 10px',
                  backgroundColor: isActive ? colors.surface : 'transparent',
                  color: isActive ? style.color : colors.textTertiary,
                  border: isActive ? `1px solid ${colors.border}` : '1px solid transparent',
                  boxShadow: isActive ? shadows.soft : 'none',
                }}
              >
                {tab.label}
                <span
                  className="rounded-full font-semibold"
                  style={{
                    fontSize: '10px',
                    padding: '1px 5px',
                    backgroundColor: isActive ? style.bg : colors.elevated,
                    color: isActive ? style.color : colors.textQuaternary,
                  }}
                >
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>

        <input
          type="text"
          placeholder="Search student or parent..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 sm:flex-none sm:w-64 text-sm outline-none rounded-lg px-3 py-2"
          style={{
            backgroundColor: colors.elevated,
            border: `1px solid ${colors.border}`,
            color: colors.textPrimary,
          }}
        />
      </div>

      {/* Table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: `1px solid ${colors.border}`, boxShadow: shadows.soft }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: `1px solid ${colors.border}`, backgroundColor: colors.elevated }}>
              {['Student', 'Parent', 'Auto-fill status', 'Set preference'].map((h) => (
                <th
                  key={h}
                  className="text-left px-4 py-3 font-medium"
                  style={{ color: colors.textTertiary, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm" style={{ color: colors.textTertiary }}>
                  No results
                </td>
              </tr>
            )}
            {filtered.map((row, i) => (
              <tr
                key={row.student_id}
                style={{
                  borderBottom: i < filtered.length - 1 ? `1px solid ${colors.border}` : 'none',
                  backgroundColor: colors.surface,
                }}
              >
                {/* Student */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    {row.profile_image_url ? (
                      <Image
                        src={row.profile_image_url}
                        alt={row.student_name}
                        width={28}
                        height={28}
                        className="rounded-full object-cover flex-shrink-0"
                        style={{ width: 28, height: 28 }}
                      />
                    ) : (
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                        style={{ backgroundColor: colors.accentLight, color: colors.accent }}
                      >
                        {row.student_name.charAt(0)}
                      </div>
                    )}
                    <span className="font-medium" style={{ color: colors.textPrimary }}>
                      {row.student_name}
                    </span>
                  </div>
                </td>

                {/* Parent */}
                <td className="px-4 py-3" style={{ color: colors.textSecondary }}>
                  {row.parent_name ?? '—'}
                </td>

                {/* Current status badge */}
                <td className="px-4 py-3">
                  <PrefBadge level={row.participation_level} />
                </td>

                {/* Inline select */}
                <td className="px-4 py-3">
                  <PrefSelect
                    studentId={row.student_id}
                    parentId={row.parent_id}
                    current={row.participation_level}
                    onChange={handleLevelChange}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
