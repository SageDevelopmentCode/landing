'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { DetailSidebar } from './DetailSidebar'
import { SidebarField, SidebarSection } from '../../components/SidebarPrimitives'

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

type StudentRecord = {
  id: string
  child_legal_name: string | null
  dob_month: string | null
  dob_day: string | null
  dob_year: string | null
}

type ApplicationRecord = {
  id: string
  child_legal_name: string | null
  g1_full_name: string | null
  g1_email: string | null
  program: string | null
  status: string
}

type UserRecord = {
  id: string
  full_name: string | null
  email: string | null
}

const PROGRAM_LABELS: Record<string, string> = {
  summer_26: 'Summer 2026',
  school_year_26_27: 'School Year 2026–2027',
  both: 'Both',
}

function formatProgram(value: string | null): string {
  if (!value) return '—'
  return PROGRAM_LABELS[value] ?? value
}

export function formatPaymentType(type: string): string {
  const labels: Record<string, string> = {
    registration_fee: 'Registration Fee',
    donation: 'Donation',
    tuition: 'Tuition',
    deposit: 'Deposit',
  }
  return labels[type] ?? type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function formatCents(cents: number | null, currency = 'USD'): string {
  if (cents == null) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(cents / 100)
}

interface TransactionDetailSidebarProps {
  transaction: StripeTransaction | null
  onClose: () => void
}

export function TransactionDetailSidebar({ transaction, onClose }: TransactionDetailSidebarProps) {
  const [studentRecord, setStudentRecord] = useState<StudentRecord | null>(null)
  const [applicationRecord, setApplicationRecord] = useState<ApplicationRecord | null>(null)
  const [userRecord, setUserRecord] = useState<UserRecord | null>(null)

  useEffect(() => {
    setStudentRecord(null)
    setApplicationRecord(null)
    setUserRecord(null)

    if (!transaction?.id) return
    if (transaction.payment_type === 'donation') return

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const load = async () => {
      if (transaction.student_id) {
        const { data } = await supabase
          .schema('admin')
          .from('students')
          .select('id, child_legal_name, dob_month, dob_day, dob_year')
          .eq('id', transaction.student_id)
          .single()
        if (data) setStudentRecord(data as StudentRecord)
      }

      if (transaction.application_id) {
        const { data } = await supabase
          .schema('parent_app')
          .from('applications')
          .select('id, child_legal_name, g1_full_name, g1_email, program, status')
          .eq('id', transaction.application_id)
          .single()
        if (data) setApplicationRecord(data as ApplicationRecord)
      }

      if (transaction.parent_id) {
        const { data } = await supabase
          .schema('admin')
          .from('users')
          .select('id, full_name, email')
          .eq('id', transaction.parent_id)
          .single()
        if (data) setUserRecord(data as UserRecord)
      }
    }

    load()
  }, [transaction?.id])

  const title = transaction
    ? transaction.payer_name ?? transaction.payer_email ?? formatPaymentType(transaction.payment_type)
    : ''

  const metadataIsEmpty =
    !transaction?.metadata ||
    Object.keys(transaction.metadata).length === 0

  return (
    <DetailSidebar isOpen={!!transaction} onClose={onClose} title={title}>
      {transaction && (
        <div className="space-y-4">
          <SidebarSection title="Payment">
            <SidebarField label="Type" value={formatPaymentType(transaction.payment_type)} />
            <SidebarField label="Status" value={transaction.status} />
            <SidebarField label="Amount" value={formatCents(transaction.amount_cents, transaction.currency)} />
            {transaction.cover_fees && (
              <SidebarField label="Net Amount" value={formatCents(transaction.intended_amount_cents, transaction.currency)} />
            )}
            <SidebarField label="Covers Fees" value={transaction.cover_fees ?? false} />
            <SidebarField label="Currency" value={transaction.currency.toUpperCase()} />
            <SidebarField label="Description" value={transaction.description} />
          </SidebarSection>

          <SidebarSection title="Payer">
            {transaction.payer_name && (
              <SidebarField label="Name" value={transaction.payer_name} />
            )}
            <SidebarField label="Email" value={transaction.payer_email} />
          </SidebarSection>

          <SidebarSection title="References">
            <SidebarField label="Session ID" value={transaction.stripe_session_id} />
            <SidebarField label="Payment Intent ID" value={transaction.stripe_payment_intent_id} />
          </SidebarSection>

          {studentRecord && (
            <SidebarSection title="Student">
              <SidebarField label="Name" value={studentRecord.child_legal_name} />
              <SidebarField
                label="Date of Birth"
                value={
                  studentRecord.dob_month && studentRecord.dob_day && studentRecord.dob_year
                    ? `${studentRecord.dob_month}/${studentRecord.dob_day}/${studentRecord.dob_year}`
                    : null
                }
              />
            </SidebarSection>
          )}

          {applicationRecord && (
            <SidebarSection title="Application">
              <SidebarField label="Child Name" value={applicationRecord.child_legal_name} />
              <SidebarField label="Guardian" value={applicationRecord.g1_full_name} />
              <SidebarField label="Guardian Email" value={applicationRecord.g1_email} />
              <SidebarField label="Program" value={formatProgram(applicationRecord.program)} />
              <SidebarField label="Status" value={applicationRecord.status} />
            </SidebarSection>
          )}

          {userRecord && (
            <SidebarSection title="Parent Account">
              <SidebarField label="Name" value={userRecord.full_name} />
              <SidebarField label="Email" value={userRecord.email} />
            </SidebarSection>
          )}

          <SidebarSection title="Metadata">
            {metadataIsEmpty ? (
              <span className="text-sm text-gray-400 font-body">No metadata</span>
            ) : (
              <pre className="text-xs text-gray-700 bg-gray-50 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-all font-mono">
                {JSON.stringify(transaction.metadata, null, 2)}
              </pre>
            )}
          </SidebarSection>
        </div>
      )}
    </DetailSidebar>
  )
}
