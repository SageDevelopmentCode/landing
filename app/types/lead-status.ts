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
  enrolled:              { bg: colors.successBg,   text: colors.success  },
  enrollment_offered:    { bg: colors.successBg,   text: colors.success  },
  application_submitted: { bg: colors.accentLight, text: colors.accentBright },

  // Info statuses - active engagement
  contacted:        { bg: colors.infoBg,      text: colors.info     },
  emailed:          { bg: colors.infoBg,      text: colors.info     },
  application_sent: { bg: colors.accentLight, text: colors.accentBright },

  // Warning statuses - needs attention or in progress
  new_inquiry:   { bg: colors.warningBg,  text: colors.warning  },
  not_contacted: { bg: colors.warningBg,  text: colors.warning  },
  waitlist:      { bg: colors.purpleBg,   text: colors.purple   },
  nurture:       { bg: colors.purpleBg,   text: colors.purple   },
  on_hold:       { bg: colors.warningBg,  text: colors.warning  },

  // Error statuses - negative outcomes
  not_fit: { bg: colors.errorBg, text: colors.error },
  lost:     { bg: colors.errorBg, text: colors.error },
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
