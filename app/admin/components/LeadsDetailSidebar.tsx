'use client'

import { DetailSidebar } from './DetailSidebar'
import { StatusBadge } from './StatusBadge'
import { StatusDropdown } from './StatusDropdown'
import { EmailThread } from './EmailThread'
import { LeadStatus } from '../../types/lead-status'
import { updateWaitlistStatus, updateContactStatus } from '../../actions/updateLeadStatus'
import { updateWaitlistLead, updateContactLead, updateCallNotes } from '../../actions/updateLeadFields'
import { deleteWaitlistLead, deleteContactLead } from '../../actions/deleteLead'
import { TagEditor } from './TagEditor'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

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
  special_interests?: string | null
  call_notes?: string | null
  tags?: string[]
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
  call_notes?: string | null
  tags?: string[]
}

type Lead = WaitlistLead | ContactLead

interface LeadsDetailSidebarProps {
  submission: Lead | null
  onClose: () => void
  onLeadUpdate?: (leadId: string, newStatus: LeadStatus) => void
  onLeadFieldsUpdate?: (updatedLead: Lead) => void
  onLeadDeleted?: (leadId: string) => void
  onTagsUpdate?: (leadId: string, newTags: string[]) => void
}

const inputStyle = {
  backgroundColor: '#F9FAFB',
  border: '1px solid #E5E7EB',
  borderRadius: '8px',
  color: '#1F2937',
  width: '100%',
  padding: '6px 12px',
  fontSize: '14px',
  outline: 'none',
  fontFamily: 'inherit',
}

