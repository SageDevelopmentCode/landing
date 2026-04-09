'use client'

import { colors } from '../design-system'

const STATUS_MAP: Record<string, { bg: string; color: string; border: string; label: string }> = {
  new:                  { bg: colors.infoBg,     color: colors.info,     border: 'rgba(56,189,248,0.25)',   label: 'New'           },
  new_inquiry:          { bg: colors.infoBg,     color: colors.info,     border: 'rgba(56,189,248,0.25)',   label: 'New Inquiry'   },
  not_contacted:        { bg: colors.warningBg,  color: colors.warning,  border: 'rgba(245,158,11,0.25)',   label: 'Not Contacted' },
  contacted:            { bg: colors.warningBg,  color: colors.warning,  border: 'rgba(245,158,11,0.25)',   label: 'Contacted'     },
  emailed:              { bg: colors.warningBg,  color: colors.warning,  border: 'rgba(245,158,11,0.25)',   label: 'Emailed'       },
  application_sent:     { bg: 'rgba(124,58,237,0.08)', color: '#8B5CF6', border: 'rgba(124,58,237,0.25)',  label: 'App Sent'      },
  application_submitted:{ bg: 'rgba(124,58,237,0.08)', color: '#8B5CF6', border: 'rgba(124,58,237,0.25)',  label: 'App Submitted' },
  in_progress:          { bg: colors.warningBg,  color: colors.warning,  border: 'rgba(245,158,11,0.25)',   label: 'In Progress'   },
  in_review:            { bg: 'rgba(124,58,237,0.08)', color: '#8B5CF6', border: 'rgba(124,58,237,0.25)',  label: 'In Review'     },
  enrolling:            { bg: colors.infoBg,     color: colors.info,     border: 'rgba(56,189,248,0.25)',   label: 'Enrolling'     },
  enrolled:             { bg: colors.successBg,  color: colors.success,  border: 'rgba(34,197,94,0.25)',    label: 'Enrolled'      },
  nurture:              { bg: 'rgba(236,72,153,0.08)', color: '#EC4899',  border: 'rgba(236,72,153,0.25)',  label: 'Nurture'       },
  on_hold:              { bg: 'rgba(82,82,82,0.15)',   color: '#A3A3A3',  border: 'rgba(82,82,82,0.3)',     label: 'On Hold'       },
  not_fit:              { bg: colors.dangerBg,   color: colors.danger,   border: 'rgba(239,68,68,0.25)',    label: 'Not Fit'       },
  lost:                 { bg: colors.dangerBg,   color: colors.danger,   border: 'rgba(239,68,68,0.25)',    label: 'Lost'          },
  waitlist:             { bg: 'rgba(56,189,248,0.08)', color: colors.info, border: 'rgba(56,189,248,0.25)', label: 'Waitlist'      },
  succeeded:            { bg: colors.successBg,  color: colors.success,  border: 'rgba(34,197,94,0.25)',    label: 'Succeeded'     },
  processing:           { bg: colors.warningBg,  color: colors.warning,  border: 'rgba(245,158,11,0.25)',   label: 'Processing'    },
  failed:               { bg: colors.dangerBg,   color: colors.danger,   border: 'rgba(239,68,68,0.25)',    label: 'Failed'        },
  active:               { bg: colors.successBg,  color: colors.success,  border: 'rgba(34,197,94,0.25)',    label: 'Active'        },
  summer:               { bg: colors.warningBg,  color: colors.warning,  border: 'rgba(245,158,11,0.25)',   label: 'Summer'        },
  school_year:          { bg: colors.infoBg,     color: colors.info,     border: 'rgba(56,189,248,0.25)',   label: 'School Year'   },
  both:                 { bg: 'rgba(124,58,237,0.08)', color: '#8B5CF6', border: 'rgba(124,58,237,0.25)',  label: 'Both'          },
  homeschool:           { bg: 'rgba(236,72,153,0.08)', color: '#EC4899',  border: 'rgba(236,72,153,0.25)', label: 'Homeschool'    },
}

interface BadgePillProps {
  status: string
  customLabel?: string
}

export function BadgePill({ status, customLabel }: BadgePillProps) {
  const style = STATUS_MAP[status] ?? {
    bg: 'rgba(82,82,82,0.15)',
    color: '#A3A3A3',
    border: 'rgba(82,82,82,0.3)',
    label: status,
  }

  return (
    <span
      className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full"
      style={{
        backgroundColor: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
        letterSpacing: '0.01em',
      }}
    >
      {customLabel ?? style.label}
    </span>
  )
}
