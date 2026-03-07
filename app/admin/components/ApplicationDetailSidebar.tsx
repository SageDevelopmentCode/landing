'use client'

import { DetailSidebar } from './DetailSidebar'
import { approveApplication } from '../../actions/approveApplication'
import { denyApplication } from '../../actions/denyApplication'
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

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div>
      <p className="text-xs text-gray-400 font-body mb-0.5">{label}</p>
      {value != null && value !== '' ? (
        <p className="text-sm text-gray-800 font-body">{value}</p>
      ) : (
        <p className="text-sm text-gray-400 font-body italic">—</p>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-5 py-4 shadow-sm">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 font-body border-b border-gray-100 pb-2 mb-3">
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

type CriterionResult = {
  label: string
  passed: boolean
  optional?: boolean
}

function evaluateCriteria(app: Application): CriterionResult[] {
  return [
    {
      label: 'Child Identity',
      passed: !!(app.child_legal_name && app.dob_month && app.dob_day && app.dob_year),
    },
    {
      label: 'Grade & Program',
      passed: !!(app.child_grade && app.program),
    },
    {
      label: 'Contact Info',
      passed: !!(app.g1_full_name && app.g1_email && app.g1_cell_phone),
    },
    {
      label: 'Address',
      passed: !!(app.address_street && app.address_city && app.address_state && app.address_zip),
    },
    {
      label: 'Health Disclosed',
      passed: app.has_allergies != null && app.has_medical_conditions != null && app.has_emergency_medications != null,
    },
    {
      label: 'Learning Profile',
      passed: !!(app.learning_style && app.strengths_interests && app.current_challenges),
    },
    {
      label: 'Safety & Support',
      passed: app.needs_aide != null && app.history_flags != null,
    },
    {
      label: 'Guardian 2',
      passed: !!(app.g2_full_name && app.g2_email),
      optional: true,
    },
  ]
}

function ApplicationSummary({ application }: { application: Application }) {
  const criteria = evaluateCriteria(application)
  const required = criteria.filter((c) => !c.optional)
  const total = required.length
  const passedCount = required.filter((c) => c.passed).length
  const progressPct = Math.round((passedCount / total) * 100)

  let badgeClass: string
  let badgeLabel: string

  if (passedCount >= total) {
    badgeClass = 'bg-green-50 text-green-700 border border-green-200'
    badgeLabel = 'Looks Complete'
  } else if (passedCount >= 5) {
    badgeClass = 'bg-amber-50 text-amber-700 border border-amber-200'
    badgeLabel = 'Some Gaps'
  } else {
    badgeClass = 'bg-red-50 text-red-600 border border-red-200'
    badgeLabel = 'Incomplete'
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl px-5 py-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold uppercase tracking-widest text-gray-400 font-body">
          Application Summary
        </span>
        <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full ${badgeClass}`}>
          {badgeLabel}
        </span>
      </div>

      {/* Score */}
      <div className="flex flex-col items-center mb-4">
        <span className="font-heading text-3xl font-bold" style={{ color: '#2C5F2E' }}>
          {passedCount} <span className="text-gray-300 font-normal">/</span> {total}
        </span>
        <span className="text-xs text-gray-400 font-body mt-0.5">criteria met</span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-100 rounded-full h-1.5 mb-4">
        <div
          className="h-1.5 rounded-full transition-all"
          style={{ width: `${progressPct}%`, backgroundColor: '#2C5F2E' }}
        />
      </div>

      {/* Criteria rows */}
      <div className="space-y-2">
        {criteria.map((c) => {
          const dotColor = c.passed ? 'bg-green-500' : c.optional ? 'bg-amber-400' : 'bg-red-400'
          const pillClass = c.passed
            ? 'bg-green-50 text-green-700 border border-green-200'
            : c.optional
            ? 'bg-amber-50 text-amber-700 border border-amber-200'
            : 'bg-red-50 text-red-600 border border-red-200'
          const pillLabel = c.passed ? 'Complete' : c.optional ? 'Optional' : 'Missing'

          return (
            <div key={c.label} className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`} />
              <span className="text-sm text-gray-700 font-body flex-1">{c.label}</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${pillClass}`}>
                {pillLabel}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
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

  const footer = isDenyingMode ? (
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
        {application.approved && (
          <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-green-50 text-green-700 border border-green-200">
            Approved {application.approved_at ? `on ${new Date(application.approved_at).toLocaleDateString()}` : ''}
          </span>
        )}
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
        <ApplicationSummary application={application} />

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
