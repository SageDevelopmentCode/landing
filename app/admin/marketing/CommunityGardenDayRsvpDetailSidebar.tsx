'use client'

import { useEffect, useState } from 'react'
import { DetailSidebar } from '../components/DetailSidebar'
import { SidebarField, SidebarSection } from '../../components/SidebarPrimitives'
import { EmailThread } from '../components/EmailThread'
import { sendCommunityGardenDayThankYouExistingFamilyEmail } from '../../actions/sendCommunityGardenDayThankYouExistingFamilyEmail'
import { sendCommunityGardenDayThankYouNewFamilyEmail } from '../../actions/sendCommunityGardenDayThankYouNewFamilyEmail'
import type { CommunityGardenDayRsvp } from './page'

const FAMILY_LABELS: Record<string, string> = {
  yes: 'Yes',
  no: 'No',
  interested: 'Interested',
}

const HEAR_LABELS: Record<string, string> = {
  friend: 'Friend / Word of Mouth',
  instagram: 'Instagram',
  facebook: 'Facebook',
  google: 'Google',
  nextdoor: 'Nextdoor',
  other: 'Other',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

interface CommunityGardenDayRsvpDetailSidebarProps {
  rsvp: CommunityGardenDayRsvp
  onClose: () => void
}

export function CommunityGardenDayRsvpDetailSidebar({
  rsvp,
  onClose,
}: CommunityGardenDayRsvpDetailSidebarProps) {
  const [existingSending, setExistingSending] = useState(false)
  const [existingSent, setExistingSent] = useState(false)
  const [existingError, setExistingError] = useState<string | null>(null)
  const [newSending, setNewSending] = useState(false)
  const [newSent, setNewSent] = useState(false)
  const [newError, setNewError] = useState<string | null>(null)

  useEffect(() => {
    setExistingSending(false)
    setExistingSent(false)
    setExistingError(null)
    setNewSending(false)
    setNewSent(false)
    setNewError(null)
  }, [rsvp.id])

  async function handleSendExistingThankYou() {
    if (existingSending || existingSent) return
    setExistingSending(true)
    setExistingError(null)
    const result = await sendCommunityGardenDayThankYouExistingFamilyEmail({
      parentName: rsvp.parent_name,
      email: rsvp.email,
    })
    setExistingSending(false)
    if (result.success) {
      setExistingSent(true)
      setTimeout(() => setExistingSent(false), 3000)
    } else {
      setExistingError(result.error ?? 'Failed to send')
    }
  }

  async function handleSendNewThankYou() {
    if (newSending || newSent) return
    setNewSending(true)
    setNewError(null)
    const result = await sendCommunityGardenDayThankYouNewFamilyEmail({
      parentName: rsvp.parent_name,
      email: rsvp.email,
    })
    setNewSending(false)
    if (result.success) {
      setNewSent(true)
      setTimeout(() => setNewSent(false), 3000)
    } else {
      setNewError(result.error ?? 'Failed to send')
    }
  }

  return (
    <DetailSidebar
      isOpen={true}
      onClose={onClose}
      title={rsvp.parent_name}
    >
      <div className="space-y-4">
        <SidebarSection title="RSVP Details">
          <SidebarField label="Parent" value={rsvp.parent_name} />
          <SidebarField label="Email" value={rsvp.email} />
          <SidebarField label="Phone" value={rsvp.phone ?? '—'} />
          <SidebarField label="Adults" value={rsvp.adults_attending} />
          <SidebarField label="Children" value={rsvp.children_attending} />
          <SidebarField
            label="Sage Field Family"
            value={
              FAMILY_LABELS[rsvp.is_sage_field_family] ??
              rsvp.is_sage_field_family
            }
          />
          <SidebarField
            label="How Heard"
            value={
              rsvp.hear_about_us
                ? (HEAR_LABELS[rsvp.hear_about_us] ?? rsvp.hear_about_us)
                : '—'
            }
          />
          <SidebarField label="Notes" value={rsvp.notes ?? '—'} />
          <SidebarField label="Status" value={rsvp.status} />
          <SidebarField label="Submitted" value={formatDate(rsvp.created_at)} />
        </SidebarSection>

        <SidebarSection title="Outreach">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={handleSendExistingThankYou}
                disabled={existingSending || existingSent}
                className="px-3 py-1.5 text-sm font-semibold text-white rounded-lg transition-colors hover:bg-[#234d25] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: '#2C5F2E',
                  border: 'none',
                  borderRadius: '8px',
                }}
              >
                {existingSending
                  ? 'Sending…'
                  : existingSent
                    ? '✓ Sent!'
                    : 'Send Thank You (Existing Family)'}
              </button>
              {existingError && (
                <span className="text-xs text-red-600">{existingError}</span>
              )}
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={handleSendNewThankYou}
                disabled={newSending || newSent}
                className="px-3 py-1.5 text-sm font-semibold text-white rounded-lg transition-colors hover:bg-[#234d25] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: '#2C5F2E',
                  border: 'none',
                  borderRadius: '8px',
                }}
              >
                {newSending
                  ? 'Sending…'
                  : newSent
                    ? '✓ Sent!'
                    : 'Send Thank You (New Family)'}
              </button>
              {newError && (
                <span className="text-xs text-red-600">{newError}</span>
              )}
            </div>
          </div>
        </SidebarSection>

        <SidebarSection title="Email History">
          <EmailThread emailAddress={rsvp.email} />
        </SidebarSection>
      </div>
    </DetailSidebar>
  )
}
