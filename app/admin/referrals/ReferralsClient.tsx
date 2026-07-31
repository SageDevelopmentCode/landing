'use client'

import { useState, useTransition } from 'react'
import { Table, TableRow, TableCell } from '../components/Table'
import { cssColors as colors, radius } from '../design-system'
import type { AdminReferral } from '../marketing/page'

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  pending:  { label: 'Pending',  color: '#A3A3A3', bg: 'rgba(163,163,163,0.1)',  border: 'rgba(163,163,163,0.25)' },
  applied:  { label: 'Applied',  color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',   border: 'rgba(245,158,11,0.25)' },
  enrolled: { label: 'Enrolled', color: '#38BDF8', bg: 'rgba(56,189,248,0.1)',   border: 'rgba(56,189,248,0.25)' },
  rewarded: { label: 'Rewarded', color: '#22C55E', bg: 'rgba(34,197,94,0.1)',    border: 'rgba(34,197,94,0.25)' },
}

const STATUS_ORDER = ['pending', 'applied', 'enrolled', 'rewarded']

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full"
      style={{ color: cfg.color, backgroundColor: cfg.bg, border: `1px solid ${cfg.border}` }}
    >
      {cfg.label}
    </span>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

interface Props {
  referrals: AdminReferral[]
  updateReferralStatus: (id: string, status: string) => Promise<void>
}

export function ReferralsClient({ referrals: initial, updateReferralStatus }: Props) {
  const [referrals, setReferrals] = useState<AdminReferral[]>(initial)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [isPending, startTransition] = useTransition()
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const filtered = referrals.filter((r) => {
    const q = search.toLowerCase()
    const matchesSearch =
      !q ||
      r.referrer_name?.toLowerCase().includes(q) ||
      r.referrer_email?.toLowerCase().includes(q) ||
      r.referred_email?.toLowerCase().includes(q) ||
      r.referred_name?.toLowerCase().includes(q)
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus
    return matchesSearch && matchesStatus
  })

  function handleAdvanceStatus(referral: AdminReferral) {
    const currentIdx = STATUS_ORDER.indexOf(referral.status)
    if (currentIdx === STATUS_ORDER.length - 1) return
    const nextStatus = STATUS_ORDER[currentIdx + 1]
    setUpdatingId(referral.id)
    startTransition(async () => {
      await updateReferralStatus(referral.id, nextStatus)
      setReferrals((prev) =>
        prev.map((r) => r.id === referral.id ? { ...r, status: nextStatus } : r)
      )
      setUpdatingId(null)
    })
  }

  const stats = {
    total: referrals.length,
    applied: referrals.filter((r) => r.status === 'applied').length,
    enrolled: referrals.filter((r) => r.status === 'enrolled').length,
    rewarded: referrals.filter((r) => r.status === 'rewarded').length,
  }

  return (
    <>
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Referrals', value: stats.total, color: colors.textPrimary },
          { label: 'Awaiting Review', value: stats.applied, color: '#F59E0B' },
          { label: 'Enrolled',        value: stats.enrolled, color: '#38BDF8' },
          { label: 'Gift Cards Sent', value: stats.rewarded, color: '#22C55E' },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="px-4 py-3 rounded-xl"
            style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}
          >
            <p className="text-xs mb-1" style={{ color: colors.textTertiary }}>{label}</p>
            <p className="text-2xl font-semibold" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div
          className="flex items-center gap-1.5 p-1 rounded-xl"
          style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}
        >
          <svg className="ml-1.5 w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: colors.textTertiary }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-2 py-0.5 text-xs font-semibold bg-transparent border-none outline-none w-40 placeholder:font-normal"
            style={{ color: colors.textSecondary }}
          />
        </div>

        <div className="flex items-center gap-1">
          {(['all', ...STATUS_ORDER] as string[]).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className="px-2.5 py-1 text-xs font-medium rounded-lg transition-colors"
              style={{
                backgroundColor: filterStatus === s ? colors.accentLight : 'transparent',
                color: filterStatus === s ? colors.accent : colors.textTertiary,
                border: `1px solid ${filterStatus === s ? colors.accent : 'transparent'}`,
                borderRadius: radius.md,
              }}
            >
              {s === 'all' ? 'All' : STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div
          className="py-16 text-center rounded-xl"
          style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}
        >
          <p className="text-sm" style={{ color: colors.textTertiary }}>No referrals found.</p>
        </div>
      ) : (
        <Table headers={['Referring Parent', 'Referred Family', 'Status', 'Referred On', 'Action']}>
          {filtered.map((r, index) => {
            const isLast = STATUS_ORDER.indexOf(r.status) === STATUS_ORDER.length - 1
            const nextLabel = !isLast ? STATUS_CONFIG[STATUS_ORDER[STATUS_ORDER.indexOf(r.status) + 1]].label : null
            const isUpdating = updatingId === r.id

            return (
              <TableRow key={r.id} index={index}>
                {/* Referring parent */}
                <TableCell>
                  <div className="font-medium" style={{ color: colors.textPrimary }}>
                    {r.referrer_name ?? '—'}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: colors.textTertiary }}>
                    {r.referrer_email ?? '—'}
                  </div>
                </TableCell>

                {/* Referred family */}
                <TableCell>
                  <div className="font-medium" style={{ color: colors.textPrimary }}>
                    {r.referred_name ?? '—'}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: colors.textTertiary }}>
                    {r.referred_email ?? '—'}
                  </div>
                </TableCell>

                {/* Status */}
                <TableCell>
                  <StatusBadge status={r.status} />
                </TableCell>

                {/* Date */}
                <TableCell>{formatDate(r.created_at)}</TableCell>

                {/* Action */}
                <TableCell>
                  {!isLast ? (
                    <button
                      onClick={() => handleAdvanceStatus(r)}
                      disabled={isUpdating || isPending}
                      className="px-2.5 py-1 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                      style={{
                        backgroundColor: colors.accentLight,
                        color: colors.accent,
                        border: `1px solid ${colors.accent}`,
                        borderRadius: radius.md,
                        cursor: isUpdating ? 'wait' : 'pointer',
                      }}
                    >
                      {isUpdating ? 'Saving…' : `Mark ${nextLabel}`}
                    </button>
                  ) : (
                    <span className="text-xs" style={{ color: colors.textTertiary }}>
                      Gift card sent ✓
                    </span>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </Table>
      )}
    </>
  )
}
