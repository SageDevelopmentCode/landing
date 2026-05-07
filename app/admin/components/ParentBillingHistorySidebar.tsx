'use client'

import { useState } from 'react'
import { Receipt } from 'lucide-react'
import { DetailSidebar } from './DetailSidebar'
import { formatCents, formatPaymentType } from './TransactionDetailSidebar'
import { cssColors as colors } from '../design-system'

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

interface ParentBillingHistorySidebarProps {
  isOpen: boolean
  onClose: () => void
  parentName: string | null
  transactions: StripeTransaction[]
  studentMap: Record<string, string>
  onSelectTransaction: (tx: StripeTransaction) => void
}

function StatusBadge({ status }: { status: string }) {
  const isSuccess =
    status === 'complete' || status === 'paid' || status === 'succeeded' || status === 'completed'
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{
        backgroundColor: isSuccess ? '#166534' : '#92400e',
        color: '#ffffff',
      }}
    >
      {status}
    </span>
  )
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function ParentBillingHistorySidebar({
  isOpen,
  onClose,
  parentName,
  transactions,
  studentMap,
  onSelectTransaction,
}: ParentBillingHistorySidebarProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const title = parentName ? `${parentName}'s Billing History` : 'Billing History'

  return (
    <DetailSidebar isOpen={isOpen} onClose={onClose} title={title}>
      {transactions.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-16 gap-3"
          style={{ color: colors.textTertiary }}
        >
          <Receipt className="w-8 h-8 opacity-40" />
          <p className="text-sm">No transactions found</p>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-6">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr style={{ backgroundColor: colors.elevated }}>
                {['Date', 'Description', 'Student', 'Type', 'Amount', 'Status'].map((h) => (
                  <th
                    key={h}
                    className="sticky top-0 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap"
                    style={{ color: colors.textTertiary, backgroundColor: colors.elevated }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr
                  key={tx.id}
                  onClick={() => onSelectTransaction(tx)}
                  onMouseEnter={() => setHoveredId(tx.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    cursor: 'pointer',
                    backgroundColor: hoveredId === tx.id ? colors.elevated : 'transparent',
                    borderBottom: `1px solid ${colors.border}`,
                  }}
                >
                  <td
                    className="px-4 py-3 whitespace-nowrap text-xs"
                    style={{ color: colors.textSecondary }}
                  >
                    {formatDate(tx.created_at)}
                  </td>
                  <td
                    className="px-4 py-3 text-xs max-w-[160px] truncate"
                    style={{ color: colors.textPrimary }}
                    title={tx.description ?? undefined}
                  >
                    {tx.description ?? '—'}
                  </td>
                  <td
                    className="px-4 py-3 whitespace-nowrap text-xs"
                    style={{ color: colors.textSecondary }}
                  >
                    {tx.student_id ? (studentMap[tx.student_id] ?? tx.student_id.slice(0, 8)) : '—'}
                  </td>
                  <td
                    className="px-4 py-3 whitespace-nowrap text-xs"
                    style={{ color: colors.textSecondary }}
                  >
                    {formatPaymentType(tx.payment_type)}
                  </td>
                  <td
                    className="px-4 py-3 whitespace-nowrap text-xs font-medium"
                    style={{ color: colors.textPrimary }}
                  >
                    {formatCents(tx.amount_cents, tx.currency)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <StatusBadge status={tx.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DetailSidebar>
  )
}
