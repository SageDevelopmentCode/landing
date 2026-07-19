'use client'

import { useState, useMemo } from 'react'
import { ExternalLink, ChevronRight, ChevronDown } from 'lucide-react'
import { cssColors as colors, radius, cssShadows as shadows } from '../design-system'
import { DetailSidebar } from '../components/DetailSidebar'

type StripeTransaction = {
  id: string
  stripe_session_id: string | null
  stripe_payment_intent_id: string | null
  payment_type: string
  status: string
  amount_cents: number
  intended_amount_cents: number | null
  currency: string
  cover_fees: boolean | null
  payer_name: string | null
  payer_email: string | null
  description: string | null
  student_id: string | null
  application_id: string | null
  parent_id: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string | null
  is_deleted: boolean
  exclude_from_revenue: boolean
}

type TableRow =
  | { kind: 'parent'; tx: StripeTransaction; child: StripeTransaction }
  | { kind: 'child'; tx: StripeTransaction }
  | { kind: 'single'; tx: StripeTransaction }

interface Props {
  transactions: StripeTransaction[]
  studentMap: Record<string, string>
  parentNameMap: Record<string, string>
}

const MONTH_LABELS: Record<string, string> = {
  '1': 'Aug', '2': 'Sep', '3': 'Oct', '4': 'Nov', '5': 'Dec',
  '6': 'Jan', '7': 'Feb', '8': 'Mar', '9': 'Apr', '10': 'May',
}

const DAY_LABELS: Record<string, string> = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed',
  thursday: 'Thu', friday: 'Fri',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/Chicago',
  })
}

function formatCents(cents: number): string {
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

function stripeUrl(tx: { stripe_payment_intent_id: string | null; stripe_session_id: string | null }): string | null {
  const isTest = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.startsWith('pk_test_')
  const base = `https://dashboard.stripe.com${isTest ? '/test' : ''}`
  if (tx.stripe_payment_intent_id) return `${base}/payments/${tx.stripe_payment_intent_id}`
  if (tx.stripe_session_id) return `${base}/checkout/sessions/${tx.stripe_session_id}`
  return null
}

function isPaid(status: string): boolean {
  return status === 'completed' || status === 'succeeded' || status === 'paid'
}

function isSchoolYearHomeschool(tx: StripeTransaction): boolean {
  if (tx.payment_type !== 'homeschool_dropin') return false
  const meta = (tx.metadata ?? {}) as Record<string, string>
  return meta.program === 'school_year_26_27'
}

function getTypeLabel(tx: StripeTransaction): string {
  if (tx.payment_type === 'supply_fee') return 'Supply Fee'
  if (tx.payment_type === 'school_year_tuition') return 'SY Tuition'
  return 'HS Drop-In (SY)'
}

function getTypeBadge(tx: StripeTransaction): { bg: string; text: string; label: string } {
  if (tx.payment_type === 'supply_fee') return { bg: colors.infoBg, text: colors.info, label: 'Supply Fee' }
  if (tx.payment_type === 'school_year_tuition') return { bg: colors.purpleBg, text: colors.accent, label: 'SY Tuition' }
  if (tx.payment_type === 'homeschool') return { bg: colors.warningBg, text: colors.warning, label: 'HS Drop-In (SY)' }
  return { bg: colors.warningBg, text: colors.warning, label: 'HS Drop-In (SY)' }
}

function getDetails(tx: StripeTransaction): string {
  const meta = (tx.metadata ?? {}) as Record<string, string>

  if (tx.payment_type === 'supply_fee') {
    if (meta.bundle_type && meta.bundle_type !== 'none') {
      const bundleMonths = meta.bundle_month_index
        ? MONTH_LABELS[meta.bundle_month_index] ?? meta.bundle_month_index
        : ''
      return `Bundled with ${bundleMonths}`
    }
    return 'Base fee'
  }

  if (tx.payment_type === 'school_year_tuition') {
    const months = meta.selected_months
      ?.split(',')
      .map(m => MONTH_LABELS[m.trim()] ?? m.trim())
      .filter(Boolean)
    return months?.length ? `Months: ${months.join(', ')}` : '—'
  }

  if (tx.payment_type === 'homeschool') {
    const months = (meta.selected_months ?? '')
      .split(',').map(m => MONTH_LABELS[m.trim()] ?? m.trim()).filter(Boolean)
    return months.length ? `Months: ${months.join(', ')} · bundled` : 'Bundled plan'
  }

  // homeschool_dropin (school year)
  const tier = meta.tier ? `Tier: ${meta.tier}` : ''
  const days = meta.selected_days
    ?.split(',')
    .map(d => DAY_LABELS[d.trim().toLowerCase()] ?? d.trim())
    .filter(Boolean)
    .join(', ')
  const weeks = meta.selected_weeks
    ?.split(',')
    .filter(Boolean)
    .length
  const parts = [tier, days, weeks ? `${weeks} week${weeks !== 1 ? 's' : ''}` : ''].filter(Boolean)
  return parts.join(' · ') || '—'
}

function getParentBundleDetails(tx: StripeTransaction): string {
  const meta = (tx.metadata ?? {}) as Record<string, string>
  const monthIdx = meta.bundle_month_index
  const monthLabel = monthIdx ? MONTH_LABELS[monthIdx] ?? monthIdx : ''
  return monthLabel ? `Supply Fee + ${monthLabel} tuition` : 'Supply Fee (bundled)'
}

const sectionLabelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
  color: colors.textTertiary,
  marginBottom: 6,
}

