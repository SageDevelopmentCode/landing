'use client'

import { useState, useTransition } from 'react'
import { LeadStatus, allLeadStatuses, leadStatusLabels } from '../../types/lead-status'
import { cssColors as colors, radius } from '../design-system'

interface StatusDropdownProps {
  currentStatus: LeadStatus
  submissionId: string
  onStatusChange: (submissionId: string, newStatus: LeadStatus) => Promise<{ success: boolean; error?: string }>
  onUpdate?: (newStatus: LeadStatus) => void
}

export function StatusDropdown({
  currentStatus,
  submissionId,
  onStatusChange,
  onUpdate
}: StatusDropdownProps) {
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus>(currentStatus)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleStatusChange = async (newStatus: LeadStatus) => {
    if (newStatus === selectedStatus) return

    setError(null)

    startTransition(async () => {
      const result = await onStatusChange(submissionId, newStatus)

      if (result.success) {
        setSelectedStatus(newStatus)
        // Call the optional onUpdate callback to refresh the UI
        if (onUpdate) {
          onUpdate(newStatus)
        }
      } else {
        setError(result.error || 'Failed to update status')
        // Reset to previous status on error
        setTimeout(() => setError(null), 3000)
      }
    })
  }

  return (
    <div>
      <select
        value={selectedStatus}
        onChange={(e) => handleStatusChange(e.target.value as LeadStatus)}
        disabled={isPending}
        className="w-full px-4 py-2 text-sm font-medium border-2 focus:outline-none focus:ring-2 transition-all"
        style={{
          backgroundColor: colors.softCloud,
          borderColor: error ? colors.error : colors.border,
          borderRadius: radius.md,
          color: colors.textPrimary,
          cursor: isPending ? 'wait' : 'pointer',
          opacity: isPending ? 0.6 : 1,
        }}
      >
        {allLeadStatuses.map((status) => (
          <option key={status} value={status}>
            {leadStatusLabels[status]}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-2 text-xs" style={{ color: colors.error }}>
          {error}
        </p>
      )}
      {isPending && (
        <p className="mt-2 text-xs" style={{ color: colors.textSecondary }}>
          Updating...
        </p>
      )}
    </div>
  )
}