const labelStyle = {
  display: 'block' as const,
  fontSize: '12px',
  fontWeight: 600,
  marginBottom: '4px',
  color: '#6B7280',
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
      special_interests: sub.special_interests ?? '',
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
  onLeadDeleted,
  onTagsUpdate,
}: LeadsDetailSidebarProps) {
  const [currentSubmission, setCurrentSubmission] = useState<Lead | null>(submission)
  const [draft, setDraft] = useState<Record<string, string>>(() =>
    submission ? buildDraft(submission) : {}
  )
  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [callNotes, setCallNotes] = useState(submission?.call_notes ?? '')
  const [callNotesSaving, setCallNotesSaving] = useState(false)
  const [callNotesSaved, setCallNotesSaved] = useState(false)
  const [callNotesOpen, setCallNotesOpen] = useState(true)

  // Reset draft when a different lead is selected
  useEffect(() => {
    if (submission?.id !== currentSubmission?.id) {
      setCurrentSubmission(submission)
      setDraft(submission ? buildDraft(submission) : {})
      setIsDirty(false)
      setSaveError(null)
      setSaveSuccess(false)
      setCallNotes(submission?.call_notes ?? '')
      setCallNotesSaved(false)
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
        special_interests: draft.special_interests || null,
      })
      updatedLead = {
        ...currentSubmission,
        parent_name: draft.parent_name,
        email: draft.email,
        phone: draft.phone,
        child_name: draft.child_name,
        child_age: draft.child_age !== '' ? Number(draft.child_age) : null,
        notes: draft.notes || null,
        special_interests: draft.special_interests || null,
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

  const handleDelete = async () => {
    if (!currentSubmission || isDeleting) return
    setIsDeleting(true)
    setDeleteError(null)

    const result = isWaitlist
      ? await deleteWaitlistLead(currentSubmission.id)
      : await deleteContactLead(currentSubmission.id)

    setIsDeleting(false)

    if (result.success) {
      setShowDeleteConfirm(false)
      if (onLeadDeleted) onLeadDeleted(currentSubmission.id)
      onClose()
    } else {
      setDeleteError(result.error ?? 'Failed to delete lead')
    }
  }

  const handleCallNotesSave = async () => {
    if (!currentSubmission || callNotesSaving) return
    setCallNotesSaving(true)
    const result = await updateCallNotes(currentSubmission.id, currentSubmission.type, callNotes || null)
    setCallNotesSaving(false)
    if (result.success) {
      setCallNotesSaved(true)
      setTimeout(() => setCallNotesSaved(false), 2000)
    }
  }

  const footer = (
    <div className="flex items-center gap-3">
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
        Delete Lead
      </button>
      <div className="flex-1 text-sm">
        {saveError && <span className="text-red-600">{saveError}</span>}
        {saveSuccess && <span className="text-green-700">Changes saved</span>}
      </div>
      <button
        disabled={!isDirty || isSaving}
        onClick={handleSave}
        className="px-3 py-1.5 text-sm font-semibold text-white rounded-lg transition-colors hover:bg-[#234d25] disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          backgroundColor: '#2C5F2E',
          borderRadius: '8px',
          border: 'none',
        }}
      >
        {isSaving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  )

  return (
    <>
    {/* Call Notes Panel — hidden on mobile, slides in left of the detail sidebar */}
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0, width: callNotesOpen ? 440 : 48 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="hidden sm:flex fixed z-50 flex-col bg-white overflow-hidden"
      style={{
        top: 0,
        right: '500px',
        height: '100dvh',
        borderLeft: '1px solid #E5E7EB',
        borderRight: '1px solid #E5E7EB',
        boxShadow: '-4px 0 16px rgba(0,0,0,0.06)',
      }}
    >
      {callNotesOpen ? (
        <>
          {/* Header — expanded */}
          <div className="px-6 py-5 flex items-center justify-between border-b border-gray-100 flex-shrink-0">
            <h2 className="text-lg font-bold font-heading text-gray-800 whitespace-nowrap">Call Notes</h2>
            <div className="flex items-center gap-3">
              {callNotesSaving && <span className="text-xs text-gray-400">Saving…</span>}
              {callNotesSaved && !callNotesSaving && <span className="text-xs text-green-600">Saved</span>}
              <button
                onClick={() => setCallNotesOpen(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Collapse call notes"
              >
                {/* Chevron right — collapses toward right */}
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Textarea */}
          <div className="flex-1 p-6 overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
            <textarea
              className="w-full h-full min-h-[400px] text-sm text-gray-700 font-body leading-relaxed resize-none outline-none placeholder-gray-300 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
              placeholder="Paste your call notes here…"
              value={callNotes ?? ''}
              onChange={(e) => setCallNotes(e.target.value)}
              onBlur={handleCallNotesSave}
            />
          </div>
        </>
      ) : (
        /* Collapsed tab */
        <button
          onClick={() => setCallNotesOpen(true)}
          className="flex flex-col items-center justify-between w-full h-full py-5 hover:bg-gray-50 transition-colors cursor-pointer"
          aria-label="Expand call notes"
        >
          {/* Phone icon */}
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          {/* Rotated label */}
          <span
            className="text-xs font-semibold text-gray-400 font-body tracking-wide"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
          >
            Call Notes
          </span>
          {/* Chevron left — expand */}
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}
    </motion.div>

    {showDeleteConfirm && (
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
            Delete this lead?
          </h2>
          <p className="text-sm mb-5 text-gray-500">
            This lead will be hidden from the admin panel. The record is preserved and can be recovered from the database if needed.
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
      </div>
    )}
    <DetailSidebar
      isOpen={true}
      onClose={onClose}
      title={isWaitlist ? 'Waitlist Submission Details' : 'Contact Submission Details'}
      footer={footer}
    >
      <div className="space-y-5">
        {/* Status */}
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
            onStatusChange={isWaitlist ? updateWaitlistStatus : updateContactStatus}
            onUpdate={handleStatusUpdate}
          />
        </div>

        {/* Tags */}
        <div className="mb-6">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 font-body mb-3 border-b border-gray-100 pb-2">
            Tags
          </h3>
          <TagEditor
            tags={currentSubmission.tags ?? []}
            leadId={currentSubmission.id}
            leadType={currentSubmission.type}
            onTagsChange={(leadId, newTags) => {
              setCurrentSubmission({ ...currentSubmission, tags: newTags })
              if (onTagsUpdate) onTagsUpdate(leadId, newTags)
            }}
          />
        </div>

        {/* Contact/Parent Information */}
        <div className="mb-6">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 font-body mb-3 border-b border-gray-100 pb-2">
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

        {/* Waitlist-specific: Child Information */}
        {isWaitlist && (
          <div className="mb-6">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 font-body mb-3 border-b border-gray-100 pb-2">
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
              <div>
                <label style={labelStyle}>Special Interests</label>
                <textarea
                  style={{ ...inputStyle, resize: 'vertical', minHeight: '80px' }}
                  value={draft.special_interests}
                  onChange={(e) => updateDraft('special_interests', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Contact-specific: Message */}
        {isContact && (
          <div className="mb-6">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 font-body mb-3 border-b border-gray-100 pb-2">
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
        <div className="mb-6">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 font-body mb-3 border-b border-gray-100 pb-2">
            Email History
          </h3>
          <EmailThread emailAddress={currentSubmission.email} />
        </div>

        {/* Submission Date - Simple, No Card */}
        <div className="pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-400 font-body">
            Submitted on {formatDate(currentSubmission.created_at)}
          </p>
        </div>
      </div>
    </DetailSidebar>
    </>
  )
}
