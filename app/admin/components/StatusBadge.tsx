import { colors, radius } from '../design-system'

type WaitlistStatus = 'pending' | 'contacted' | 'enrolled' | 'rejected'
type ContactStatus = 'pending' | 'replied' | 'resolved' | 'archived'

interface StatusBadgeProps {
  status: WaitlistStatus | ContactStatus
  type: 'waitlist' | 'contact'
}

const waitlistStatusStyles: Record<WaitlistStatus, { bg: string; text: string }> = {
  pending: { bg: colors.warning, text: colors.warningText },
  contacted: { bg: colors.info, text: colors.infoText },
  enrolled: { bg: colors.success, text: colors.successText },
  rejected: { bg: colors.error, text: colors.errorText },
}

const contactStatusStyles: Record<ContactStatus, { bg: string; text: string }> = {
  pending: { bg: colors.warning, text: colors.warningText },
  replied: { bg: colors.info, text: colors.infoText },
  resolved: { bg: colors.success, text: colors.successText },
  archived: { bg: colors.warmLinen, text: colors.textSecondary },
}

export function StatusBadge({ status, type }: StatusBadgeProps) {
  const styles = type === 'waitlist'
    ? waitlistStatusStyles[status as WaitlistStatus]
    : contactStatusStyles[status as ContactStatus]

  return (
    <span
      className="inline-flex items-center px-3 py-1 text-xs font-medium capitalize"
      style={{
        backgroundColor: styles.bg,
        color: styles.text,
        borderRadius: radius.full,
      }}
    >
      {status}
    </span>
  )
}
