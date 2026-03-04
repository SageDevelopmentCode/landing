'use client'

import { DetailSidebar } from './DetailSidebar'
import { StatusBadge } from './StatusBadge'
import { StatusDropdown } from './StatusDropdown'
import { EmailThread } from './EmailThread'
import { colors, radius } from '../design-system'
import { LeadStatus } from '../../types/lead-status'
import { updateWaitlistStatus, updateContactStatus } from '../../actions/updateLeadStatus'
import { updateWaitlistLead, updateContactLead } from '../../actions/updateLeadFields'
import { useState, useEffect } from 'react'

type WaitlistLead = {
  id: string
  type: 'waitlist'
  parent_name: string
  email: string
  phone: string
  child_name: string
  child_age: number | null
  status: LeadStatus
  created_at: string
  notes?: string | null
}

type ContactLead = {
  id: string
  type: 'contact'
  name: string
  email: string
  phone: string
  message: string
  status: LeadStatus
  created_at: string
}

type Lead = WaitlistLead | ContactLead

interface LeadsDetailSidebarProps {
  submission: Lead | null
  onClose: () => void
  onLeadUpdate?: (leadId: string, newStatus: LeadStatus) => void
  onLeadFieldsUpdate?: (updatedLead: Lead) => void
}

const inputStyle = {
  backgroundColor: 'white',
  border: `1px solid ${colors.border}`,
  borderRadius: radius.md,
  color: colors.textPrimary,
  width: '100%',
  padding: '8px 10px',
  fontSize: '14px',
  outline: 'none',
}

const labelStyle = {
  display: 'block' as const,
  fontSize: '12px',
  fontWeight: 500,
  marginBottom: '4px',
  color: colors.textSecondary,
}

function buildDraft(sub: Lead): Record<string, string> {
  if (sub.type === 'waitlist') {
    return {
      parent_name: sub.parent_name ?? '',
      email: sub.email ?? '',
      phone: sub.phone ?? '',
      child_name: sub.child_name ?? '',
      child_age: sub.child_age != null ? String(sub.child_age) : '',
      notes: sub.notes ?? '',
    }
  } else {
    return {
      name: sub.name ?? '',
      email: sub.email ?? '',
      phone: sub.phone ?? '',
      message: sub.message ?? '',
    }
  }
}

