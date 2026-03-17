'use client'

import { useState, useMemo } from 'react'
import { ExternalLink, CheckCircle2, Circle } from 'lucide-react'
import { Table, TableRow, TableCell } from '../components/Table'
import { TransactionDetailSidebar, formatCents, formatPaymentType, stripeUrl } from '../components/TransactionDetailSidebar'
import { colors } from '../design-system'

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
}

interface TransactionsClientProps {
  transactions: StripeTransaction[]
  studentMap: Record<string, string>
}

type ChildGroup = {
  key: string
  name: string
  txs: StripeTransaction[]
}

// --- Checklist data structures ---

type ChecklistItem = {
  id: string
  label: string
  payment_type: string
  week?: string
  month?: string
}

const SUMMER_ITEMS: ChecklistItem[] = [
  { id: 'reg', label: 'Registration Fee', payment_type: 'registration_fee' },
  ...Array.from({ length: 12 }, (_, i) => ({
    id: `week_${i + 1}`,
    label: `Week ${i + 1}`,
    payment_type: 'tuition',
    week: String(i + 1),
  })),
]

const SCHOOL_YEAR_ITEMS: ChecklistItem[] = [
  { id: 'reg', label: 'Registration Fee ($500)', payment_type: 'registration_fee' },
  { id: 'supply', label: 'Supply Fee ($300)', payment_type: 'supply_fee' },
  ...[
    'august', 'september', 'october', 'november', 'december',
    'january', 'february', 'march', 'april', 'may',
  ].map(m => ({
    id: m,
    label: m.charAt(0).toUpperCase() + m.slice(1),
    payment_type: 'tuition',
    month: m,
  })),
]

function isTxMatch(
  tx: StripeTransaction,
  item: ChecklistItem,
  program: 'summer_26' | 'school_year_26_27'
): boolean {
  if (tx.payment_type !== item.payment_type) return false
  const prog = tx.metadata?.program as string | undefined
  if (prog !== program && prog !== 'both') return false
  if (item.week && (tx.metadata?.week as string | undefined) !== item.week) return false
  if (item.month && (tx.metadata?.month as string | undefined) !== item.month) return false
  return true
}

// --- Sub-components ---

function StatusBadge({ status }: { status: string }) {
  const isSuccess = status === 'complete' || status === 'paid' || status === 'succeeded'
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{
        backgroundColor: isSuccess ? colors.pastelSage : colors.paleMarigold,
        color: isSuccess ? colors.mistyForest : colors.warningText,
      }}
    >
      {status}
    </span>
  )
}

function getInitials(name: string | null, email: string | null): string {
  if (name) {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    return parts[0][0].toUpperCase()
  }
  if (email) return email[0].toUpperCase()
  return '?'
}

