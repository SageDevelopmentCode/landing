import { colors } from '../admin/design-system'

export type LeadStatus =
  | 'new_inquiry'
  | 'not_contacted'
  | 'contacted'
  | 'emailed'
  | 'application_sent'
  | 'application_submitted'
  | 'enrollment_offered'
  | 'enrolled'
  | 'waitlist'
  | 'nurture'
  | 'on_hold'
  | 'not_fit'
  | 'lost'

export const leadStatusStyles: Record<LeadStatus, { bg: string; text: string }> = {
  // Success statuses - positive outcomes
  enrolled: { bg: colors.success, text: colors.successText },
  enrollment_offered: { bg: colors.success, text: colors.successText },
  application_submitted: { bg: colors.success, text: colors.successText },

  // Info statuses - active engagement
  contacted: { bg: colors.info, text: colors.infoText },
  emailed: { bg: colors.info, text: colors.infoText },
  application_sent: { bg: colors.info, text: colors.infoText },

  // Warning statuses - needs attention or in progress
  new_inquiry: { bg: colors.warning, text: colors.warningText },
  not_contacted: { bg: colors.warning, text: colors.warningText },
  waitlist: { bg: colors.warning, text: colors.warningText },
  nurture: { bg: colors.warning, text: colors.warningText },
  on_hold: { bg: colors.warning, text: colors.warningText },

  // Error statuses - negative outcomes
  not_fit: { bg: colors.error, text: colors.errorText },
  lost: { bg: colors.error, text: colors.errorText },
}

export const leadStatusLabels: Record<LeadStatus, string> = {
  new_inquiry: 'New Inquiry',
  not_contacted: 'Not Contacted',
  contacted: 'Contacted',
  emailed: 'Emailed',
  application_sent: 'Application Sent',
  application_submitted: 'Application Submitted',
  enrollment_offered: 'Enrollment Offered',
  enrolled: 'Enrolled',
  waitlist: 'Waitlist',
  nurture: 'Nurture',
  on_hold: 'On Hold',
  not_fit: 'Not Fit',
  lost: 'Lost',
}

// All status options for dropdowns
export const allLeadStatuses: LeadStatus[] = [
  'new_inquiry',
  'not_contacted',
  'contacted',
  'emailed',
  'application_sent',
  'application_submitted',
  'enrollment_offered',
  'enrolled',
  'waitlist',
  'nurture',
  'on_hold',
  'not_fit',
  'lost',
]
