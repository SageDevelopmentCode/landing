'use client'

import { DetailSidebar } from './DetailSidebar'
import { StatusBadge } from './StatusBadge'
import { colors } from '../design-system'

type WaitlistLead = {
  id: string
  type: 'waitlist'
  parent_name: string
  email: string
  phone: string
  child_name: string
  child_age: number | null
  preferred_start_date: string | null
  status: string
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
  status: string
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
  if (!submission) return null

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

  const isWaitlist = submission.type === 'waitlist'
  const isContact = submission.type === 'contact'

  return (
    <DetailSidebar
      isOpen={true}
      onClose={onClose}
      title={isWaitlist ? 'Waitlist Submission Details' : 'Contact Submission Details'}
    >
      <div className="space-y-6">
        {/* Status */}
        <div>
          <h3
            className="text-sm font-medium mb-2"
            style={{ color: colors.textSecondary }}
          >
            Current Status
          </h3>
          <StatusBadge
            status={(submission.status || 'pending') as any}
            type={submission.type}
          />
        </div>

        {/* Contact/Parent Information */}
        <div>
          <h3
            className="text-sm font-medium mb-3"
            style={{ color: colors.textSecondary }}
          >
            {isWaitlist ? 'Parent Information' : 'Contact Information'}
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                Name
              </p>
              <p className="font-medium" style={{ color: colors.textPrimary }}>
                {isWaitlist ? submission.parent_name : submission.name}
              </p>
            </div>
            <div>
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                Email
              </p>
              <a
                href={`mailto:${submission.email}`}
                className="font-medium hover:underline"
                style={{ color: colors.mistyForest }}
              >
                {submission.email}
              </a>
            </div>
            <div>
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                Phone
              </p>
              <a
                href={`tel:${submission.phone}`}
                className="font-medium hover:underline"
                style={{ color: colors.mistyForest }}
              >
                {submission.phone}
              </a>
            </div>
          </div>
        </div>

        {/* Waitlist-specific: Child Information */}
        {isWaitlist && (
          <div>
            <h3
              className="text-sm font-medium mb-3"
              style={{ color: colors.textSecondary }}
            >
              Child Information
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm" style={{ color: colors.textSecondary }}>
                  Child Name
                </p>
                <p
                  className="font-medium"
                  style={{ color: colors.textPrimary }}
                >
                  {submission.child_name}
                </p>
              </div>
              <div>
                <p className="text-sm" style={{ color: colors.textSecondary }}>
                  Age
                </p>
                <p
                  className="font-medium"
                  style={{ color: colors.textPrimary }}
                >
                  {submission.child_age || 'Not specified'}
                </p>
              </div>
              <div>
                <p className="text-sm" style={{ color: colors.textSecondary }}>
                  Preferred Start Date
                </p>
                <p
                  className="font-medium"
                  style={{ color: colors.textPrimary }}
                >
                  {submission.preferred_start_date || 'Not specified'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Contact-specific: Message */}
        {isContact && (
          <div>
            <h3
              className="text-sm font-medium mb-3"
              style={{ color: colors.textSecondary }}
            >
              Message
            </h3>
            <p
              className="whitespace-pre-wrap"
              style={{ color: colors.textPrimary }}
            >
              {submission.message}
            </p>
          </div>
        )}

        {/* Waitlist-specific: Additional Information */}
        {isWaitlist && (submission.message || submission.additional_info) && (
          <div>
            <h3
              className="text-sm font-medium mb-3"
              style={{ color: colors.textSecondary }}
            >
              Additional Information
            </h3>
            <p
              className="whitespace-pre-wrap"
              style={{ color: colors.textPrimary }}
            >
              {submission.message || submission.additional_info}
            </p>
          </div>
        )}

        {/* Submission Details */}
        <div>
          <h3
            className="text-sm font-medium mb-3"
            style={{ color: colors.textSecondary }}
          >
            Submission Details
          </h3>
          <div className="space-y-2">
            <div>
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                Submitted on
              </p>
              <p
                className="font-medium"
                style={{ color: colors.textPrimary }}
              >
                {formatDate(submission.created_at)}
              </p>
            </div>
            <div>
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                Submission ID
              </p>
              <p className="font-mono text-sm" style={{ color: colors.textPrimary }}>
                {submission.id}
              </p>
            </div>
          </div>
        </div>
      </div>
    </DetailSidebar>
  )
}