function ProgramChecklist({
  title,
  items,
  txs,
  program,
  onSelectTx,
}: {
  title: string
  items: ChecklistItem[]
  txs: StripeTransaction[]
  program: 'summer_26' | 'school_year_26_27'
  onSelectTx: (tx: StripeTransaction) => void
}) {
  const resolved = items.map(item => ({
    item,
    match: txs.find(tx => isTxMatch(tx, item, program)) ?? null,
  }))

  const paidCount = resolved.filter(r => r.match !== null).length
  const total = items.length

  return (
    <div
      className="rounded-xl overflow-hidden flex-1 min-w-0"
      style={{ border: `1px solid ${colors.border}`, backgroundColor: colors.softCloud }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 border-b"
        style={{ borderColor: colors.divider, backgroundColor: colors.softCloud }}
      >
        <div className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
          {title}
        </div>
        <div className="text-xs mt-0.5" style={{ color: colors.textTertiary }}>
          {paidCount} / {total} paid
        </div>
      </div>

      {/* Items */}
      <div className="divide-y" style={{ borderColor: colors.divider }}>
        {resolved.map(({ item, match }) => {
          const isPaid = match !== null
          const dateStr = isPaid
            ? new Date(match!.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })
            : null

          return (
            <div
              key={item.id}
              onClick={() => isPaid && onSelectTx(match!)}
              className="flex items-center gap-3 px-4 py-2.5 transition-colors"
              style={{
                cursor: isPaid ? 'pointer' : 'default',
                opacity: isPaid ? 1 : 0.45,
                backgroundColor: isPaid ? 'rgba(232, 240, 233, 0.4)' : 'transparent',
              }}
              onMouseEnter={e => {
                if (isPaid) (e.currentTarget as HTMLDivElement).style.backgroundColor = colors.pastelSage
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent'
              }}
            >
              {isPaid ? (
                <CheckCircle2
                  className="flex-shrink-0 w-4 h-4"
                  style={{ color: colors.mistyForest }}
                />
              ) : (
                <Circle
                  className="flex-shrink-0 w-4 h-4"
                  style={{ color: colors.border }}
                />
              )}

              <span
                className="flex-1 text-sm"
                style={{
                  color: isPaid ? colors.mistyForest : colors.textTertiary,
                  fontWeight: isPaid ? 600 : 400,
                }}
              >
                {item.label}
              </span>

              {isPaid && dateStr && (
                <span
                  className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{
                    backgroundColor: colors.pastelSage,
                    color: colors.mistyForest,
                  }}
                >
                  {dateStr}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// --- Main component ---

export function TransactionsClient({ transactions, studentMap }: TransactionsClientProps) {
  const [activeTab, setActiveTab] = useState<'list' | 'by-parent'>('list')
  const [selectedTransaction, setSelectedTransaction] = useState<StripeTransaction | null>(null)
  const [localTransactions, setLocalTransactions] = useState(transactions)
  const [selectedParentKey, setSelectedParentKey] = useState<string | null>(null)
  const [selectedChildKey, setSelectedChildKey] = useState<string | null>(null)

  const handleDeleted = (id: string) => {
    setLocalTransactions(prev => prev.filter(tx => tx.id !== id))
  }

  const parentGroups = useMemo(() => {
    const map = new Map<string, { key: string; name: string | null; email: string | null; txs: StripeTransaction[] }>()
    for (const tx of localTransactions) {
      if (!tx.metadata?.program) continue
      const key = tx.parent_id ?? tx.payer_email ?? 'unknown'
      if (!map.has(key)) map.set(key, { key, name: tx.payer_name, email: tx.payer_email, txs: [] })
      map.get(key)!.txs.push(tx)
    }
    return Array.from(map.values()).sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))
  }, [localTransactions])

  const selectedGroup = selectedParentKey ? parentGroups.find(g => g.key === selectedParentKey) ?? null : null

  const childGroups = useMemo((): ChildGroup[] => {
    if (!selectedGroup) return []
    const map = new Map<string, ChildGroup>()
    for (const tx of selectedGroup.txs) {
      const key = tx.student_id ?? 'unknown'
      if (!map.has(key)) {
        const name = tx.student_id
          ? (studentMap[tx.student_id] ?? tx.student_id.slice(0, 8))
          : 'Unknown'
        map.set(key, { key, name, txs: [] })
      }
      map.get(key)!.txs.push(tx)
    }
    return Array.from(map.values())
  }, [selectedGroup, studentMap])

  const effectiveChildKey = selectedChildKey ?? childGroups[0]?.key ?? null
  const selectedChildGroup = childGroups.find(c => c.key === effectiveChildKey) ?? null

  // Determine which programs the selected child has
  const hasSummer = selectedChildGroup?.txs.some(tx => {
    const prog = tx.metadata?.program as string | undefined
    return prog === 'summer_26' || prog === 'both'
  }) ?? false

  const hasSchoolYear = selectedChildGroup?.txs.some(tx => {
    const prog = tx.metadata?.program as string | undefined
    return prog === 'school_year_26_27' || prog === 'both'
  }) ?? false

  return (
    <>
      {/* Tab switcher */}
      <div className="flex gap-2 mb-4">
        {(['list', 'by-parent'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
            style={{
              backgroundColor: activeTab === tab ? colors.mistyForest : 'transparent',
              color: activeTab === tab ? '#ffffff' : colors.textSecondary,
              border: `1px solid ${activeTab === tab ? colors.mistyForest : colors.border}`,
            }}
          >
            {tab === 'list' ? 'All Transactions' : 'By Parent'}
          </button>
        ))}
      </div>

      {/* Tab 1 — All Transactions */}
      {activeTab === 'list' && (
        <Table headers={['Type', 'Status', 'Payer', 'Amount', 'Net Amount', 'Date']}>
          {localTransactions.map((tx, index) => (
            <TableRow key={tx.id} index={index} onClick={() => setSelectedTransaction(tx)}>
              <TableCell>
                <div className="flex items-center gap-2">
                  {formatPaymentType(tx.payment_type)}
                  {stripeUrl(tx) && (
                    <a
                      href={stripeUrl(tx)!}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="opacity-40 hover:opacity-100 transition-opacity"
                      style={{ color: colors.mistyForest }}
                      title="View in Stripe"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <StatusBadge status={tx.status} />
              </TableCell>
              <TableCell>
                <div>
                  {tx.payment_type !== 'donation' && tx.payer_name && (
                    <div className="font-medium text-gray-800">{tx.payer_name}</div>
                  )}
                  <div className="text-gray-500 text-xs">{tx.payer_email ?? '—'}</div>
                </div>
              </TableCell>
              <TableCell>{formatCents(tx.amount_cents, tx.currency)}</TableCell>
              <TableCell>
                {tx.cover_fees ? formatCents(tx.intended_amount_cents, tx.currency) : '—'}
              </TableCell>
              <TableCell>
                {new Date(tx.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </TableCell>
            </TableRow>
          ))}
        </Table>
      )}

      {/* Tab 2 — By Parent */}
      {activeTab === 'by-parent' && (
        <div className="flex gap-4" style={{ minHeight: '400px' }}>
          {/* Left panel — parent list */}
          <div
            className="flex-shrink-0 overflow-y-auto rounded-xl"
            style={{
              width: '280px',
              border: `1px solid ${colors.border}`,
              backgroundColor: colors.softCloud,
            }}
          >
            {parentGroups.map(group => {
              const isActive = group.key === selectedParentKey
              return (
                <button
                  key={group.key}
                  onClick={() => { setSelectedParentKey(group.key); setSelectedChildKey(null) }}
                  className="w-full text-left px-4 py-3 flex items-center gap-3 transition-colors"
                  style={{
                    backgroundColor: isActive ? colors.pastelSage : 'transparent',
                    borderBottom: `1px solid ${colors.divider}`,
                  }}
                >
                  {/* Avatar */}
                  <div
                    className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{
                      backgroundColor: colors.paleMarigold,
                      color: colors.warningText,
                    }}
                  >
                    {getInitials(group.name, group.email)}
                  </div>
                  {/* Name + email */}
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-sm font-medium truncate"
                      style={{ color: colors.textPrimary }}
                    >
                      {group.name ?? group.email ?? 'Unknown'}
                    </div>
                    {group.name && (
                      <div
                        className="text-xs truncate"
                        style={{ color: colors.textTertiary }}
                      >
                        {group.email ?? ''}
                      </div>
                    )}
                  </div>
                  {/* Count badge — program tx count */}
                  <span
                    className="flex-shrink-0 text-xs font-semibold px-1.5 py-0.5 rounded-full"
                    style={{
                      backgroundColor: isActive ? colors.mistyForest : colors.border,
                      color: isActive ? '#ffffff' : colors.textSecondary,
                    }}
                  >
                    {group.txs.length}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Right panel — program checklists */}
          <div className="flex-1 min-w-0">
            {!selectedGroup ? (
              <div
                className="h-full flex items-center justify-center rounded-xl"
                style={{ border: `1px dashed ${colors.border}`, color: colors.textTertiary }}
              >
                <p className="text-sm">Select a parent to view their payment checklist</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4 h-full">
                {/* Parent header */}
                <div>
                  <div className="text-base font-semibold" style={{ color: colors.textPrimary }}>
                    {selectedGroup.name ?? selectedGroup.email ?? 'Unknown'}
                  </div>
                  {selectedGroup.name && (
                    <div className="text-sm" style={{ color: colors.textSecondary }}>
                      {selectedGroup.email}
                    </div>
                  )}
                </div>

                {/* Child tabs */}
                <div className="flex gap-2 flex-wrap">
                  {childGroups.map(child => {
                    const isActive = child.key === effectiveChildKey
                    return (
                      <button
                        key={child.key}
                        onClick={() => setSelectedChildKey(child.key)}
                        className="px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
                        style={{
                          backgroundColor: isActive ? colors.mistyForest : 'transparent',
                          color: isActive ? '#ffffff' : colors.textSecondary,
                          border: `1px solid ${isActive ? colors.mistyForest : colors.border}`,
                        }}
                      >
                        {child.name}
                      </button>
                    )
                  })}
                </div>

                {/* Checklist cards */}
                <div className="flex gap-4 flex-1 items-start">
                  {hasSummer && (
                    <ProgramChecklist
                      title="Summer 2026"
                      items={SUMMER_ITEMS}
                      txs={selectedChildGroup?.txs ?? []}
                      program="summer_26"
                      onSelectTx={setSelectedTransaction}
                    />
                  )}
                  {hasSchoolYear && (
                    <ProgramChecklist
                      title="School Year 2026–2027"
                      items={SCHOOL_YEAR_ITEMS}
                      txs={selectedChildGroup?.txs ?? []}
                      program="school_year_26_27"
                      onSelectTx={setSelectedTransaction}
                    />
                  )}
                  {!hasSummer && !hasSchoolYear && (
                    <div
                      className="flex-1 flex items-center justify-center rounded-xl py-12"
                      style={{ border: `1px dashed ${colors.border}`, color: colors.textTertiary }}
                    >
                      <p className="text-sm">No program transactions found</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <TransactionDetailSidebar
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        onDeleted={handleDeleted}
      />
    </>
  )
}
