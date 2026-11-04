'use client'

import { useState } from 'react'
import { DetailSidebar } from '../components/DetailSidebar'
import { SidebarField, SidebarSection } from '../../components/SidebarPrimitives'
import { EmailThread } from '../components/EmailThread'
import { sendSchoolYearWeekElevenNewsletterEmail } from '@/app/actions/sendSchoolYearWeekElevenNewsletterEmail'
import type { SchoolYearFieldFridaySignup } from '@/app/lib/admin-school-year-field-friday-signups'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatFridayDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const REFERRAL_LABELS: Record<string, string> = {
  google: 'Google',
  social_media: 'Social Media',
  friend_family: 'Friend / Family',
  flyer: 'Flyer / Poster',
  other: 'Other',
}

const SOURCE_LABELS: Record<SchoolYearFieldFridaySignup['signupSource'], string> = {
  parent_portal: 'Parent portal',
  friday_page: '/friday page',
  both: 'Parent portal + /friday',
}

const PROGRAM_LABELS: Record<string, string> = {
  field_friday: 'Field Friday',
  friday_page: '/friday page',
  school_year_26_27: 'School Year',
  both: 'Summer + School Year',
  summer_26: 'Summer',
  aftercare: 'Aftercare',
  homeschool_drop_in: 'Homeschool Drop-In',
}

interface FieldFridaySignupDetailSidebarProps {
  signup: SchoolYearFieldFridaySignup
  onClose: () => void
}

export function FieldFridaySignupDetailSidebar({
  signup,
  onClose,
}: FieldFridaySignupDetailSidebarProps) {
  const [newsletterSending, setNewsletterSending] = useState(false)
  const [newsletterSent, setNewsletterSent] = useState(false)
  const [newsletterError, setNewsletterError] = useState<string | null>(null)

  async function handleSendWeekElevenNewsletter() {
    if (newsletterSending || newsletterSent || !signup.parentEmail) return
    setNewsletterSending(true)
    setNewsletterError(null)
    const result = await sendSchoolYearWeekElevenNewsletterEmail({
      g1FullName: signup.parentName ?? 'Friend',
      childLegalName: signup.childName,
      email: signup.parentEmail,
    })
    setNewsletterSending(false)
    if (result.success) {
      setNewsletterSent(true)
      setTimeout(() => setNewsletterSent(false), 3000)
    } else {
      setNewsletterError(result.error ?? 'Failed to send')
    }
  }

  return (
    <DetailSidebar
      isOpen={true}
      onClose={onClose}
      title={signup.parentName ?? signup.parentEmail ?? 'Field Friday signup'}
    >
      <div className="space-y-4">
        <SidebarSection title="Signup Details">
          <SidebarField label="Parent" value={signup.parentName ?? '—'} />
          <SidebarField label="Email" value={signup.parentEmail ?? '—'} />
          <SidebarField label="Phone" value={signup.phone ?? '—'} />
          <SidebarField label="Child" value={signup.childName} />
          <SidebarField
            label="Source"
            value={SOURCE_LABELS[signup.signupSource]}
          />
          <SidebarField
            label="Payment"
            value={signup.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
          />
          <SidebarField
            label="Program"
            value={
              signup.program
                ? (PROGRAM_LABELS[signup.program] ?? signup.program)
                : '—'
            }
          />
          <SidebarField
            label="Referral"
            value={
              signup.referralSource
                ? (REFERRAL_LABELS[signup.referralSource] ??
                  signup.referralSource)
                : '—'
            }
          />
          <SidebarField
            label="Paid Field Fridays"
            value={
              signup.paidFridays.length > 0
                ? signup.paidFridays.map(formatFridayDate).join('\n')
                : signup.paymentStatus === 'pending'
                  ? '— (payment pending)'
                  : '—'
            }
          />
          <SidebarField
            label="Last Activity"
            value={formatDate(signup.lastPaymentAt)}
          />
        </SidebarSection>

        <SidebarSection title="Outreach">
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleSendWeekElevenNewsletter}
              disabled={newsletterSending || newsletterSent || !signup.parentEmail}
              className="px-3 py-1.5 text-sm font-semibold text-white rounded-lg transition-colors hover:bg-[#234d25] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: '#2C5F2E',
                border: 'none',
                borderRadius: '8px',
              }}
            >
              {newsletterSending
                ? 'Sending…'
                : newsletterSent
                  ? '✓ Sent!'
                  : 'Send School Year Week Eleven Newsletter'}
            </button>
            {newsletterError && (
              <span className="text-xs text-red-600">{newsletterError}</span>
            )}
          </div>
        </SidebarSection>

        {signup.parentEmail && (
          <SidebarSection title="Email History">
            <EmailThread emailAddress={signup.parentEmail} />
          </SidebarSection>
        )}
      </div>
    </DetailSidebar>
  )
}
