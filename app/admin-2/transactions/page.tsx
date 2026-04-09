'use client'

import { motion } from 'framer-motion'
import { DollarSign, Clock, TrendingUp } from 'lucide-react'
import { colors, radius, shadows } from '../design-system'
import { BadgePill } from '../components/BadgePill'
import { PageHeader } from '../components/PageHeader'
import { StatCard } from '../components/StatCard'
import { DataTable, Column } from '../components/DataTable'
import { MOCK_TRANSACTIONS, MOCK_MONTHLY_REVENUE } from '../mock-data'

type Transaction = typeof MOCK_TRANSACTIONS[number] & Record<string, unknown>

const MONTHS_SHORT = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr']

function MonthlyBarChart() {
  const W = 560
  const H = 140
  const PAD = { top: 12, right: 16, bottom: 28, left: 44 }
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom

  const maxVal = Math.max(...MOCK_MONTHLY_REVENUE.map(m => m.revenue))
  const barW = (innerW / MOCK_MONTHLY_REVENUE.length) * 0.55
  const barGap = innerW / MOCK_MONTHLY_REVENUE.length

  const toY = (v: number) => PAD.top + innerH - (v / maxVal) * innerH

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      {/* Grid lines */}
      {[0, maxVal * 0.5, maxVal].map((tick, i) => (
        <g key={i}>
          <line
            x1={PAD.left} y1={toY(tick)} x2={PAD.left + innerW} y2={toY(tick)}
            stroke={colors.border} strokeWidth="1"
          />
          <text x={PAD.left - 6} y={toY(tick) + 4} textAnchor="end" fontSize="9" fill={colors.textTertiary}>
            {tick > 0 ? `$${Math.round(tick / 1000)}k` : ''}
          </text>
        </g>
      ))}

      {/* Bars */}
      {MOCK_MONTHLY_REVENUE.map((m, i) => {
        const x = PAD.left + i * barGap + barGap * 0.225
        const barH = (m.revenue / maxVal) * innerH
        const y = PAD.top + innerH - barH
        return (
          <rect
            key={m.month}
            x={x} y={y}
            width={barW} height={barH}
            rx="3"
            fill={colors.accent}
            opacity="0.9"
          />
        )
      })}

      {/* X labels */}
      {MONTHS_SHORT.map((mon, i) => (
        <text
          key={mon}
          x={PAD.left + i * barGap + barGap * 0.225 + barW / 2}
          y={H - 8}
          textAnchor="middle" fontSize="9" fill={colors.textTertiary}
        >
          {mon}
        </text>
      ))}
    </svg>
  )
}

const COLUMNS: Column<Transaction>[] = [
  {
    key: 'date',
    label: 'Date',
    render: (row) => (
      <span style={{ color: colors.textTertiary }}>
        {new Date(row.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
      </span>
    ),
  },
  {
    key: 'payerName',
    label: 'Payer',
    render: (row) => <span className="font-medium" style={{ color: colors.textPrimary }}>{row.payerName}</span>,
  },
  {
    key: 'amount',
    label: 'Amount',
    render: (row) => (
      <span
        className="font-bold tabular-nums"
        style={{ color: row.status === 'failed' ? colors.danger : colors.success }}
      >
        {row.status === 'failed' ? '—' : `$${row.amount.toLocaleString()}`}
      </span>
    ),
  },
  {
    key: 'type',
    label: 'Type',
    render: (row) => (
      <span className="text-xs capitalize" style={{ color: colors.textSecondary }}>{row.type}</span>
    ),
  },
  {
    key: 'status',
    label: 'Status',
    render: (row) => <BadgePill status={row.status} />,
  },
  {
    key: 'method',
    label: 'Method',
    render: (row) => (
      <span
        className="text-xs uppercase font-semibold px-1.5 py-0.5 rounded"
        style={{
          backgroundColor: colors.elevated,
          color: colors.textTertiary,
          border: `1px solid ${colors.border}`,
        }}
      >
        {row.method}
      </span>
    ),
  },
]

const succeeded = MOCK_TRANSACTIONS.filter(t => t.status === 'succeeded')
const total = succeeded.reduce((s, t) => s + t.amount, 0)
const thisMonth = succeeded.filter(t => t.date.startsWith('2026-04')).reduce((s, t) => s + t.amount, 0)
const pending = MOCK_TRANSACTIONS.filter(t => t.status === 'processing').reduce((s, t) => s + t.amount, 0)

export default function Admin2Transactions() {
  return (
    <div className="max-w-screen-xl mx-auto">
      <PageHeader title="Transactions" subtitle="Stripe payment history" />

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <StatCard
          title="Total Received"
          value={`$${total.toLocaleString()}`}
          delta="+18% vs last year"
          deltaPositive
          icon={<DollarSign className="w-4 h-4" />}
        />
        <StatCard
          title="This Month"
          value={`$${thisMonth.toLocaleString()}`}
          icon={<TrendingUp className="w-4 h-4" />}
          delay={0.05}
        />
        <StatCard
          title="Processing"
          value={`$${pending.toLocaleString()}`}
          delta="1 transaction"
          deltaPositive={false}
          icon={<Clock className="w-4 h-4" />}
          delay={0.1}
        />
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        style={{
          backgroundColor: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: radius.lg,
          boxShadow: shadows.card,
          overflow: 'hidden',
          marginBottom: '24px',
        }}
      >
        <DataTable columns={COLUMNS} rows={MOCK_TRANSACTIONS as Transaction[]} />
      </motion.div>

      {/* Monthly chart */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{
          backgroundColor: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: radius.lg,
          padding: '20px',
          boxShadow: shadows.card,
        }}
      >
        <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: colors.textTertiary }}>
          Monthly Revenue
        </p>
        <MonthlyBarChart />
      </motion.div>
    </div>
  )
}
