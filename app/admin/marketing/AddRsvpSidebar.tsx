'use client'

import { useState, useTransition, useEffect } from 'react'
import { DetailSidebar } from '../components/DetailSidebar'
import { colors, radius, shadows } from '../design-system'
import { addAdminRsvp } from '../../actions/addAdminRsvp'
import type { OpenHouseRsvp } from './page'

interface AddRsvpSidebarProps {
  isOpen: boolean
  onClose: () => void
  onRsvpAdded: (rsvp: OpenHouseRsvp) => void
}

const defaultForm = {
  name: '',
  email: '',
  phone: '',
  adults_attending: '1',
  children_attending: '0',
  notes: '',
}

const inputStyle = {
  backgroundColor: colors.softCloud,
  border: `1px solid ${colors.border}`,
  borderRadius: radius.md,
  color: colors.textPrimary,
  width: '100%',
  padding: '10px 12px',
  fontSize: '14px',
  outline: 'none',
}

const labelStyle = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 600,
  marginBottom: '6px',
  color: '#6B7280',
}

export function AddRsvpSidebar({ isOpen, onClose, onRsvpAdded }: AddRsvpSidebarProps) {
  const [form, setForm] = useState(defaultForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState('')
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!isOpen) {
      setForm(defaultForm)
      setErrors({})
      setServerError('')
    }
  }, [isOpen])

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!form.name.trim()) newErrors.name = 'Name is required'
    if (!form.email.trim()) newErrors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Please enter a valid email'
    if (!form.adults_attending) newErrors.adults_attending = 'Adults attending is required'
    else if (isNaN(Number(form.adults_attending)) || Number(form.adults_attending) < 1 || Number(form.adults_attending) > 10)
      newErrors.adults_attending = 'Must be between 1 and 10'
    if (form.children_attending === '') newErrors.children_attending = 'Children attending is required'
    else if (isNaN(Number(form.children_attending)) || Number(form.children_attending) < 0 || Number(form.children_attending) > 10)
      newErrors.children_attending = 'Must be between 0 and 10'
    return newErrors
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    setErrors({})
    setServerError('')

    startTransition(async () => {
      const result = await addAdminRsvp({
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        adults_attending: Number(form.adults_attending),
        children_attending: Number(form.children_attending),
        notes: form.notes || undefined,
      })

      if (!result.success || !result.rsvp) {
        setServerError(result.message)
        return
      }

      onRsvpAdded(result.rsvp)
      onClose()
    })
  }

  const field = (
    id: string,
    label: string,
    element: React.ReactNode
  ) => (
    <div>
      <label htmlFor={id} style={labelStyle}>{label}</label>
      {element}
      {errors[id] && (
        <p style={{ color: colors.errorText, fontSize: '12px', marginTop: '4px' }}>
          {errors[id]}
        </p>
      )}
    </div>
  )

  return (
    <DetailSidebar isOpen={isOpen} onClose={onClose} title="Add RSVP">
      <form onSubmit={handleSubmit} className="space-y-5">
        {field('name', 'Name *', (
          <input
            id="name"
            type="text"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            style={inputStyle}
            placeholder="Jane Smith"
          />
        ))}

        {field('email', 'Email *', (
          <input
            id="email"
            type="email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            style={inputStyle}
            placeholder="jane@example.com"
          />
        ))}

        {field('phone', 'Phone', (
          <input
            id="phone"
            type="tel"
            value={form.phone}
            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            style={inputStyle}
            placeholder="(555) 000-0000"
          />
        ))}

        {field('adults_attending', 'Adults Attending *', (
          <input
            id="adults_attending"
            type="number"
            min={1}
            max={10}
            value={form.adults_attending}
            onChange={e => setForm(f => ({ ...f, adults_attending: e.target.value }))}
            style={inputStyle}
          />
        ))}

        {field('children_attending', 'Children Attending *', (
          <input
            id="children_attending"
            type="number"
            min={0}
            max={10}
            value={form.children_attending}
            onChange={e => setForm(f => ({ ...f, children_attending: e.target.value }))}
            style={inputStyle}
          />
        ))}

        {field('notes', 'Notes', (
          <textarea
            id="notes"
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            style={{ ...inputStyle, resize: 'vertical', minHeight: '80px' }}
            placeholder="Any additional notes..."
          />
        ))}

        {serverError && (
          <p style={{ color: colors.errorText, fontSize: '13px' }}>{serverError}</p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="flex-1 py-3 text-sm font-medium transition-all duration-200"
            style={{
              backgroundColor: colors.softCloud,
              border: `1px solid ${colors.border}`,
              borderRadius: radius.md,
              color: colors.textSecondary,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 py-3 text-sm font-medium text-white transition-all duration-200 hover:opacity-90 active:scale-95"
            style={{
              backgroundColor: colors.mistyForest,
              borderRadius: radius.md,
              boxShadow: shadows.soft,
              border: 'none',
              cursor: isPending ? 'not-allowed' : 'pointer',
              opacity: isPending ? 0.7 : 1,
            }}
          >
            {isPending ? 'Adding...' : 'Add RSVP'}
          </button>
        </div>
      </form>
    </DetailSidebar>
  )
}
