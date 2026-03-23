'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronRight, ExternalLink } from 'lucide-react'
import { DetailSidebar } from './DetailSidebar'
import { getTransactionRelatedRecords } from '@/app/actions/getTransactionRelatedRecords'
import { deleteTransaction } from '@/app/actions/deleteTransaction'
import { toggleTransactionExclusion } from '@/app/actions/toggleTransactionExclusion'
import { getParentDetail } from '@/app/actions/getParentDetail'
import { getStudentDetail } from '@/app/actions/getStudentDetail'
import { SidebarField, SidebarSection } from '../../components/SidebarPrimitives'
import { colors } from '../design-system'
import { ApplicationDetailSidebar } from './ApplicationDetailSidebar'
import { ParentDetailSidebar } from './ParentDetailSidebar'
import { StudentDetailSidebar } from './StudentDetailSidebar'

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
  drop_in_program: string | null
  status: string
}

type UserRecord = {
  id: string
  full_name: string | null
  email: string | null
}

// Types matching the shapes expected by the nested sidebars
type FullApplication = {
  id: string
  user_id: string
  child_legal_name: string | null
  preferred_name: string | null
  dob_month: string | null
  dob_day: string | null
  dob_year: string | null
  child_age: number | null
  child_grade: string | null
  program: string | null
  drop_in_program: string | null
  address_street: string | null
  address_city: string | null
  address_state: string | null
  address_zip: string | null
  is_homeschooled: string | null
  homeschool_explanation: string | null
  previous_schools: string | null
  previous_schools_list: string | null
  special_interests: string | null
  has_allergies: boolean | null
  allergies_description: string | null
  has_medical_conditions: boolean | null
  medical_conditions_description: string | null
  has_emergency_medications: boolean | null
  emergency_medications_description: string | null
  activities_to_avoid: string | null
  dysregulation_response: string | null
  regulation_strategies: string | null
  needs_aide: boolean | null
  needs_aide_description: string | null
  history_flags: string | null
  history_explanation: string | null
  has_custody_orders: boolean | null
  custody_orders_description: string | null
  learning_style: string | null
  strengths_interests: string | null
  current_challenges: string | null
  g1_full_name: string | null
  g1_relationship: string | null
  g1_cell_phone: string | null
  g1_work_phone: string | null
  g1_email: string | null
  g1_has_custody: boolean | null
  g1_lives_with_child: boolean | null
  g1_preferred_contact: boolean | null
  g2_full_name: string | null
  g2_relationship: string | null
  g2_cell_phone: string | null
  g2_work_phone: string | null
  g2_email: string | null
  g2_has_custody: boolean | null
  g2_lives_with_child: boolean | null
  g2_preferred_contact: boolean | null
  student_id: string | null
  admin_notes: string | null
  status: string
  approved: boolean
  approved_at: string | null
  denied: boolean
  denied_at: string | null
  denied_reason: string | null
  is_active: boolean | null
  created_at: string | null
  [key: string]: unknown
}

type FullParent = {
  id: string
  email: string | null
  full_name: string | null
  g1_cell_phone: string | null
  g1_work_phone: string | null
  g1_preferred_contact: boolean | null
  g1_lives_with_child: boolean | null
  g1_has_custody: boolean | null
  g2_full_name: string | null
  g2_relationship: string | null
  g2_email: string | null
  g2_cell_phone: string | null
  g2_work_phone: string | null
  [key: string]: unknown
}

type ParentDetail = {
  children: {
    id: string
    child_legal_name: string | null
    dob_month: string | null
    dob_day: string | null
    dob_year: string | null
  }[]
  applications: {
    id: string
    child_legal_name: string | null
    program: string | null
    drop_in_program: string | null
    status: string
    approved: boolean
    approved_at: string | null
    updated_at: string | null
  }[]
}

type FullStudent = {
  id: string
  parent_id: string
  child_legal_name: string | null
  dob_month: string | null
  dob_day: string | null
  dob_year: string | null
  special_interests: string | null
  has_medical_conditions: string | null
  medical_conditions_description: string | null
  has_allergies: string | null
  allergies_description: string | null
  has_emergency_medications: string | null
  emergency_medications_description: string | null
  history_flags: string | null
  history_explanation: string | null
  needs_aide: string | null
  needs_aide_description: string | null
  learning_style: string | null
  strengths_interests: string | null
  current_challenges: string | null
  dysregulation_response: string | null
  regulation_strategies: string | null
  activities_to_avoid: string | null
  child_grade: string | null
  parent_name?: string | null
}

