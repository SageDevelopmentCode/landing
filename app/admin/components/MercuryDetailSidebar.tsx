'use client'

import { ExternalLink } from 'lucide-react'
import { DetailSidebar } from './DetailSidebar'
import { SidebarField, SidebarSection } from '../../components/SidebarPrimitives'

export type MercuryTransaction = {
  id: string
  accountId: string
  amount: number
  status: string
  kind: string
  bankDescription: string | null
  merchantName: string | null
  counterpartyName: string | null
  counterpartyNickname: string | null
  note: string | null
  postedAt: string | null
  createdAt: string | null
  estimatedDeliveryDate: string | null
  dashboardLink: string | null
  details: Record<string, unknown> | null
  accountName: string
  accountNumber: string | null
}

interface MercuryDetailSidebarProps {
  transaction: MercuryTransaction | null
  onClose: () => void
}

function formatDate(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function MercuryDetailSidebar({ transaction, onClose }: MercuryDetailSidebarProps) {
  if (!transaction) return null

  const isCredit = transaction.amount > 0
  const amountDisplay = `${isCredit ? '+' : ''}${new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(transaction.amount)}`
  const amountColor = isCredit ? '#4A7C59' : '#A55858'

  const last4 = transaction.accountNumber
    ? transaction.accountNumber.slice(-4)
    : null

  const extraDetails = transaction.details
    ? Object.entries(transaction.details)
        .filter(([, v]) => v != null && v !== '')
        .map(([k, v]) => ({ key: k, value: String(v) }))
    : []

  return (
    <DetailSidebar
      isOpen={!!transaction}
      onClose={onClose}
      title="Mercury Transaction"
    >
      <SidebarSection title="Transaction">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-gray-400 font-body">Amount</span>
          <span className="text-sm font-semibold font-body" style={{ color: amountColor }}>
            {amountDisplay}
          </span>
        </div>
        <SidebarField label="Status" value={transaction.status} />
        <SidebarField label="Type" value={transaction.kind ? transaction.kind.charAt(0).toUpperCase() + transaction.kind.slice(1) : null} />
        <SidebarField label="Posted Date" value={formatDate(transaction.postedAt)} />
        <SidebarField label="Estimated Delivery" value={formatDate(transaction.estimatedDeliveryDate)} />
      </SidebarSection>

      <SidebarSection title="Description">
        <SidebarField label="Bank Description" value={transaction.bankDescription} />
        <SidebarField label="Merchant" value={transaction.merchantName} />
        <SidebarField label="Note" value={transaction.note} />
      </SidebarSection>

      <SidebarSection title="Counterparty">
        <SidebarField label="Name" value={transaction.counterpartyName} />
        <SidebarField label="Nickname" value={transaction.counterpartyNickname} />
      </SidebarSection>

      <SidebarSection title="Account">
        <SidebarField label="Account" value={transaction.accountName} />
        <SidebarField label="Last 4" value={last4} />
      </SidebarSection>

      {extraDetails.length > 0 && (
        <SidebarSection title="Details">
          {extraDetails.map(({ key, value }) => (
            <SidebarField key={key} label={key} value={value} />
          ))}
        </SidebarSection>
      )}

      {transaction.dashboardLink && (
        <SidebarSection title="Links">
          <a
            href={transaction.dashboardLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm font-body"
            style={{ color: '#5B7C8F' }}
          >
            <ExternalLink size={14} />
            View in Mercury
          </a>
        </SidebarSection>
      )}
    </DetailSidebar>
  )
}
