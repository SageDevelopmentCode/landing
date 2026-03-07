'use client'

import { DetailSidebar } from './DetailSidebar'
import { colors, radius } from '../design-system'
import { approveApplication } from '../../actions/approveApplication'
import { useState } from 'react'

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
  household_phone: string | null
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
  status: string
  approved: boolean
  approved_at: string | null
  created_at: string | null
  [key: string]: unknown
}

interface ApplicationDetailSidebarProps {
  application: Application | null
  onClose: () => void
  onApproved: (id: string) => void
}

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div>
      <p className="text-xs font-medium mb-0.5" style={{ color: colors.textSecondary }}>{label}</p>
      <p className="text-sm" style={{ color: value ? colors.textPrimary : colors.textTertiary }}>
        {value ?? '—'}
      </p>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="p-4"
      style={{
        backgroundColor: colors.softCloud,
        borderRadius: radius.md,
        border: `1px solid ${colors.divider}`,
      }}
    >
      <h3 className="text-sm font-semibold mb-3" style={{ color: colors.mistyForest }}>{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

export function ApplicationDetailSidebar({
  application,
  onClose,
  onApproved,
}: ApplicationDetailSidebarProps) {
  const [isApproving, setIsApproving] = useState(false)
  const [approveError, setApproveError] = useState<string | null>(null)

  if (!application) return null

  const handleApprove = async () => {
    if (isApproving || application.approved) return
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

  const footer = (
    <div className="flex items-center gap-3">
      <div className="flex-1 text-sm">
        {approveError && <span style={{ color: '#dc2626' }}>{approveError}</span>}
        {application.approved && (
          <span
            className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full"
            style={{ backgroundColor: colors.success, color: colors.successText }}
          >
            Approved {application.approved_at ? `on ${new Date(application.approved_at).toLocaleDateString()}` : ''}
          </span>
        )}
      </div>
      <button
        onClick={handleApprove}
        disabled={isApproving || application.approved}
        className="px-4 py-2 text-sm font-medium text-white transition-all duration-200"
        style={{
          backgroundColor: application.approved ? colors.pastelSage : colors.mistyForest,
          borderRadius: radius.md,
          border: 'none',
          opacity: isApproving ? 0.6 : 1,
          cursor: isApproving || application.approved ? 'not-allowed' : 'pointer',
        }}
      >
        {isApproving ? 'Approving...' : application.approved ? 'Approved' : 'Approve'}
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
        <Section title="Parent Info">
          <Field label="Full Name" value={application.g1_full_name} />
          <Field label="Email" value={application.g1_email} />
        </Section>

        <Section title="Child Info">
          <Field label="Legal Name" value={application.child_legal_name} />
          <Field label="Preferred Name" value={application.preferred_name} />
          <Field
            label="Date of Birth"
            value={
              application.dob_month && application.dob_day && application.dob_year
                ? `${application.dob_month}/${application.dob_day}/${application.dob_year}`
                : null
            }
          />
          <Field label="Age" value={application.child_age} />
          <Field label="Grade" value={application.child_grade} />
          <Field label="Program" value={formatProgram(application.program)} />
          <Field label="Household Phone" value={application.household_phone} />
        </Section>

        <Section title="Address">
          <Field label="Street" value={application.address_street} />
          <Field label="City" value={application.address_city} />
          <Field label="State" value={application.address_state} />
          <Field label="ZIP" value={application.address_zip} />
        </Section>

        <Section title="Health">
          <Field label="Has Allergies" value={application.has_allergies != null ? (application.has_allergies ? 'Yes' : 'No') : null} />
          <Field label="Allergies Description" value={application.allergies_description} />
          <Field label="Has Medical Conditions" value={application.has_medical_conditions != null ? (application.has_medical_conditions ? 'Yes' : 'No') : null} />
          <Field label="Medical Conditions Description" value={application.medical_conditions_description} />
          <Field label="Has Emergency Medications" value={application.has_emergency_medications != null ? (application.has_emergency_medications ? 'Yes' : 'No') : null} />
          <Field label="Emergency Medications Description" value={application.emergency_medications_description} />
          <Field label="Needs Aide" value={application.needs_aide != null ? (application.needs_aide ? 'Yes' : 'No') : null} />
          <Field label="Aide Description" value={application.needs_aide_description} />
          <Field label="Activities to Avoid" value={application.activities_to_avoid} />
          <Field label="Dysregulation Response" value={application.dysregulation_response} />
          <Field label="Regulation Strategies" value={application.regulation_strategies} />
          <Field label="History Flags" value={application.history_flags} />
          <Field label="History Explanation" value={application.history_explanation} />
          <Field label="Has Custody Orders" value={application.has_custody_orders != null ? (application.has_custody_orders ? 'Yes' : 'No') : null} />
          <Field label="Custody Orders Description" value={application.custody_orders_description} />
        </Section>

        <Section title="Background">
          <Field label="Previously Homeschooled" value={application.is_homeschooled} />
          <Field label="Homeschool Explanation" value={application.homeschool_explanation} />
          <Field label="Previous Schools" value={application.previous_schools} />
          <Field label="Previous Schools List" value={application.previous_schools_list} />
          <Field label="Special Interests" value={application.special_interests} />
          <Field label="Learning Style" value={application.learning_style} />
          <Field label="Strengths & Interests" value={application.strengths_interests} />
          <Field label="Current Challenges" value={application.current_challenges} />
        </Section>

        <Section title="Guardian 1">
          <Field label="Name" value={application.g1_full_name} />
          <Field label="Relationship" value={application.g1_relationship} />
          <Field label="Cell Phone" value={application.g1_cell_phone} />
          <Field label="Work Phone" value={application.g1_work_phone} />
          <Field label="Email" value={application.g1_email} />
          <Field label="Has Custody" value={application.g1_has_custody != null ? (application.g1_has_custody ? 'Yes' : 'No') : null} />
          <Field label="Lives with Child" value={application.g1_lives_with_child != null ? (application.g1_lives_with_child ? 'Yes' : 'No') : null} />
          <Field label="Preferred Contact" value={application.g1_preferred_contact != null ? (application.g1_preferred_contact ? 'Yes' : 'No') : null} />
        </Section>

        <Section title="Guardian 2">
          <Field label="Name" value={application.g2_full_name} />
          <Field label="Relationship" value={application.g2_relationship} />
          <Field label="Cell Phone" value={application.g2_cell_phone} />
          <Field label="Work Phone" value={application.g2_work_phone} />
          <Field label="Email" value={application.g2_email} />
          <Field label="Has Custody" value={application.g2_has_custody != null ? (application.g2_has_custody ? 'Yes' : 'No') : null} />
          <Field label="Lives with Child" value={application.g2_lives_with_child != null ? (application.g2_lives_with_child ? 'Yes' : 'No') : null} />
          <Field label="Preferred Contact" value={application.g2_preferred_contact != null ? (application.g2_preferred_contact ? 'Yes' : 'No') : null} />
        </Section>

        <div className="pt-2" style={{ borderTop: `1px solid ${colors.divider}` }}>
          <p className="text-xs" style={{ color: colors.textSecondary }}>
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
