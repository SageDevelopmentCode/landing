'use client'

import { DetailSidebar } from './DetailSidebar'
import { SidebarField, SidebarSection } from '../../components/SidebarPrimitives'
import { approveApplication } from '../../actions/approveApplication'
import { denyApplication } from '../../actions/denyApplication'
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { getAdminEnrollmentData, type AdminEnrollmentData } from '../../actions/getAdminEnrollmentData'
import { EnrollmentProgressCard, type ApprovedApplication } from './EnrollmentProgressCard'

type CachedEnrollmentData = AdminEnrollmentData & {
  registrationFeePaidByStudent: Record<string, boolean>
  siblingApps: ApprovedApplication[]
}
const enrollmentCache = new Map<string, CachedEnrollmentData>()

const PROGRAM_LABELS: Record<string, string> = {
  summer_26: 'Summer 2026',
  school_year_26_27: 'School Year 2026-2027',
  both: 'Both',
}

function formatProgram(value: string | null): string {
  if (!value) return '—'
  return PROGRAM_LABELS[value] ?? value
}

type Application = {
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
  status: string
  approved: boolean
  approved_at: string | null
  denied: boolean
  denied_at: string | null
  denied_reason: string | null
  created_at: string | null
  [key: string]: unknown
}

interface ApplicationDetailSidebarProps {
  application: Application | null
  onClose: () => void
  onApproved: (id: string) => void
  onDenied: (id: string, reason: string) => void
}