const PROGRAM_LABELS: Record<string, string> = {
  summer_26: 'Summer 2026',
  school_year_26_27: 'School Year 2026–2027',
  both: 'Both',
  homeschool_drop_in: 'Homeschool Drop-In',
}

function formatProgram(value: string | null): string {
  if (!value) return '—'
  return PROGRAM_LABELS[value] ?? value
}

function getInitials(name: string | null): string {
  if (!name) return '?'
  return name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase()
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

export function stripeUrl(tx: { stripe_payment_intent_id: string | null; stripe_session_id: string | null }): string | null {
  const isTest = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.startsWith('pk_test_')
  const base = `https://dashboard.stripe.com${isTest ? '/test' : ''}`
  if (tx.stripe_payment_intent_id) return `${base}/payments/${tx.stripe_payment_intent_id}`
  if (tx.stripe_session_id) return `${base}/checkout/sessions/${tx.stripe_session_id}`
  return null
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
  onDeleted?: (id: string) => void
  onExclusionToggled?: (id: string, excluded: boolean) => void
}

export function TransactionDetailSidebar({ transaction, onClose, onDeleted, onExclusionToggled }: TransactionDetailSidebarProps) {
  const [studentRecord, setStudentRecord] = useState<StudentRecord | null>(null)
  const [applicationRecord, setApplicationRecord] = useState<ApplicationRecord | null>(null)
  const [userRecord, setUserRecord] = useState<UserRecord | null>(null)

  // Nested sidebar state
  const [openApplication, setOpenApplication] = useState<FullApplication | null>(null)
  const [applicationLoading, setApplicationLoading] = useState(false)

  const [openParent, setOpenParent] = useState<FullParent | null>(null)
  const [openParentDetail, setOpenParentDetail] = useState<ParentDetail | null>(null)
  const [parentDetailLoading, setParentDetailLoading] = useState(false)

  const [openStudent, setOpenStudent] = useState<FullStudent | null>(null)
  const [studentDetailLoading, setStudentDetailLoading] = useState(false)

  const [showTransactionSidebar, setShowTransactionSidebar] = useState(true)

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const [isExcluded, setIsExcluded] = useState(false)
  const [isTogglingExclusion, setIsTogglingExclusion] = useState(false)

  const handleDelete = async () => {
    if (!transaction || isDeleting) return
    setIsDeleting(true)
    setDeleteError(null)
    const result = await deleteTransaction(transaction.id)
    setIsDeleting(false)
    if (result.success) {
      setShowDeleteConfirm(false)
      onDeleted?.(transaction.id)
      onClose()
    } else {
      setDeleteError(result.error ?? 'Failed to delete transaction')
    }
  }

  const handleToggleExclusion = async () => {
    if (!transaction || isTogglingExclusion) return
    setIsTogglingExclusion(true)
    const newExcluded = !isExcluded
    const result = await toggleTransactionExclusion(transaction.id, newExcluded)
    setIsTogglingExclusion(false)
    if (result.success) {
      setIsExcluded(newExcluded)
      onExclusionToggled?.(transaction.id, newExcluded)
    }
  }

  useEffect(() => {
    setStudentRecord(null)
    setApplicationRecord(null)
    setUserRecord(null)
    setOpenApplication(null)
    setOpenParent(null)
    setOpenParentDetail(null)
    setOpenStudent(null)
    setShowTransactionSidebar(true)
    setShowDeleteConfirm(false)
    setIsDeleting(false)
    setDeleteError(null)
    setIsExcluded(transaction?.exclude_from_revenue ?? false)
    setIsTogglingExclusion(false)

    if (!transaction?.id) return
    if (transaction.payment_type === 'donation') return

    const load = async () => {
      const effectiveStudentId =
        transaction.student_id ?? (transaction.metadata?.student_id as string | null) ?? null
      const effectiveApplicationId =
        transaction.application_id ?? (transaction.metadata?.application_id as string | null) ?? null
      const effectiveParentId =
        transaction.parent_id ?? (transaction.metadata?.parent_id as string | null) ?? null

      const result = await getTransactionRelatedRecords({
        studentId: effectiveStudentId,
        applicationId: effectiveApplicationId,
        parentId: effectiveParentId,
      })

      if (result.student) setStudentRecord(result.student as StudentRecord)
      if (result.application) setApplicationRecord(result.application as ApplicationRecord)
      if (result.parent) setUserRecord(result.parent as UserRecord)
    }

    load()
  }, [transaction?.id])

  const handleOpenApplication = async () => {
    if (!applicationRecord || applicationLoading) return
    setApplicationLoading(true)
    const { createBrowserClient } = await import('@supabase/ssr')
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data } = await supabase
      .schema('parent_app')
      .from('applications')
      .select('*')
      .eq('id', applicationRecord.id)
      .single()
    setApplicationLoading(false)
    if (data) {
      setOpenApplication(data as FullApplication)
      setShowTransactionSidebar(false)
    }
  }

  const handleOpenParent = async () => {
    if (!userRecord || parentDetailLoading) return
    setParentDetailLoading(true)
    const result = await getParentDetail(userRecord.id)
    setParentDetailLoading(false)
    if (result.parent) {
      setOpenParent(result.parent as FullParent)
      setOpenParentDetail({
        children: result.children as ParentDetail['children'],
        applications: result.applications as ParentDetail['applications'],
      })
      setShowTransactionSidebar(false)
    }
  }

  const handleOpenStudent = async () => {
    if (!studentRecord || studentDetailLoading) return
    setStudentDetailLoading(true)
    const data = await getStudentDetail(studentRecord.id)
    setStudentDetailLoading(false)
    if (data) {
      setOpenStudent(data as FullStudent)
      setShowTransactionSidebar(false)
    }
  }

  const title = transaction
    ? transaction.payer_name ?? transaction.payer_email ?? formatPaymentType(transaction.payment_type)
    : ''

  const metadataIsEmpty =
    !transaction?.metadata ||
    Object.keys(transaction.metadata).length === 0

  const footer = (
    <div className="flex items-center gap-3">
      <button
        onClick={handleToggleExclusion}
        disabled={isTogglingExclusion}
        className="px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        style={{
          backgroundColor: 'transparent',
          border: isExcluded ? '1px solid #BBF7D0' : '1px solid #FED7AA',
          color: isExcluded ? '#16A34A' : '#D97706',
          borderRadius: '8px',
          cursor: isTogglingExclusion ? 'not-allowed' : 'pointer',
        }}
      >
        {isTogglingExclusion ? '...' : isExcluded ? 'Include in Revenue' : 'Exclude from Revenue'}
      </button>
      <button
        onClick={() => setShowDeleteConfirm(true)}
        className="px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors hover:bg-red-50"
        style={{
          backgroundColor: 'transparent',
          border: '1px solid #FECACA',
          color: '#DC2626',
          borderRadius: '8px',
          cursor: 'pointer',
        }}
      >
        Delete Transaction
      </button>
    </div>
  )

  return (
    <>
      {showDeleteConfirm && createPortal(
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{ zIndex: 60, backgroundColor: 'rgba(0,0,0,0.4)' }}
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="p-6 w-80"
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              border: '1px solid #E5E7EB',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-semibold mb-2 text-gray-800">
              Delete this transaction?
            </h2>
            <p className="text-sm mb-5 text-gray-500">
              This transaction will be hidden from the admin panel. The record is preserved and can be recovered from the database if needed.
            </p>
            {deleteError && (
              <p className="text-sm mb-3 text-red-600">{deleteError}</p>
            )}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                style={{
                  border: '1px solid #E5E7EB',
                  color: '#374151',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  borderRadius: '8px',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-3 py-1.5 text-sm font-semibold text-white rounded-lg transition-colors hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: '#DC2626',
                  border: 'none',
                  borderRadius: '8px',
                }}
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
      <DetailSidebar isOpen={!!transaction && showTransactionSidebar} onClose={onClose} title={title} footer={footer}>
        {transaction && (
          <div className="space-y-4">
            <SidebarSection title="Payment">
              <SidebarField label="Type" value={formatPaymentType(transaction.payment_type)} />
              <SidebarField label="Status" value={transaction.status} />
              {transaction.cover_fees ? (
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Base</span>
                    <span className="text-gray-800">{formatCents(transaction.intended_amount_cents, transaction.currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Processing fee</span>
                    <span className="text-gray-800">{formatCents(transaction.amount_cents - (transaction.intended_amount_cents ?? 0), transaction.currency)}</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t border-gray-100 pt-1.5">
                    <span className="text-gray-800">Total</span>
                    <span className="text-gray-800">{formatCents(transaction.amount_cents, transaction.currency)}</span>
                  </div>
                </div>
              ) : (
                <SidebarField label="Amount" value={formatCents(transaction.amount_cents, transaction.currency)} />
              )}
              <SidebarField label="Currency" value={transaction.currency.toUpperCase()} />
              <SidebarField label="Description" value={transaction.description} />
              <SidebarField label="Deleted" value={transaction.is_deleted ? 'Yes' : 'No'} />
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
              {stripeUrl(transaction) && (
                <a
                  href={stripeUrl(transaction)!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium"
                  style={{ color: colors.mistyForest }}
                >
                  View in Stripe Dashboard
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </SidebarSection>

            {studentRecord && (
              <SidebarSection title="Student">
                <button
                  onClick={handleOpenStudent}
                  disabled={studentDetailLoading}
                  style={{ backgroundColor: colors.pastelSage + '33' }}
                  className="w-full text-left rounded-xl px-4 py-3 hover:brightness-95 transition-all flex items-center gap-3 disabled:opacity-60 cursor-pointer"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: colors.pastelSage }}
                  >
                    <span className="text-xs font-semibold" style={{ color: colors.mistyForest }}>{getInitials(studentRecord.child_legal_name)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{studentRecord.child_legal_name ?? '—'}</p>
                    <p className="text-xs text-gray-500">
                      {studentRecord.dob_month && studentRecord.dob_day && studentRecord.dob_year
                        ? `DOB: ${studentRecord.dob_month}/${studentRecord.dob_day}/${studentRecord.dob_year}`
                        : 'No DOB'}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: colors.mistyForest }} />
                </button>
              </SidebarSection>
            )}

            {applicationRecord && (
              <SidebarSection title="Application">
                <button
                  onClick={handleOpenApplication}
                  disabled={applicationLoading}
                  style={{ backgroundColor: colors.powderBlue + '33' }}
                  className="w-full text-left rounded-xl px-4 py-3 hover:brightness-95 transition-all flex items-center gap-3 disabled:opacity-60 cursor-pointer"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{applicationRecord.child_legal_name ?? '—'}</p>
                    <p className="text-xs text-gray-500">{formatProgram(applicationRecord.program)}{applicationRecord.program === 'homeschool_drop_in' && applicationRecord.drop_in_program ? ` · Drop-In: ${formatProgram(applicationRecord.drop_in_program)}` : ''} · {applicationRecord.status}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: colors.infoText }} />
                </button>
              </SidebarSection>
            )}

            {userRecord && (
              <SidebarSection title="Parent">
                <button
                  onClick={handleOpenParent}
                  disabled={parentDetailLoading}
                  style={{ backgroundColor: colors.paleMarigold + '33' }}
                  className="w-full text-left rounded-xl px-4 py-3 hover:brightness-95 transition-all flex items-center gap-3 disabled:opacity-60 cursor-pointer"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: colors.paleMarigold }}
                  >
                    <span className="text-xs font-semibold" style={{ color: colors.warningText }}>{getInitials(userRecord.full_name)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{userRecord.full_name ?? '—'}</p>
                    <p className="text-xs text-gray-500">{userRecord.email ?? '—'}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: colors.warningText }} />
                </button>
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

      {openApplication && (
        <ApplicationDetailSidebar
          application={openApplication}
          onClose={() => { setOpenApplication(null); setShowTransactionSidebar(true) }}
          onApproved={() => {}}
          onDenied={() => {}}
          onDeactivated={() => {}}
          onItemClick={() => {}}
        />
      )}

      {(openParent || parentDetailLoading) && (
        <ParentDetailSidebar
          parent={openParent}
          detail={openParentDetail}
          loading={parentDetailLoading}
          onClose={() => { setOpenParent(null); setOpenParentDetail(null); setShowTransactionSidebar(true) }}
        />
      )}

      {(openStudent || studentDetailLoading) && (
        <StudentDetailSidebar
          student={openStudent}
          loading={studentDetailLoading}
          onClose={() => { setOpenStudent(null); setShowTransactionSidebar(true) }}
        />
      )}
    </>
  )
}
