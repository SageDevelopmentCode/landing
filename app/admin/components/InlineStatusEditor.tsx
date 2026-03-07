'use client'

import { useState, useTransition } from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { ChevronDown, Loader2 } from 'lucide-react'
import { LeadStatus, allLeadStatuses, leadStatusLabels, leadStatusStyles } from '../../types/lead-status'
import { updateWaitlistStatus, updateContactStatus } from '../../actions/updateLeadStatus'
import { colors } from '../design-system'

interface InlineStatusEditorProps {
  status: LeadStatus
  leadId: string
  leadType: 'waitlist' | 'contact'
  onStatusChange: (leadId: string, newStatus: LeadStatus) => void
}

export function InlineStatusEditor({
  status,
  leadId,
  leadType,
  onStatusChange
}: InlineStatusEditorProps) {
  const [currentStatus, setCurrentStatus] = useState<LeadStatus>(status)
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleStatusSelect = async (newStatus: LeadStatus) => {
    if (newStatus === currentStatus) {
      setIsOpen(false)
      return
    }

    setError(null)
    setIsOpen(false)

    startTransition(async () => {
      // Call the appropriate server action based on lead type
      const updateAction = leadType === 'waitlist' ? updateWaitlistStatus : updateContactStatus
      const result = await updateAction(leadId, newStatus)

      if (result.success) {
        setCurrentStatus(newStatus)
        // Update parent component's state
        onStatusChange(leadId, newStatus)
      } else {
        setError(result.error || 'Failed to update status')
        setTimeout(() => setError(null), 3000)
      }
    })
  }

  const styles = leadStatusStyles[currentStatus]

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <DropdownMenu.Root open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenu.Trigger asChild>
          <button
            className="inline-flex items-center px-3 py-1 text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 rounded-full"
            style={{
              backgroundColor: styles.bg,
              color: styles.text,
            }}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            ) : (
              <ChevronDown className="w-3 h-3 mr-1" />
            )}
            {leadStatusLabels[currentStatus]}
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="min-w-[200px] rounded-lg shadow-lg border border-gray-200 z-50 bg-white"
            style={{ padding: '4px' }}
            sideOffset={4}
          >
            {allLeadStatuses.map((statusOption) => {
              const optionStyles = leadStatusStyles[statusOption]
              const isSelected = statusOption === currentStatus

              return (
                <DropdownMenu.Item
                  key={statusOption}
                  className="flex items-center px-3 py-2 text-sm cursor-pointer outline-none rounded text-gray-700"
                  style={{
                    backgroundColor: isSelected ? '#F3F4F6' : 'transparent',
                  }}
                  onSelect={() => handleStatusSelect(statusOption)}
                >
                  <span
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: optionStyles.bg }}
                  />
                  {leadStatusLabels[statusOption]}
                </DropdownMenu.Item>
              )
            })}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      {error && (
        <p className="mt-1 text-xs" style={{ color: colors.error }}>
          {error}
        </p>
      )}
    </div>
  )
}
