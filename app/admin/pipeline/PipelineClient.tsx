'use client'

import { useState, useMemo } from 'react'
import { cssColors as colors, radius, shadows } from '../design-system'

type Transaction = {
  id: string
  stripe_session_id: string
  payment_type: string
  status: string
  amount_cents: number
  payer_email: string | null
  payer_name: string | null
  application_id: string | null
  parent_id: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

type EmailLog = {
  id: string
  application_id: string | null
  to_address: string
  subject: string
  status: 'success' | 'error'
  error_message: string | null
  sent_at: string
}

type PipelineRow = {
  tx: Transaction
  email: EmailLog | null
  emailStatus: 'sent' | 'error' | 'missing'
}

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  registration_fee: 'Registration Fee',
  summer_tuition: 'Summer Tuition',
  aftercare_tuition: 'Aftercare',
  fun_friday_tuition: 'Fun Friday',
  homeschool_dropin: 'Homeschool Drop-In',
  shadow_day_fee: 'Shadow Day',
  beach_bash_fee: 'Beach Bash',
  custom_tuition: 'Custom Tuition',
  one_time_payment: 'One-Time Payment',
  donation: 'Donation',
}

const DATE_RANGES = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
  { label: 'All', days: Infinity },
]

function formatUSD(cents: number) {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

function StatusBadge({ status }: { status: 'sent' | 'error' | 'missing' }) {
  if (status === 'sent') {
    return (
      <span style={{
        backgroundColor: colors.successBg,
        color: colors.success,
        border: `1px solid ${colors.successBorder}`,
        borderRadius: radius.full,
        padding: '2px 10px',
        fontSize: '11px',
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}>✓ Sent</span>
    )
  }
  if (status === 'error') {
    return (
      <span style={{
        backgroundColor: colors.errorBg,
        color: colors.error,
        border: `1px solid ${colors.errorBorder}`,
        borderRadius: radius.full,
        padding: '2px 10px',
        fontSize: '11px',
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}>✕ Error</span>
    )
  }
  return (
    <span style={{
      backgroundColor: colors.warningBg,
      color: colors.warning,
      border: `1px solid ${colors.warningBorder}`,
      borderRadius: radius.full,
      padding: '2px 10px',
      fontSize: '11px',
      fontWeight: 600,
      whiteSpace: 'nowrap',
    }}>⚠ Missing</span>
  )
}

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{
      backgroundColor: colors.surface,
      border: `1px solid ${colors.border}`,
      borderRadius: radius.lg,
      padding: '16px 20px',
      minWidth: 120,
    }}>
      <div style={{ fontSize: '22px', fontWeight: 700, color: color ?? colors.textPrimary }}>{value}</div>
      <div style={{ fontSize: '12px', color: colors.textSecondary, marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: '11px', color: colors.textTertiary, marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

export function PipelineClient({ transactions, emailLogs }: { transactions: Transaction[]; emailLogs: EmailLog[] }) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateRange, setDateRange] = useState(30)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const rows = useMemo<PipelineRow[]>(() => {
    // Index email logs by application_id
    const byAppId: Record<string, EmailLog[]> = {}
    for (const log of emailLogs) {
      if (log.application_id) {
        byAppId[log.application_id] ??= []
        byAppId[log.application_id].push(log)
      }
    }

    // Index email logs without application_id by to_address
    const noAppLogs = emailLogs.filter(l => !l.application_id)

    return transactions.map(tx => {
      let email: EmailLog | null = null
      const txTime = new Date(tx.created_at).getTime()
      const WINDOW_MS = 30 * 60 * 1000

      if (tx.application_id && byAppId[tx.application_id]) {
        email = byAppId[tx.application_id]
          .filter(l => Math.abs(new Date(l.sent_at).getTime() - txTime) < WINDOW_MS)
          .sort((a, b) => Math.abs(new Date(a.sent_at).getTime() - txTime) - Math.abs(new Date(b.sent_at).getTime() - txTime))[0] ?? null
      } else if (tx.payer_email) {
        email = noAppLogs
          .filter(l => l.to_address === tx.payer_email && Math.abs(new Date(l.sent_at).getTime() - txTime) < WINDOW_MS)
          .sort((a, b) => Math.abs(new Date(a.sent_at).getTime() - txTime) - Math.abs(new Date(b.sent_at).getTime() - txTime))[0] ?? null
      }

      const emailStatus: PipelineRow['emailStatus'] =
        email === null ? 'missing' :
        email.status === 'error' ? 'error' : 'sent'

      return { tx, email, emailStatus }
    })
  }, [transactions, emailLogs])

  const filtered = useMemo(() => {
    const cutoff = dateRange === Infinity ? 0 : Date.now() - dateRange * 24 * 60 * 60 * 1000
    const q = search.toLowerCase().trim()
    return rows.filter(row => {
      if (dateRange !== Infinity && new Date(row.tx.created_at).getTime() < cutoff) return false
      if (typeFilter !== 'all' && row.tx.payment_type !== typeFilter) return false
      if (statusFilter !== 'all' && row.emailStatus !== statusFilter) return false
      if (q) {
        const haystack = [row.tx.payer_email, row.tx.payer_name, row.tx.payment_type].join(' ').toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [rows, search, typeFilter, statusFilter, dateRange])

  const stats = useMemo(() => {
    const total = filtered.length
    const sent = filtered.filter(r => r.emailStatus === 'sent').length
    const missing = filtered.filter(r => r.emailStatus === 'missing').length
    const errors = filtered.filter(r => r.emailStatus === 'error').length
    const errorRate = total > 0 ? Math.round(((missing + errors) / total) * 100) : 0
    return { total, sent, missing, errors, errorRate }
  }, [filtered])

  const paymentTypes = useMemo(() => {
    const types = [...new Set(transactions.map(t => t.payment_type))]
    return types.sort()
  }, [transactions])

  return (
    <div style={{ padding: '24px 0', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: colors.textPrimary, margin: 0 }}>Pipeline</h1>
        <p style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4, marginBottom: 0 }}>
          Payment → email flow for every transaction
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        <StatCard label="Payments" value={stats.total} />
        <StatCard label="Emails Sent" value={stats.sent} color={colors.success} />
        <StatCard label="Emails Missing" value={stats.missing} color={colors.warning} />
        <StatCard label="Errors" value={stats.errors} color={colors.error} />
        <StatCard label="Missing Rate" value={`${stats.errorRate}%`} color={stats.errorRate > 20 ? colors.error : colors.textSecondary} sub="missing + errors" />
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20,
        backgroundColor: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: radius.lg,
        padding: '12px 16px',
      }}>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search email or name…"
          style={{
            backgroundColor: colors.elevated,
            border: `1px solid ${colors.border}`,
            borderRadius: radius.md,
            color: colors.textPrimary,
            fontSize: 13,
            padding: '6px 12px',
            outline: 'none',
            width: 200,
          }}
        />
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          style={{
            backgroundColor: colors.elevated,
            border: `1px solid ${colors.border}`,
            borderRadius: radius.md,
            color: colors.textPrimary,
            fontSize: 13,
            padding: '6px 10px',
            outline: 'none',
          }}
        >
          <option value="all">All types</option>
          {paymentTypes.map(t => (
            <option key={t} value={t}>{PAYMENT_TYPE_LABELS[t] ?? t}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{
            backgroundColor: colors.elevated,
            border: `1px solid ${colors.border}`,
            borderRadius: radius.md,
            color: colors.textPrimary,
            fontSize: 13,
            padding: '6px 10px',
            outline: 'none',
          }}
        >
          <option value="all">All statuses</option>
          <option value="sent">Sent</option>
          <option value="missing">Missing</option>
          <option value="error">Error</option>
        </select>
        <div style={{ display: 'flex', gap: 4 }}>
          {DATE_RANGES.map(dr => (
            <button
              key={dr.label}
              onClick={() => setDateRange(dr.days)}
              style={{
                backgroundColor: dateRange === dr.days ? colors.accent : colors.elevated,
                color: dateRange === dr.days ? '#fff' : colors.textSecondary,
                border: `1px solid ${dateRange === dr.days ? colors.accent : colors.border}`,
                borderRadius: radius.md,
                fontSize: 12,
                fontWeight: 600,
                padding: '6px 12px',
                cursor: 'pointer',
              }}
            >
              {dr.label}
            </button>
          ))}
        </div>
        <span style={{ fontSize: 12, color: colors.textTertiary, alignSelf: 'center', marginLeft: 4 }}>
          {filtered.length} row{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div style={{
        backgroundColor: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: radius.lg,
        overflow: 'hidden',
      }}>
        {/* Table header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '160px 1fr 140px 90px 90px 1fr',
          padding: '10px 16px',
          borderBottom: `1px solid ${colors.border}`,
          gap: 12,
        }}>
          {['Date', 'Parent', 'Type', 'Amount', 'Email', 'Subject / Error'].map(h => (
            <div key={h} style={{ fontSize: 11, fontWeight: 600, color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {h}
            </div>
          ))}
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <div style={{ padding: '40px 16px', textAlign: 'center', color: colors.textTertiary, fontSize: 13 }}>
            No transactions found
          </div>
        ) : (
          filtered.map(row => {
            const isExpanded = expandedId === row.tx.id
            return (
              <div key={row.tx.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                <div
                  onClick={() => setExpandedId(isExpanded ? null : row.tx.id)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '160px 1fr 140px 90px 90px 1fr',
                    padding: '11px 16px',
                    gap: 12,
                    cursor: 'pointer',
                    alignItems: 'center',
                    backgroundColor: isExpanded ? colors.elevated : 'transparent',
                    transition: 'background-color 0.1s',
                  }}
                  onMouseEnter={e => { if (!isExpanded) (e.currentTarget as HTMLDivElement).style.backgroundColor = colors.elevated }}
                  onMouseLeave={e => { if (!isExpanded) (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent' }}
                >
                  <div style={{ fontSize: 12, color: colors.textSecondary }}>
                    {formatDate(row.tx.created_at)}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, color: colors.textPrimary, fontWeight: 500 }}>
                      {row.tx.payer_name || '—'}
                    </div>
                    <div style={{ fontSize: 11, color: colors.textTertiary }}>
                      {row.tx.payer_email || '—'}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: colors.textSecondary }}>
                    {PAYMENT_TYPE_LABELS[row.tx.payment_type] ?? row.tx.payment_type}
                  </div>
                  <div style={{ fontSize: 13, color: colors.textPrimary, fontWeight: 500 }}>
                    {formatUSD(row.tx.amount_cents)}
                  </div>
                  <StatusBadge status={row.emailStatus} />
                  <div style={{ fontSize: 12, color: row.emailStatus === 'error' ? colors.error : colors.textTertiary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {row.email?.status === 'error' ? row.email.error_message ?? 'Error' :
                     row.email?.subject ?? (row.emailStatus === 'missing' ? 'No email log found' : '—')}
                  </div>
                </div>

                {/* Expanded metadata panel */}
                {isExpanded && (
                  <div style={{
                    padding: '12px 16px 16px',
                    backgroundColor: colors.elevated,
                    borderTop: `1px solid ${colors.border}`,
                  }}>
                    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 600, color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Stripe Session</div>
                        <div style={{ fontSize: 12, color: colors.textSecondary, fontFamily: 'monospace' }}>{row.tx.stripe_session_id}</div>
                      </div>
                      {row.email && (
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 600, color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Email Sent At</div>
                          <div style={{ fontSize: 12, color: colors.textSecondary }}>{formatDate(row.email.sent_at)}</div>
                        </div>
                      )}
                      {row.email?.error_message && (
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 10, fontWeight: 600, color: colors.error, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Error Message</div>
                          <div style={{ fontSize: 12, color: colors.error, fontFamily: 'monospace', wordBreak: 'break-all' }}>{row.email.error_message}</div>
                        </div>
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Stripe Metadata</div>
                      <pre style={{
                        fontSize: 11,
                        color: colors.textSecondary,
                        backgroundColor: colors.bg,
                        border: `1px solid ${colors.border}`,
                        borderRadius: radius.md,
                        padding: '10px 12px',
                        overflow: 'auto',
                        maxHeight: 240,
                        margin: 0,
                        fontFamily: 'monospace',
                        lineHeight: 1.6,
                      }}>
                        {JSON.stringify(row.tx.metadata, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