export function ApplicationDetailSidebar({
  application,
  onClose,
  onApproved,
  onDenied,
}: ApplicationDetailSidebarProps) {
  const [isApproving, setIsApproving] = useState(false)
  const [approveError, setApproveError] = useState<string | null>(null)
  const [isDenyingMode, setIsDenyingMode] = useState(false)
  const [denyReason, setDenyReason] = useState('')
  const [isDenying, setIsDenying] = useState(false)
  const [denyError, setDenyError] = useState<string | null>(null)
  const [enrollmentData, setEnrollmentData] = useState<AdminEnrollmentData & { registrationFeePaidByStudent: Record<string, boolean> } | null>(null)
  const [enrollmentLoading, setEnrollmentLoading] = useState(false)
  const [siblingApps, setSiblingApps] = useState<ApprovedApplication[]>([])

  useEffect(() => {
    if (!application?.approved) {
      setEnrollmentData(null)
      setSiblingApps([])
      return
    }

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const load = async () => {
      // Cache hit — use immediately, no loading state
      const cached = enrollmentCache.get(application.user_id)
      if (cached) {
        setSiblingApps(cached.siblingApps)
        setEnrollmentData(cached)
        return
      }

      setEnrollmentLoading(true)
      try {
        const { data: appRows } = await supabase
          .schema('parent_app')
          .from('applications')
          .select('id, user_id, student_id, child_legal_name, preferred_name, registration_fee_paid')
          .eq('user_id', application.user_id)
          .eq('approved', true)

        const validApps: ApprovedApplication[] = (appRows ?? []).filter(
          (a): a is ApprovedApplication => a.student_id != null
        )

        const studentIds = validApps.map((a) => a.student_id)

        if (studentIds.length === 0) {
          const result: CachedEnrollmentData = {
            signaturesByStudent: {},
            immunizationFileCountByStudent: {},
            religiousExemptionCountByStudent: {},
            registrationFeePaidByStudent: {},
            siblingApps: validApps,
          }
          enrollmentCache.set(application.user_id, result)
          setSiblingApps(validApps)
          setEnrollmentData(result)
          setEnrollmentLoading(false)
          return
        }

        const registrationFeePaidByStudent: Record<string, boolean> = {}
        for (const a of validApps) {
          registrationFeePaidByStudent[a.student_id] = a.registration_fee_paid ?? false
        }

        const data = await getAdminEnrollmentData(application.user_id, studentIds)
        const result = { ...data, registrationFeePaidByStudent, siblingApps: validApps }
        enrollmentCache.set(application.user_id, result)
        setEnrollmentData(result)
        setSiblingApps(validApps)
      } catch (err) {
        console.error('Failed to load enrollment data', err)
        setEnrollmentData(null)
      } finally {
        setEnrollmentLoading(false)
      }
    }

    load()
  }, [application?.id, application?.approved, application?.user_id])

  if (!application) return null

  const isActioned = application.approved || application.denied

  const handleApprove = async () => {
    if (isApproving || isActioned) return
    setIsApproving(true)
    setApproveError(null)
    const result = await approveApplication(application.id)
    setIsApproving(false)
    if (result.success) {
      onApproved(application.id)
    } else {
      setApproveError(result.error ?? 'Failed to approve')
    }
  }

  const handleDenyConfirm = async () => {
    if (isDenying || !denyReason.trim()) return
    setIsDenying(true)
    setDenyError(null)
    const result = await denyApplication(application.id, denyReason.trim())
    setIsDenying(false)
    if (result.success) {
      onDenied(application.id, denyReason.trim())
      setIsDenyingMode(false)
      setDenyReason('')
    } else {
      setDenyError(result.error ?? 'Failed to deny')
    }
  }

  const footer = application.approved ? undefined : isDenyingMode ? (
    <div className="flex flex-col gap-3 w-full">
      <textarea
        value={denyReason}
        onChange={(e) => setDenyReason(e.target.value)}
        placeholder="Enter reason for denial..."
        rows={3}
        className="w-full text-sm resize-none border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#2C5F2E]/30 focus:border-[#2C5F2E] bg-gray-50"
      />
      {denyError && <span className="text-xs text-red-600">{denyError}</span>}
      <div className="flex gap-2 justify-end">
        <button
          onClick={() => { setIsDenyingMode(false); setDenyReason(''); setDenyError(null) }}
          className="border border-gray-200 text-gray-600 rounded-lg px-3 py-1.5 text-sm hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleDenyConfirm}
          disabled={isDenying || !denyReason.trim()}
          className="bg-red-600 text-white rounded-lg px-4 py-1.5 text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDenying ? 'Denying...' : 'Confirm Deny'}
        </button>
      </div>
    </div>
  ) : (
    <div className="flex items-center gap-3">
      <div className="flex-1 text-sm">
        {approveError && <span className="text-red-600">{approveError}</span>}
        {application.denied && (
          <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-red-50 text-red-600 border border-red-200">
            Denied {application.denied_at ? `on ${new Date(application.denied_at).toLocaleDateString()}` : ''}
          </span>
        )}
      </div>
      <button
        onClick={() => setIsDenyingMode(true)}
        disabled={isActioned}
        className="border border-red-200 text-red-600 rounded-lg px-3 py-1.5 text-sm font-semibold hover:bg-red-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {application.denied ? 'Denied' : 'Deny'}
      </button>
      <button
        onClick={handleApprove}
        disabled={isApproving || isActioned}
        className="bg-[#2C5F2E] text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-[#234d25] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isApproving ? 'Approving...' : 'Approve'}
      </button>
    </div>
  )

  return (
    <DetailSidebar
      isOpen={true}
      onClose={onClose}
      title="Application Details"
      footer={footer}
    >
      <div className="space-y-4">
        <SidebarSection title="Parent Info">
          <SidebarField label="Full Name" value={application.g1_full_name} />
          <SidebarField label="Email" value={application.g1_email} />
        </SidebarSection>

        <SidebarSection title="Child Info">
          <SidebarField label="Legal Name" value={application.child_legal_name} />
          <SidebarField label="Preferred Name" value={application.preferred_name} />
          <SidebarField
            label="Date of Birth"
            value={
              application.dob_month && application.dob_day && application.dob_year
                ? `${application.dob_month}/${application.dob_day}/${application.dob_year}`
                : null
            }
          />
          <SidebarField label="Age" value={application.child_age} />
          <SidebarField label="Grade" value={application.child_grade} />
          <SidebarField label="Program" value={formatProgram(application.program)} />
        </SidebarSection>

        <SidebarSection title="Address">
          <SidebarField label="Street" value={application.address_street} />
          <SidebarField label="City" value={application.address_city} />
          <SidebarField label="State" value={application.address_state} />
          <SidebarField label="ZIP" value={application.address_zip} />
        </SidebarSection>

        <SidebarSection title="Health">
          <SidebarField label="Has Allergies" value={application.has_allergies} />
          <SidebarField label="Allergies Description" value={application.allergies_description} />
          <SidebarField label="Has Medical Conditions" value={application.has_medical_conditions} />
          <SidebarField label="Medical Conditions Description" value={application.medical_conditions_description} />
          <SidebarField label="Has Emergency Medications" value={application.has_emergency_medications} />
          <SidebarField label="Emergency Medications Description" value={application.emergency_medications_description} />
          <SidebarField label="Needs Aide" value={application.needs_aide} />
          <SidebarField label="Aide Description" value={application.needs_aide_description} />
          <SidebarField label="Activities to Avoid" value={application.activities_to_avoid} />
          <SidebarField label="Dysregulation Response" value={application.dysregulation_response} />
          <SidebarField label="Regulation Strategies" value={application.regulation_strategies} />
          <SidebarField label="History Flags" value={application.history_flags} />
          <SidebarField label="History Explanation" value={application.history_explanation} />
          <SidebarField label="Has Custody Orders" value={application.has_custody_orders} />
          <SidebarField label="Custody Orders Description" value={application.custody_orders_description} />
        </SidebarSection>

        <SidebarSection title="Background">
          <SidebarField label="Previously Homeschooled" value={application.is_homeschooled} />
          <SidebarField label="Homeschool Explanation" value={application.homeschool_explanation} />
          <SidebarField label="Previous Schools" value={application.previous_schools} />
          <SidebarField label="Previous Schools List" value={application.previous_schools_list} />
          <SidebarField label="Special Interests" value={application.special_interests} />
          <SidebarField label="Learning Style" value={application.learning_style} />
          <SidebarField label="Strengths & Interests" value={application.strengths_interests} />
          <SidebarField label="Current Challenges" value={application.current_challenges} />
        </SidebarSection>

        <SidebarSection title="Guardian 1">
          <SidebarField label="Name" value={application.g1_full_name} />
          <SidebarField label="Relationship" value={application.g1_relationship} />
          <SidebarField label="Cell Phone" value={application.g1_cell_phone} />
          <SidebarField label="Work Phone" value={application.g1_work_phone} />
          <SidebarField label="Email" value={application.g1_email} />
          <SidebarField label="Has Custody" value={application.g1_has_custody} />
          <SidebarField label="Lives with Child" value={application.g1_lives_with_child} />
          <SidebarField label="Preferred Contact" value={application.g1_preferred_contact} />
        </SidebarSection>

        <SidebarSection title="Guardian 2">
          <SidebarField label="Name" value={application.g2_full_name} />
          <SidebarField label="Relationship" value={application.g2_relationship} />
          <SidebarField label="Cell Phone" value={application.g2_cell_phone} />
          <SidebarField label="Work Phone" value={application.g2_work_phone} />
          <SidebarField label="Email" value={application.g2_email} />
          <SidebarField label="Has Custody" value={application.g2_has_custody} />
          <SidebarField label="Lives with Child" value={application.g2_lives_with_child} />
          <SidebarField label="Preferred Contact" value={application.g2_preferred_contact} />
        </SidebarSection>

        {application.approved && (
          enrollmentLoading ? (
            <div className="space-y-3">
              {/* Header card skeleton */}
              <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-sm animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/4 mb-3" />
                <div className="h-2 bg-gray-200 rounded-full w-full" />
              </div>
              {/* Checklist row skeletons — 5 rows */}
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-sm animate-pulse flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-gray-200 rounded w-3/4" />
                    <div className="h-2.5 bg-gray-100 rounded w-1/2" />
                  </div>
                  <div className="h-5 w-16 bg-gray-200 rounded-full flex-shrink-0" />
                </div>
              ))}
            </div>
          ) : enrollmentData ? (
            <EnrollmentProgressCard
              apps={siblingApps}
              signaturesByStudent={enrollmentData.signaturesByStudent}
              immunizationFileCountByStudent={enrollmentData.immunizationFileCountByStudent}
              registrationFeePaidByStudent={enrollmentData.registrationFeePaidByStudent}
              initialActiveStudentId={application.student_id ?? undefined}
            />
          ) : null
        )}

        <div className="pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-400 font-body">
            Submitted on{' '}
            {application.created_at
              ? new Date(application.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '—'}
          </p>
        </div>
      </div>
    </DetailSidebar>
  )
}