export function LeadsDetailSidebar({
  submission,
  onClose,
  onLeadUpdate,
  onLeadFieldsUpdate,
}: LeadsDetailSidebarProps) {
  const [currentSubmission, setCurrentSubmission] = useState<Lead | null>(submission)
  const [draft, setDraft] = useState<Record<string, string>>(() =>
    submission ? buildDraft(submission) : {}
  )
  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Reset draft when a different lead is selected
  useEffect(() => {
    if (submission?.id !== currentSubmission?.id) {
      setCurrentSubmission(submission)
      setDraft(submission ? buildDraft(submission) : {})
      setIsDirty(false)
      setSaveError(null)
      setSaveSuccess(false)
    }
  }, [submission?.id])

  if (!currentSubmission) return null

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const isWaitlist = currentSubmission.type === 'waitlist'
  const isContact = currentSubmission.type === 'contact'

  const handleStatusUpdate = (newStatus: LeadStatus) => {
    setCurrentSubmission({ ...currentSubmission, status: newStatus })
    if (onLeadUpdate) {
      onLeadUpdate(currentSubmission.id, newStatus)
    }
  }

  const updateDraft = (key: string, value: string) => {
    const newDraft = { ...draft, [key]: value }
    setDraft(newDraft)

    // Compare against current saved state
    const baseline = buildDraft(currentSubmission)
    const dirty = Object.keys(baseline).some(
      (k) => newDraft[k] !== (baseline as Record<string, string>)[k]
    )
    setIsDirty(dirty)
    setSaveError(null)
    setSaveSuccess(false)
  }

  const handleSave = async () => {
    if (!isDirty || isSaving) return
    setIsSaving(true)
    setSaveError(null)

    let result
    let updatedLead: Lead

    if (isWaitlist && currentSubmission.type === 'waitlist') {
      result = await updateWaitlistLead(currentSubmission.id, {
        parent_name: draft.parent_name,
        email: draft.email,
        phone: draft.phone,
        child_name: draft.child_name,
        child_age: draft.child_age !== '' ? Number(draft.child_age) : null,
        notes: draft.notes || null,
      })
      updatedLead = {
        ...currentSubmission,
        parent_name: draft.parent_name,
        email: draft.email,
        phone: draft.phone,
        child_name: draft.child_name,
        child_age: draft.child_age !== '' ? Number(draft.child_age) : null,
        notes: draft.notes || null,
      }
    } else if (isContact && currentSubmission.type === 'contact') {
      result = await updateContactLead(currentSubmission.id, {
        name: draft.name,
        email: draft.email,
        phone: draft.phone,
        message: draft.message,
      })
      updatedLead = {
        ...currentSubmission,
        name: draft.name,
        email: draft.email,
        phone: draft.phone,
        message: draft.message,
      }
    } else {
      setIsSaving(false)
      return
    }

    setIsSaving(false)

    if (result.success) {
      setCurrentSubmission(updatedLead)
      setIsDirty(false)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)
      if (onLeadFieldsUpdate) onLeadFieldsUpdate(updatedLead)
    } else {
      setSaveError(result.error ?? 'Failed to save changes')
    }
  }

  const footer = (
    <div className="flex items-center gap-3">
      <div className="flex-1 text-sm">
        {saveError && <span style={{ color: '#dc2626' }}>{saveError}</span>}
        {saveSuccess && <span style={{ color: colors.mistyForest }}>Changes saved</span>}
      </div>
      <button
        disabled={!isDirty || isSaving}
        onClick={handleSave}
        className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-all duration-200"
        style={{
          backgroundColor: colors.mistyForest,
          borderRadius: radius.md,
          opacity: !isDirty || isSaving ? 0.4 : 1,
          cursor: !isDirty || isSaving ? 'not-allowed' : 'pointer',
          border: 'none',
        }}
      >
        {isSaving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  )

  return (
    <DetailSidebar
      isOpen={true}
      onClose={onClose}
      title={isWaitlist ? 'Waitlist Submission Details' : 'Contact Submission Details'}
      footer={footer}
    >
      <div className="space-y-5">
        {/* Status */}
        <div>
          <h3
            className="text-sm font-medium mb-3"
            style={{ color: colors.textSecondary }}
          >
            Current Status
          </h3>
          <div className="mb-3">
            <StatusBadge status={currentSubmission.status} />
          </div>
          <StatusDropdown
            currentStatus={currentSubmission.status}
            submissionId={currentSubmission.id}
            onStatusChange={isWaitlist ? updateWaitlistStatus : updateContactStatus}
            onUpdate={handleStatusUpdate}
          />
        </div>

        {/* Contact/Parent Information - Card Style */}
        <div
          className="p-4"
          style={{
            backgroundColor: colors.softCloud,
            borderRadius: radius.md,
            border: `1px solid ${colors.divider}`,
          }}
        >
          <h3
            className="text-sm font-semibold mb-3"
            style={{ color: colors.mistyForest }}
          >
            {isWaitlist ? 'Parent Information' : 'Contact Information'}
          </h3>
          <div className="space-y-3">
            <div>
              <label style={labelStyle}>Name</label>
              <input
                style={inputStyle}
                value={isWaitlist ? draft.parent_name : draft.name}
                onChange={(e) =>
                  updateDraft(isWaitlist ? 'parent_name' : 'name', e.target.value)
                }
              />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                style={inputStyle}
                value={draft.email}
                onChange={(e) => updateDraft('email', e.target.value)}
              />
            </div>
            <div>
              <label style={labelStyle}>Phone</label>
              <input
                type="tel"
                style={inputStyle}
                value={draft.phone}
                onChange={(e) => updateDraft('phone', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Waitlist-specific: Child Information - Card Style */}
        {isWaitlist && (
          <div
            className="p-4"
            style={{
              backgroundColor: colors.softCloud,
              borderRadius: radius.md,
              border: `1px solid ${colors.divider}`,
            }}
          >
            <h3
              className="text-sm font-semibold mb-3"
              style={{ color: colors.mistyForest }}
            >
              Child Information
            </h3>
            <div className="space-y-3">
              <div>
                <label style={labelStyle}>Child Name</label>
                <input
                  style={inputStyle}
                  value={draft.child_name}
                  onChange={(e) => updateDraft('child_name', e.target.value)}
                />
              </div>
              <div>
                <label style={labelStyle}>Age</label>
                <input
                  type="number"
                  style={inputStyle}
                  value={draft.child_age}
                  onChange={(e) => updateDraft('child_age', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Contact-specific: Message - Card Style */}
        {isContact && (
          <div
            className="p-4"
            style={{
              backgroundColor: colors.softCloud,
              borderRadius: radius.md,
              border: `1px solid ${colors.divider}`,
            }}
          >
            <h3
              className="text-sm font-semibold mb-3"
              style={{ color: colors.mistyForest }}
            >
              Message
            </h3>
            <textarea
              style={{ ...inputStyle, resize: 'vertical', minHeight: '80px' }}
              value={draft.message}
              onChange={(e) => updateDraft('message', e.target.value)}
            />
          </div>
        )}

        {/* Email Thread Section */}
        <div>
          <h3
            className="text-sm font-semibold mb-3"
            style={{ color: colors.mistyForest }}
          >
            Email History
          </h3>
          <EmailThread emailAddress={currentSubmission.email} />
        </div>

        {/* Submission Date - Simple, No Card */}
        <div className="pt-2" style={{ borderTop: `1px solid ${colors.divider}` }}>
          <p className="text-xs" style={{ color: colors.textSecondary }}>
            Submitted on {formatDate(currentSubmission.created_at)}
          </p>
        </div>
      </div>
    </DetailSidebar>
  )
}
