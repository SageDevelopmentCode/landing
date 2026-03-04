'use client'

import { DetailSidebar } from './DetailSidebar'
import { StatusBadge } from './StatusBadge'
import { StatusDropdown } from './StatusDropdown'
import { colors, radius } from '../design-system'
import { LeadStatus } from '../../types/lead-status'
import { updateWaitlistStatus, updateContactStatus } from '../../actions/updateLeadStatus'
import { useState } from 'react'

type WaitlistLead = {
  id: string
  type: 'waitlist'
  parent_name: string
  email: string
  phone: string
  child_name: string
  child_age: number | null
  preferred_start_date: string | null
  status: LeadStatus
  created_at: string
  message?: string | null
  additional_info?: string | null
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
}

export function LeadsDetailSidebar({
  submission,
  onClose,
}: LeadsDetailSidebarProps) {
  const [currentSubmission, setCurrentSubmission] = useState<Lead | null>(submission)

  // Update local state when submission prop changes
  if (submission?.id !== currentSubmission?.id) {
    setCurrentSubmission(submission)
  }

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

  const handleStatusUpdate = () => {
    // Force re-render by updating state
    setCurrentSubmission({ ...currentSubmission })
  }

  return (
    <DetailSidebar
      isOpen={true}
      onClose={onClose}
      title={isWaitlist ? 'Waitlist Submission Details' : 'Contact Submission Details'}
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
              <p className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>
                Name
              </p>
              <p className="font-medium" style={{ color: colors.textPrimary }}>
                {isWaitlist ? currentSubmission.parent_name : currentSubmission.name}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>
                Email
              </p>
              <a
                href={`mailto:${currentSubmission.email}`}
                className="font-medium hover:underline break-all"
                style={{ color: colors.mistyForest }}
              >
                {currentSubmission.email}
              </a>
            </div>
            <div>
              <p className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>
                Phone
              </p>
              <a
                href={`tel:${currentSubmission.phone}`}
                className="font-medium hover:underline"
                style={{ color: colors.mistyForest }}
              >
                {currentSubmission.phone}
              </a>
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
                <p className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>
                  Child Name
                </p>
                <p
                  className="font-medium"
                  style={{ color: colors.textPrimary }}
                >
                  {currentSubmission.child_name}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>
                  Age
                </p>
                <p
                  className="font-medium"
                  style={{ color: colors.textPrimary }}
                >
                  {currentSubmission.child_age || 'Not specified'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>
                  Preferred Start Date
                </p>
                <p
                  className="font-medium"
                  style={{ color: colors.textPrimary }}
                >
                  {currentSubmission.preferred_start_date || 'Not specified'}
                </p>
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
            <p
              className="whitespace-pre-wrap text-sm leading-relaxed"
              style={{ color: colors.textPrimary }}
            >
              {currentSubmission.message}
            </p>
          </div>
        )}

        {/* Waitlist-specific: Additional Information - Card Style */}
        {isWaitlist && (currentSubmission.message || currentSubmission.additional_info) && (
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
              Additional Information
            </h3>
            <p
              className="whitespace-pre-wrap text-sm leading-relaxed"
              style={{ color: colors.textPrimary }}
            >
              {currentSubmission.message || currentSubmission.additional_info}
            </p>
          </div>
        )}

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
