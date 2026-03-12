'use client'

import { DetailSidebar } from './DetailSidebar'
import { StatusBadge } from './StatusBadge'
import { StatusDropdown } from './StatusDropdown'
import { LeadStatus } from '../../types/lead-status'
import { updateContactStatus } from '../../actions/updateLeadStatus'
import { useState } from 'react'


interface ContactSubmission {
  id: string
  name: string
  email: string
  phone: string
  message: string
  status: LeadStatus
  created_at: string
}

interface ContactDetailSidebarProps {
  submission: ContactSubmission | null
  onClose: () => void
}

export function ContactDetailSidebar({
  submission,
  onClose,
}: ContactDetailSidebarProps) {
  const [currentSubmission, setCurrentSubmission] = useState<ContactSubmission | null>(submission)

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
      title="Contact Submission"
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
            onStatusChange={updateContactStatus}
            onUpdate={handleStatusUpdate}
          />
        </div>

        {/* Contact Information */}
        <div className="mb-6">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 font-body mb-3 border-b border-gray-100 pb-2">
            Contact Information
          </h3>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-gray-400 font-body">Full Name</span>
              <span className="text-sm text-gray-800 font-body">{currentSubmission.name}</span>
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

        {/* Message */}
        <div className="mb-6">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 font-body mb-3 border-b border-gray-100 pb-2">
            Message
          </h3>
          <p className="text-sm text-gray-800 font-body leading-relaxed whitespace-pre-wrap">
            {currentSubmission.message}
          </p>
        </div>

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
