'use client'

import { DetailSidebar } from './DetailSidebar'
import { StatusBadge } from './StatusBadge'
import { StatusDropdown } from './StatusDropdown'
import { colors, radius, shadows, spacing } from '../design-system'
import { Merriweather } from 'next/font/google'
import { LeadStatus } from '../../types/lead-status'
import { updateWaitlistStatus } from '../../actions/updateLeadStatus'
import { useState } from 'react'

const merriweather = Merriweather({
  weight: ['300', '400', '700', '900'],
  subsets: ['latin'],
})

interface WaitlistSubmission {
  id: string
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

interface WaitlistDetailSidebarProps {
  submission: WaitlistSubmission | null
  onClose: () => void
}

export function WaitlistDetailSidebar({
  submission,
  onClose,
}: WaitlistDetailSidebarProps) {
  const [currentSubmission, setCurrentSubmission] = useState<WaitlistSubmission | null>(submission)

  // Update local state when submission prop changes
  if (submission?.id !== currentSubmission?.id) {
    setCurrentSubmission(submission)
  }

  if (!currentSubmission) return null

  const handleStatusUpdate = (newStatus: LeadStatus) => {
    // Update local state for immediate sidebar feedback
    setCurrentSubmission({ ...currentSubmission, status: newStatus })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  return (
    <DetailSidebar
      isOpen={!!currentSubmission}
      onClose={onClose}
      title="Waitlist Submission"
    >
      <div className="space-y-8">
        {/* Status Section */}
        <div>
          <h3
            className={`text-sm font-semibold mb-3 uppercase tracking-wide ${merriweather.className}`}
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
            onStatusChange={updateWaitlistStatus}
            onUpdate={handleStatusUpdate}
          />
        </div>

        {/* Parent Information */}
        <div>
          <h3
            className={`text-lg font-bold mb-4 ${merriweather.className}`}
            style={{ color: colors.mistyForest }}
          >
            Parent Information
          </h3>
          <div
            className="p-5 rounded-xl space-y-4"
            style={{
              backgroundColor: colors.softCloud,
              border: `1px solid ${colors.border}`,
            }}
          >
            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-wide mb-1"
                style={{ color: colors.textSecondary }}
              >
                Full Name
              </label>
              <p
                className="text-lg font-medium"
                style={{ color: colors.textPrimary }}
              >
                {currentSubmission.parent_name}
              </p>
            </div>
            <div className="pt-3" style={{ borderTop: `1px solid ${colors.divider}` }}>
              <label
                className="block text-xs font-semibold uppercase tracking-wide mb-1"
                style={{ color: colors.textSecondary }}
              >
                Email Address
              </label>
              <p className="text-base" style={{ color: colors.textPrimary }}>
                <a
                  href={`mailto:${currentSubmission.email}`}
                  className="hover:underline"
                  style={{ color: colors.mistyForest }}
                >
                  {currentSubmission.email}
                </a>
              </p>
            </div>
            <div className="pt-3" style={{ borderTop: `1px solid ${colors.divider}` }}>
              <label
                className="block text-xs font-semibold uppercase tracking-wide mb-1"
                style={{ color: colors.textSecondary }}
              >
                Phone Number
              </label>
              <p className="text-base" style={{ color: colors.textPrimary }}>
                <a
                  href={`tel:${currentSubmission.phone}`}
                  className="hover:underline"
                  style={{ color: colors.mistyForest }}
                >
                  {currentSubmission.phone}
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Child Information */}
        <div>
          <h3
            className={`text-lg font-bold mb-4 ${merriweather.className}`}
            style={{ color: colors.mistyForest }}
          >
            Child Information
          </h3>
          <div
            className="p-5 rounded-xl space-y-4"
            style={{
              backgroundColor: colors.softCloud,
              border: `1px solid ${colors.border}`,
            }}
          >
            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-wide mb-1"
                style={{ color: colors.textSecondary }}
              >
                Child's Name
              </label>
              <p
                className="text-lg font-medium"
                style={{ color: colors.textPrimary }}
              >
                {currentSubmission.child_name}
              </p>
            </div>
            <div className="pt-3" style={{ borderTop: `1px solid ${colors.divider}` }}>
              <label
                className="block text-xs font-semibold uppercase tracking-wide mb-1"
                style={{ color: colors.textSecondary }}
              >
                Age
              </label>
              <p className="text-base" style={{ color: colors.textPrimary }}>
                {currentSubmission.child_age ? `${currentSubmission.child_age} years old` : 'Not specified'}
              </p>
            </div>
            {currentSubmission.preferred_start_date && (
              <div className="pt-3" style={{ borderTop: `1px solid ${colors.divider}` }}>
                <label
                  className="block text-xs font-semibold uppercase tracking-wide mb-1"
                  style={{ color: colors.textSecondary }}
                >
                  Preferred Start Date
                </label>
                <p className="text-base" style={{ color: colors.textPrimary }}>
                  {currentSubmission.preferred_start_date}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Message/Additional Info */}
        {(currentSubmission.message || currentSubmission.additional_info) && (
          <div>
            <h3
              className={`text-lg font-bold mb-4 ${merriweather.className}`}
              style={{ color: colors.mistyForest }}
            >
              Additional Information
            </h3>
            <div
              className="p-5 rounded-xl"
              style={{
                backgroundColor: colors.softCloud,
                border: `1px solid ${colors.border}`,
              }}
            >
              <p
                className="text-base leading-relaxed whitespace-pre-wrap"
                style={{ color: colors.textPrimary }}
              >
                {currentSubmission.message || currentSubmission.additional_info}
              </p>
            </div>
          </div>
        )}

        {/* Submission Date */}
        <div
          className="pt-6"
          style={{ borderTop: `2px solid ${colors.divider}` }}
        >
          <h3
            className={`text-sm font-semibold mb-3 uppercase tracking-wide ${merriweather.className}`}
            style={{ color: colors.textSecondary }}
          >
            Submission Details
          </h3>
          <div className="space-y-2">
            <p className="text-base" style={{ color: colors.textPrimary }}>
              <span className="font-medium">Date:</span> {formatDate(currentSubmission.created_at)}
            </p>
            <p className="text-base" style={{ color: colors.textPrimary }}>
              <span className="font-medium">Time:</span> {formatTime(currentSubmission.created_at)}
            </p>
          </div>
        </div>
      </div>
    </DetailSidebar>
  )
}