function MetadataAccordion({ metadata }: { metadata: Record<string, unknown> | null }) {
  const [open, setOpen] = useState(false)
  const entries = metadata ? Object.entries(metadata) : []

  return (
    <div style={{ border: `1px solid ${colors.border}`, borderRadius: radius.lg, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          background: colors.elevated,
          border: 'none',
          cursor: 'pointer',
          fontSize: 10,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
          color: colors.textTertiary,
        }}
      >
        <span>Metadata</span>
        {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
      </button>
      {open && (
        <div style={{ padding: '12px 14px', background: colors.surface, borderTop: `1px solid ${colors.border}` }}>
          {entries.length === 0 ? (
            <span style={{ fontSize: 12, color: colors.textTertiary }}>No metadata</span>
          ) : (
            <div style={{ fontFamily: 'monospace', fontSize: 11, display: 'flex', flexDirection: 'column', gap: 5 }}>
              {entries.map(([k, v]) => (
                <div key={k} style={{ display: 'flex', gap: 8 }}>
                  <span style={{ color: colors.textTertiary, flexShrink: 0, minWidth: 140 }}>{k}</span>
                  <span style={{ color: colors.textPrimary, wordBreak: 'break-all' }}>
                    {typeof v === 'object' ? JSON.stringify(v) : String(v ?? '—')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function SchoolYearPaymentsClient({ transactions, studentMap, parentNameMap }: Props) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'supply_fee' | 'school_year_tuition' | 'homeschool_dropin' | 'homeschool'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending'>('all')
  const [dateRange, setDateRange] = useState<7 | 30 | 90 | 0>(0)
  const [selectedTx, setSelectedTx] = useState<StripeTransaction | null>(null)
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [excludeTest, setExcludeTest] = useState(true)

  // Filter to only SY-relevant transactions (exclude summer homeschool)
  const syTransactions = useMemo(() => {
    return transactions.filter(tx => {
      if (tx.payment_type === 'homeschool_dropin') return isSchoolYearHomeschool(tx)
      return true
    })
  }, [transactions])

  const baseTxs = useMemo(() => {
    if (!excludeTest) return syTransactions
    return syTransactions.filter(tx => !tx.exclude_from_revenue)
  }, [syTransactions, excludeTest])

  const filtered = useMemo(() => {
    const now = Date.now()
    const cutoff = dateRange > 0 ? now - dateRange * 24 * 60 * 60 * 1000 : 0

    return baseTxs.filter(tx => {
      if (cutoff && new Date(tx.created_at).getTime() < cutoff) return false

      if (typeFilter !== 'all' && tx.payment_type !== typeFilter) return false

      if (statusFilter === 'paid' && !isPaid(tx.status)) return false
      if (statusFilter === 'pending' && isPaid(tx.status)) return false

      if (search.trim()) {
        const q = search.toLowerCase()
        const studentName = tx.student_id ? studentMap[tx.student_id]?.toLowerCase() ?? '' : ''
        const payerName = (
          tx.payer_name ??
          (tx.parent_id ? parentNameMap[tx.parent_id] : null) ??
          ''
        ).toLowerCase()
        const payerEmail = (tx.payer_email ?? '').toLowerCase()
        if (!studentName.includes(q) && !payerName.includes(q) && !payerEmail.includes(q)) return false
      }

      return true
    })
  }, [baseTxs, typeFilter, statusFilter, dateRange, search, studentMap, parentNameMap])

  // Stat cards - from all SY transactions (not filtered)
  const stats = useMemo(() => {
    const paidTxs = baseTxs.filter(tx => isPaid(tx.status))
    const supplyTotal = paidTxs.filter(t => t.payment_type === 'supply_fee').reduce((s, t) => s + t.amount_cents, 0)
    const tuitionTotal = paidTxs.filter(t => t.payment_type === 'school_year_tuition').reduce((s, t) => s + t.amount_cents, 0)
    const hsTotal = paidTxs
      .filter(t => t.payment_type === 'homeschool_dropin' || t.payment_type === 'homeschool')
      .reduce((s, t) => s + t.amount_cents, 0)
    return { supplyTotal, tuitionTotal, hsTotal, combined: supplyTotal + tuitionTotal + hsTotal }
  }, [baseTxs])

  // Build child map: primary_session_id → child transaction
  const { childMap, childIdSet } = useMemo(() => {
    const childMap = new Map<string, StripeTransaction>()
    const childIdSet = new Set<string>()
    for (const tx of baseTxs) {
      const meta = (tx.metadata ?? {}) as Record<string, string>
      if (meta.bundled_with_supply_fee === 'true' && meta.primary_session_id) {
        childMap.set(meta.primary_session_id, tx)
        childIdSet.add(tx.id)
      }
    }
    return { childMap, childIdSet }
  }, [baseTxs])

  // Build flat array of table rows, injecting expanded children after their parents
  const tableRows = useMemo((): TableRow[] => {
    const rows: TableRow[] = []
    for (const tx of filtered) {
      if (childIdSet.has(tx.id)) continue
      if (
        tx.payment_type === 'supply_fee' &&
        tx.stripe_session_id &&
        childMap.has(tx.stripe_session_id)
      ) {
        const child = childMap.get(tx.stripe_session_id)!
        rows.push({ kind: 'parent', tx, child })
        if (expandedGroups.has(tx.id)) {
          rows.push({ kind: 'child', tx: child })
        }
      } else {
        rows.push({ kind: 'single', tx })
      }
    }
    return rows
  }, [filtered, childMap, childIdSet, expandedGroups])

  // For sidebar: look up bundled child of selected supply fee
  const selectedChild = useMemo(() => {
    if (!selectedTx || selectedTx.payment_type !== 'supply_fee' || !selectedTx.stripe_session_id) return null
    return childMap.get(selectedTx.stripe_session_id) ?? null
  }, [selectedTx, childMap])

  function toggleGroup(id: string) {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const TABLE_HEADERS = ['Date', 'Student', 'Payer', 'Type', 'Details', 'Amount', 'Status', 'Stripe']

  return (
    <div style={{ padding: 32, color: colors.textPrimary, maxWidth: 1300 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
          School Year Payments
        </h1>
        <p style={{ fontSize: 13, color: colors.textSecondary }}>
          Supply fees, SY tuition, and SY homeschool drop-in transactions
        </p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
        {[
          { label: 'Supply Fees', value: stats.supplyTotal, bg: colors.infoBg, text: colors.info, border: colors.infoBorder },
          { label: 'SY Tuition', value: stats.tuitionTotal, bg: colors.purpleBg, text: colors.accent, border: colors.purpleBorder },
          { label: 'SY Homeschool', value: stats.hsTotal, bg: colors.warningBg, text: colors.warning, border: colors.warningBorder },
          { label: 'Combined Total', value: stats.combined, bg: colors.successBg, text: colors.success, border: colors.successBorder },
        ].map(card => (
          <div
            key={card.label}
            style={{
              padding: '14px 20px',
              borderRadius: radius.lg,
              backgroundColor: card.bg,
              border: `1px solid ${card.border}`,
              minWidth: 160,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: card.text, marginBottom: 6 }}>
              {card.label}
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: card.text }}>
              {formatCents(card.value)}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search payer, email, student…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            padding: '7px 12px',
            fontSize: 13,
            borderRadius: radius.md,
            border: `1px solid ${colors.border}`,
            backgroundColor: colors.surface,
            color: colors.textPrimary,
            outline: 'none',
            minWidth: 220,
          }}
        />

        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value as typeof typeFilter)}
          style={{
            padding: '7px 10px',
            fontSize: 13,
            borderRadius: radius.md,
            border: `1px solid ${colors.border}`,
            backgroundColor: colors.surface,
            color: colors.textPrimary,
            cursor: 'pointer',
          }}
        >
          <option value="all">All Types</option>
          <option value="supply_fee">Supply Fee</option>
          <option value="school_year_tuition">SY Tuition</option>
          <option value="homeschool_dropin">HS Drop-In (SY)</option>
          <option value="homeschool">HS Drop-In (SY Bundle)</option>
        </select>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
          style={{
            padding: '7px 10px',
            fontSize: 13,
            borderRadius: radius.md,
            border: `1px solid ${colors.border}`,
            backgroundColor: colors.surface,
            color: colors.textPrimary,
            cursor: 'pointer',
          }}
        >
          <option value="all">All Statuses</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
        </select>

        <div style={{ display: 'flex', gap: 6 }}>
          {([7, 30, 90, 0] as const).map(d => (
            <button
              key={d}
              onClick={() => setDateRange(d)}
              style={{
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 600,
                borderRadius: radius.md,
                border: `1px solid ${dateRange === d ? colors.accent : colors.border}`,
                backgroundColor: dateRange === d ? colors.accentLight : 'transparent',
                color: dateRange === d ? colors.accent : colors.textSecondary,
                cursor: 'pointer',
              }}
            >
              {d === 0 ? 'All' : `${d}d`}
            </button>
          ))}
        </div>

        <button
          onClick={() => setExcludeTest(v => !v)}
          style={{
            padding: '6px 12px',
            fontSize: 12,
            fontWeight: 600,
            borderRadius: radius.md,
            border: `1px solid ${excludeTest ? colors.accent : colors.border}`,
            backgroundColor: excludeTest ? colors.accentLight : 'transparent',
            color: excludeTest ? colors.accent : colors.textSecondary,
            cursor: 'pointer',
          }}
        >
          Exclude test
        </button>

        <span style={{ fontSize: 12, color: colors.textTertiary, marginLeft: 4 }}>
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div
        style={{
          backgroundColor: colors.surface,
          borderRadius: radius.xl,
          border: `1px solid ${colors.border}`,
          boxShadow: shadows.soft,
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                {TABLE_HEADERS.map(h => (
                  <th
                    key={h}
                    style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: colors.textTertiary,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={TABLE_HEADERS.length}
                    style={{ padding: '48px 16px', textAlign: 'center', color: colors.textTertiary, fontSize: 13 }}
                  >
                    No transactions found.
                  </td>
                </tr>
              ) : (
                tableRows.map((row, i) => {
                  const { tx } = row
                  const isChild = row.kind === 'child'
                  const isParent = row.kind === 'parent'
                  const isExpanded = isParent && expandedGroups.has(tx.id)
                  const badge = getTypeBadge(tx)
                  const paid = isPaid(tx.status)
                  const studentName = tx.student_id ? (studentMap[tx.student_id] ?? tx.student_id.slice(0, 8)) : '—'
                  const payerName = tx.payer_name ?? (tx.parent_id ? parentNameMap[tx.parent_id] : null) ?? '—'
                  const stripeLink = stripeUrl(tx)
                  const isHovered = hoveredRow === tx.id

                  let displayAmount = tx.amount_cents
                  if (row.kind === 'parent') {
                    displayAmount = tx.amount_cents + row.child.amount_cents
                  }

                  const details = isParent ? getParentBundleDetails(tx) : getDetails(tx)

                  return (
                    <tr
                      key={`${row.kind}-${tx.id}`}
                      onClick={() => setSelectedTx(tx)}
                      onMouseEnter={() => setHoveredRow(tx.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      style={{
                        borderBottom: i < tableRows.length - 1 ? `1px solid ${colors.border}` : 'none',
                        backgroundColor: isChild
                          ? colors.elevated
                          : isHovered
                          ? colors.elevated
                          : 'transparent',
                        cursor: 'pointer',
                        transition: 'background-color 0.1s',
                      }}
                    >
                      {/* Date */}
                      <td style={{ padding: '12px 16px', color: colors.textSecondary, whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, paddingLeft: isChild ? 32 : 0 }}>
                          {isParent && (
                            <button
                              onClick={e => { e.stopPropagation(); toggleGroup(tx.id) }}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '2px',
                                color: colors.textTertiary,
                                display: 'inline-flex',
                                alignItems: 'center',
                                flexShrink: 0,
                              }}
                            >
                              {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                            </button>
                          )}
                          {formatDate(tx.created_at)}
                        </div>
                      </td>

                      {/* Student */}
                      <td style={{ padding: '12px 16px', fontWeight: 500, whiteSpace: 'nowrap' }}>
                        {studentName === '—'
                          ? <span style={{ color: colors.textTertiary }}>—</span>
                          : studentName}
                      </td>

                      {/* Payer */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 500 }}>{payerName}</div>
                        {tx.payer_email && (
                          <div style={{ fontSize: 11, color: colors.textTertiary }}>{tx.payer_email}</div>
                        )}
                      </td>

                      {/* Type badge */}
                      <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 10px',
                            borderRadius: 999,
                            fontSize: 12,
                            fontWeight: 600,
                            backgroundColor: badge.bg,
                            color: badge.text,
                          }}
                        >
                          {badge.label}
                        </span>
                      </td>

                      {/* Details */}
                      <td style={{ padding: '12px 16px', color: colors.textSecondary, maxWidth: 220 }}>
                        <span
                          title={details}
                          style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        >
                          {details}
                        </span>
                      </td>

                      {/* Amount */}
                      <td style={{ padding: '12px 16px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {formatCents(displayAmount)}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 10px',
                            borderRadius: 999,
                            fontSize: 12,
                            fontWeight: 600,
                            backgroundColor: paid ? colors.successBg : colors.warningBg,
                            color: paid ? colors.success : colors.warning,
                          }}
                        >
                          {paid ? 'Paid' : 'Pending'}
                        </span>
                      </td>

                      {/* Stripe link */}
                      <td style={{ padding: '12px 16px' }} onClick={e => e.stopPropagation()}>
                        {stripeLink ? (
                          <a
                            href={stripeLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: colors.accent, display: 'inline-flex', alignItems: 'center' }}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        ) : (
                          <span style={{ color: colors.textTertiary }}>—</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Sidebar */}
      <DetailSidebar
        isOpen={!!selectedTx}
        onClose={() => setSelectedTx(null)}
        title={selectedTx ? (selectedTx.payer_name ?? selectedTx.payer_email ?? getTypeLabel(selectedTx)) : ''}
      >
        {selectedTx && (
          <SidebarReceipt
            tx={selectedTx}
            child={selectedChild}
            studentMap={studentMap}
            parentNameMap={parentNameMap}
          />
        )}
      </DetailSidebar>
    </div>
  )
}

function SidebarReceipt({
  tx,
  child,
  studentMap,
  parentNameMap,
}: {
  tx: StripeTransaction
  child: StripeTransaction | null
  studentMap: Record<string, string>
  parentNameMap: Record<string, string>
}) {
  const badge = getTypeBadge(tx)
  const paid = isPaid(tx.status)
  const payerName = tx.payer_name ?? (tx.parent_id ? parentNameMap[tx.parent_id] : null) ?? '—'
  const meta = (tx.metadata ?? {}) as Record<string, string>
  const stripeLink = stripeUrl(tx)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* ① Receipt Header */}
      <div
        style={{
          background: colors.elevated,
          border: `1px solid ${colors.border}`,
          borderRadius: radius.lg,
          padding: '20px 20px 16px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 32, fontWeight: 700, color: colors.textPrimary, marginBottom: 10 }}>
          {formatCents(tx.amount_cents)}
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
          <span
            style={{
              padding: '4px 12px',
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 600,
              backgroundColor: badge.bg,
              color: badge.text,
            }}
          >
            {badge.label}
          </span>
          <span
            style={{
              padding: '4px 12px',
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 600,
              backgroundColor: paid ? colors.successBg : colors.warningBg,
              color: paid ? colors.success : colors.warning,
            }}
          >
            {paid ? 'Paid' : 'Pending'}
          </span>
        </div>
        <div style={{ fontSize: 12, color: colors.textTertiary }}>
          {formatDate(tx.created_at)}
        </div>
      </div>

      {/* ② Two-column payer + student grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div
          style={{
            background: colors.elevated,
            border: `1px solid ${colors.border}`,
            borderRadius: radius.lg,
            padding: '12px 14px',
          }}
        >
          <div style={sectionLabelStyle}>Payer</div>
          <div style={{ fontWeight: 500, fontSize: 13 }}>{payerName}</div>
          {tx.payer_email && (
            <div style={{ fontSize: 11, color: colors.textTertiary, marginTop: 3, wordBreak: 'break-all' }}>
              {tx.payer_email}
            </div>
          )}
        </div>
        <div
          style={{
            background: colors.elevated,
            border: `1px solid ${colors.border}`,
            borderRadius: radius.lg,
            padding: '12px 14px',
          }}
        >
          <div style={sectionLabelStyle}>Student</div>
          <div style={{ fontWeight: 500, fontSize: 13 }}>
            {tx.student_id
              ? (studentMap[tx.student_id] ?? tx.student_id.slice(0, 8))
              : <span style={{ color: colors.textTertiary }}>—</span>}
          </div>
        </div>
      </div>

      {/* ③ Payment Details card */}
      <div
        style={{
          background: colors.elevated,
          border: `1px solid ${colors.border}`,
          borderRadius: radius.lg,
          padding: '14px 16px',
        }}
      >
        <div style={sectionLabelStyle}>Payment Details</div>

        {/* Supply fee */}
        {tx.payment_type === 'supply_fee' && (
          child ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: colors.textSecondary }}>Supply fee</span>
                <span style={{ fontWeight: 500 }}>{formatCents(tx.amount_cents)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: colors.textSecondary }}>
                  {(() => {
                    if (meta.bundle_type === 'homeschool') {
                      const tier = meta.bundle_homeschool_tier === 'dropin' ? '1 Day/Wk'
                        : meta.bundle_homeschool_tier === '2day' ? '2 Days/Wk'
                        : meta.bundle_homeschool_tier === '3day' ? '3 Days/Wk'
                        : meta.bundle_homeschool_tier ?? 'Drop-In'
                      const monthLabel = MONTH_LABELS[meta.bundle_month_index ?? ''] ?? ''
                      let dayStr = ''
                      try {
                        const ws: { week: number; days: string[] }[] =
                          JSON.parse(meta.bundle_homeschool_week_selections_json ?? '[]')
                        const day = ws[0]?.days?.[0]
                        if (day) dayStr = ` · ${DAY_LABELS[day] ?? day}`
                      } catch { /* ignore */ }
                      return `HS Drop-In (${tier}${dayStr}) · ${monthLabel}`
                    }
                    return meta.bundle_month_index
                      ? `${MONTH_LABELS[meta.bundle_month_index] ?? meta.bundle_month_index} tuition`
                      : 'Bundled tuition'
                  })()}
                </span>
                <span style={{ fontWeight: 500 }}>{formatCents(child.amount_cents)}</span>
              </div>
              <div
                style={{
                  borderTop: `1px solid ${colors.border}`,
                  paddingTop: 7,
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontWeight: 600,
                }}
              >
                <span>Total</span>
                <span>{formatCents(tx.amount_cents + child.amount_cents)}</span>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 13, color: colors.textSecondary }}>Base fee</div>
          )
        )}

        {/* SY Tuition — month pills */}
        {tx.payment_type === 'school_year_tuition' && (() => {
          const months = meta.selected_months
            ?.split(',')
            .map(m => m.trim())
            .filter(Boolean) ?? []
          return months.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {months.map(m => (
                <span
                  key={m}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 600,
                    backgroundColor: colors.purpleBg,
                    color: colors.accent,
                  }}
                >
                  {MONTH_LABELS[m] ?? m}
                </span>
              ))}
            </div>
          ) : (
            <span style={{ fontSize: 13, color: colors.textTertiary }}>No months selected</span>
          )
        })()}

        {/* Homeschool school year bundle row */}
        {tx.payment_type === 'homeschool' && (() => {
          const months = (meta.selected_months ?? '')
            .split(',').map(m => MONTH_LABELS[m.trim()] ?? m.trim()).filter(Boolean)
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>Homeschool Drop-In Plan</div>
              {months.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {months.map(m => (
                    <span
                      key={m}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 600,
                        backgroundColor: colors.warningBg,
                        color: colors.warning,
                      }}
                    >
                      {m}
                    </span>
                  ))}
                </div>
              )}
              <div style={{ fontSize: 12, color: colors.textTertiary }}>Bundled with supply fee</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{formatCents(tx.amount_cents)}</div>
            </div>
          )
        })()}

        {/* Homeschool drop-in — tier + day chips */}
        {tx.payment_type === 'homeschool_dropin' && (() => {
          const tier = meta.tier
          const days = meta.selected_days?.split(',').map(d => d.trim().toLowerCase()).filter(Boolean) ?? []
          const weekCount = meta.selected_weeks?.split(',').filter(Boolean).length ?? 0
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {tier && (
                <div style={{ fontSize: 13 }}>
                  <span style={{ color: colors.textTertiary }}>Tier </span>
                  <span style={{ fontWeight: 500 }}>{tier}</span>
                </div>
              )}
              {days.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {days.map(d => (
                    <span
                      key={d}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 600,
                        backgroundColor: colors.warningBg,
                        color: colors.warning,
                      }}
                    >
                      {DAY_LABELS[d] ?? d}
                    </span>
                  ))}
                </div>
              )}
              {weekCount > 0 && (
                <div style={{ fontSize: 13, color: colors.textSecondary }}>
                  {weekCount} week{weekCount !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          )
        })()}
      </div>

      {/* ④ Stripe section */}
      {stripeLink && (
        <div
          style={{
            background: colors.elevated,
            border: `1px solid ${colors.border}`,
            borderRadius: radius.lg,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ fontSize: 11, color: colors.textTertiary, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {tx.stripe_payment_intent_id ?? tx.stripe_session_id ?? ''}
          </div>
          <a
            href={stripeLink}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 13,
              fontWeight: 500,
              color: colors.accent,
              textDecoration: 'none',
              flexShrink: 0,
            }}
          >
            View in Stripe <ExternalLink size={13} />
          </a>
        </div>
      )}

      {/* ⑤ Metadata accordion */}
      <MetadataAccordion metadata={tx.metadata} />
    </div>
  )
}
