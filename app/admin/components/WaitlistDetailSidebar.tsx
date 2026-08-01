'use client'

import { DetailSidebar } from './DetailSidebar'
import { StatusBadge } from './StatusBadge'
import { StatusDropdown } from './StatusDropdown'
import { LeadStatus } from '../../types/lead-status'
import { updateWaitlistStatus } from '../../actions/updateLeadStatus'
import { useState } from 'react'


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
  notes?: string | null
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
        <div className="mb-6">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 font-body mb-3 border-b border-gray-100 pb-2">
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
        <div className="mb-6">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 font-body mb-3 border-b border-gray-100 pb-2">
            Parent Information
          </h3>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-gray-400 font-body">Full Name</span>
              <span className="text-sm text-gray-800 font-body">{currentSubmission.parent_name}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-gray-400 font-body">Email Address</span>
              <a href={`mailto:${currentSubmission.email}`} className="text-sm text-[#2C5F2E] font-body hover:underline">
                {currentSubmission.email}
              </a>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-gray-400 font-body">Phone Number</span>
              <a href={`tel:${currentSubmission.phone}`} className="text-sm text-[#2C5F2E] font-body hover:underline">
                {currentSubmission.phone}
              </a>
            </div>
          </div>
        </div>

        {/* Child Information */}
        <div className="mb-6">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 font-body mb-3 border-b border-gray-100 pb-2">
            Child Information
          </h3>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-gray-400 font-body">Child&apos;s Name</span>
              <span className="text-sm text-gray-800 font-body">{currentSubmission.child_name}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-gray-400 font-body">Age</span>
              <span className="text-sm text-gray-800 font-body">
                {currentSubmission.child_age ? `${currentSubmission.child_age} years old` : 'Not specified'}
              </span>
            </div>
            {currentSubmission.preferred_start_date && (
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-gray-400 font-body">Preferred Start Date</span>
                <span className="text-sm text-gray-800 font-body">{currentSubmission.preferred_start_date}</span>
              </div>
            )}
          </div>
        </div>

        {/* Message/Additional Info */}
        {currentSubmission.notes && (
          <div className="mb-6">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 font-body mb-3 border-b border-gray-100 pb-2">
              Additional Information
            </h3>
            <p className="text-sm text-gray-800 font-body leading-relaxed whitespace-pre-wrap">
              {currentSubmission.notes}
            </p>
          </div>
        )}

        {/* Submission Date */}
        <div className="pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-400 font-body">
            Submitted on {formatDate(currentSubmission.created_at)} at {formatTime(currentSubmission.created_at)}
          </p>
        </div>
      </div>
    </DetailSidebar>
  )
}
