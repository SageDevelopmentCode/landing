import { radius } from '../design-system'
import { LeadStatus, leadStatusStyles, leadStatusLabels } from '../../types/lead-status'

interface StatusBadgeProps {
  status: LeadStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const styles = leadStatusStyles[status]

  return (
    <span
      className="inline-flex items-center px-3 py-1 text-xs font-medium"
      style={{
        backgroundColor: styles.bg,
        color: styles.text,
        borderRadius: radius.full,
      }}
    >
      {leadStatusLabels[status]}
    </span>
  )
}
