'use client'

import { useState } from 'react'
import { ExternalLink } from 'lucide-react'
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
}

interface TransactionsClientProps {
  transactions: StripeTransaction[]
}

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

export function TransactionsClient({ transactions }: TransactionsClientProps) {
  const [selectedTransaction, setSelectedTransaction] = useState<StripeTransaction | null>(null)

  return (
    <>
      <Table headers={['Type', 'Status', 'Payer', 'Amount', 'Net Amount', 'Date']}>
        {transactions.map((tx, index) => (
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

      <TransactionDetailSidebar
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
      />
    </>
  )
}
