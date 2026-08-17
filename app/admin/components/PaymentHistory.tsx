'use client'

import { useState, useEffect } from 'react'
import { getParentTransactions } from '../../actions/getParentTransactions'
import { formatHomeschoolSubline, formatSchoolYearMonthsFromMetadata } from '@/shared/billing/school-year'

type Transaction = {
  id: string
  payment_type: string
  status: string
  amount_cents: number
  intended_amount_cents: number | null
  cover_fees: boolean | null
  payer_email: string | null
  description: string | null
  student_id: string | null
  application_id: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

function formatCents(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function formatPaymentType(type: string): string {
  return type.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

function StatusBadge({ status }: { status: string }) {
  const isCompleted = status === 'completed'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${isCompleted ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

function getSubLine(tx: Transaction): string | null {
  const meta = (tx.metadata ?? {}) as Record<string, string>
  if (tx.payment_type === 'summer_tuition') return null
  if (meta.selected_months) {
    if (tx.payment_type === 'school_year_tuition') {
      const formatted = formatSchoolYearMonthsFromMetadata(meta.selected_months, 'short')
      if (formatted) return formatted
    }
    const months = meta.selected_months.split(',').filter(Boolean)
    if (months.length > 0) return months.join(', ')
  }
  if (tx.payment_type === 'homeschool_dropin') {
    return formatHomeschoolSubline(meta)
  }
  if (meta.selected_weeks) {
    const wks = meta.selected_weeks.split(',').filter(Boolean)
    if (wks.length > 0) return `${wks.length} week${wks.length !== 1 ? 's' : ''}`
  }
  if (meta.selected_fridays) {
    const fridays = meta.selected_fridays.split(',').filter(Boolean)
    if (fridays.length > 0) return `${fridays.length} Friday${fridays.length !== 1 ? 's' : ''}`
  }
  return null
}

function TransactionDetail({ tx }: { tx: Transaction }) {
  const meta = (tx.metadata ?? {}) as Record<string, string>
  const fee =
    tx.cover_fees && tx.intended_amount_cents != null
      ? tx.amount_cents - tx.intended_amount_cents
      : 0
  const subLine = getSubLine(tx)

  return (
    <div className="mt-3 pt-3 border-t border-gray-100 space-y-3 text-xs">
      <div>
        <p className="font-semibold text-gray-700 text-sm">{formatPaymentType(tx.payment_type)}</p>
        {tx.description && <p className="text-gray-400 mt-0.5">{tx.description}</p>}
      </div>

      {tx.student_id && (
        <div>
          <p className="font-semibold text-gray-400 uppercase tracking-wider mb-1">Student</p>
          <p className="text-gray-700">{tx.student_id}</p>
          {subLine && <p className="text-gray-400 mt-0.5">{subLine}</p>}
        </div>
      )}

      <div className="space-y-1.5">
        {tx.intended_amount_cents != null && (
          <div className="flex justify-between">
            <span className="text-gray-500">Subtotal</span>
            <span className="text-gray-700">{formatCents(tx.intended_amount_cents)}</span>
          </div>
        )}
        {tx.cover_fees && fee > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-500">{meta.payment_method === 'ach' ? 'ACH processing fee' : 'Card processing fee'}</span>
            <span className="text-gray-700">{formatCents(fee)}</span>
          </div>
        )}
        <div className="flex justify-between font-semibold border-t border-gray-200 pt-2 mt-1">
          <span className="text-gray-800">Total charged</span>
          <span className="text-gray-800">{formatCents(tx.amount_cents)}</span>
        </div>
      </div>

      {tx.payer_email && (
        <p className="text-gray-400">
          Paid by <span className="text-gray-600">{tx.payer_email}</span>
        </p>
      )}
    </div>
  )
}

interface PaymentHistoryProps {
  parentId: string
}

export function PaymentHistory({ parentId }: PaymentHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    getParentTransactions(parentId)
      .then((data) => setTransactions(data as Transaction[]))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load transactions'))
      .finally(() => setLoading(false))
  }, [parentId])

  const toggle = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (loading) {
    return (
      <div className="p-4 text-center bg-gray-50 rounded-lg border border-gray-100">
        <div className="flex items-center justify-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#2C5F2E]" />
          <p className="text-sm text-gray-400">Loading transactions…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-xs text-yellow-700">Error loading transactions: {error}</p>
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="p-4 text-center bg-gray-50 rounded-lg border border-gray-100">
        <p className="text-sm text-gray-400">No transactions found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {transactions.map((tx) => {
        const isExpanded = expandedIds.has(tx.id)
        return (
          <div
            key={tx.id}
            onClick={() => toggle(tx.id)}
            className="cursor-pointer bg-gray-50 border border-gray-100 rounded-lg px-3 py-2.5 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-gray-700 truncate">
                    {formatPaymentType(tx.payment_type)}
                  </span>
                  <StatusBadge status={tx.status} />
                </div>
                {tx.description && (
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{tx.description}</p>
                )}
                <p className="text-xs text-gray-300 mt-0.5">{formatDate(tx.created_at)}</p>
              </div>
              <div className="flex-shrink-0 text-right">
                <p className="text-sm font-bold text-gray-800">{formatCents(tx.amount_cents)}</p>
                <p className="text-xs text-gray-300 mt-0.5">{isExpanded ? '▲' : '▼'}</p>
              </div>
            </div>
            {isExpanded && <TransactionDetail tx={tx} />}
          </div>
        )
      })}
    </div>
  )
}
