'use client'

import { useState, useTransition, useEffect } from 'react'
import { DetailSidebar } from './DetailSidebar'
import { colors, radius, shadows } from '../design-system'
import { allLeadStatuses, leadStatusLabels, LeadStatus } from '../../types/lead-status'
import { addAdminLead } from '../../actions/addAdminLead'

type WaitlistLead = {
  id: string
  type: 'waitlist'
  parent_name: string
  email: string
  phone: string
  child_name: string
  child_age: number | null
  preferred_start_date: string | null
  status: LeadStatus
  created_at: string
  notes?: string | null
}

interface AddLeadSidebarProps {
  isOpen: boolean
  onClose: () => void
  onLeadAdded: (newLead: WaitlistLead) => void
}

const defaultForm = {
  parentName: '',
  email: '',
  phone: '',
  childName: '',
  childAge: '',
  programInterest: '' as '' | 'summer-2026' | 'school-year-2026' | 'both' | 'homeschool_drop_in',
  specialInterests: '',
  status: 'new_inquiry' as LeadStatus,
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

export function AddLeadSidebar({ isOpen, onClose, onLeadAdded }: AddLeadSidebarProps) {
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
    if (!form.parentName.trim()) newErrors.parentName = 'Parent name is required'
    if (!form.email.trim()) newErrors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Please enter a valid email'
    if (!form.childName.trim()) newErrors.childName = 'Child name is required'
    if (!form.childAge) newErrors.childAge = 'Child age is required'
    else if (isNaN(Number(form.childAge)) || Number(form.childAge) < 1 || Number(form.childAge) > 18)
      newErrors.childAge = 'Age must be between 1 and 18'
    if (!form.programInterest) newErrors.programInterest = 'Please select a program'
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
      const result = await addAdminLead({
        parentName: form.parentName,
        email: form.email,
        phone: form.phone || undefined,
        childName: form.childName,
        childAge: Number(form.childAge),
        programInterest: form.programInterest as 'summer-2026' | 'school-year-2026' | 'both' | 'homeschool_drop_in',
        specialInterests: form.specialInterests || undefined,
        status: form.status,
      })

      if (!result.success || !result.leadId) {
        setServerError(result.message)
        return
      }

      const newLead: WaitlistLead = {
        id: result.leadId,
        type: 'waitlist',
        parent_name: form.parentName,
        email: form.email,
        phone: form.phone,
        child_name: form.childName,
        child_age: Number(form.childAge),
        preferred_start_date: null,
        status: form.status,
        created_at: new Date().toISOString(),
        notes: form.specialInterests || null,
      }

      onLeadAdded(newLead)
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
    <DetailSidebar isOpen={isOpen} onClose={onClose} title="Add Lead">
      <form onSubmit={handleSubmit} className="space-y-5">
        {field('parentName', 'Parent / Guardian Name *', (
          <input
            id="parentName"
            type="text"
            value={form.parentName}
            onChange={e => setForm(f => ({ ...f, parentName: e.target.value }))}
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

        {field('childName', 'Child Name *', (
          <input
            id="childName"
            type="text"
            value={form.childName}
            onChange={e => setForm(f => ({ ...f, childName: e.target.value }))}
            style={inputStyle}
            placeholder="Alex Smith"
          />
        ))}

        {field('childAge', 'Child Age *', (
          <input
            id="childAge"
            type="number"
            min={1}
            max={18}
            value={form.childAge}
            onChange={e => setForm(f => ({ ...f, childAge: e.target.value }))}
            style={inputStyle}
            placeholder="5"
          />
        ))}

        {field('programInterest', 'Program Interest *', (
          <select
            id="programInterest"
            value={form.programInterest}
            onChange={e => setForm(f => ({ ...f, programInterest: e.target.value as typeof form.programInterest }))}
            style={inputStyle}
          >
            <option value="">Select a program...</option>
            <option value="summer-2026">Summer 2026</option>
            <option value="school-year-2026">School Year 2026</option>
            <option value="both">Both</option>
            <option value="homeschool_drop_in">Homeschool Drop-in</option>
          </select>
        ))}

        {field('specialInterests', 'Special Interests / Notes', (
          <textarea
            id="specialInterests"
            value={form.specialInterests}
            onChange={e => setForm(f => ({ ...f, specialInterests: e.target.value }))}
            style={{ ...inputStyle, resize: 'vertical', minHeight: '80px' }}
            placeholder="Any special interests or notes..."
          />
        ))}

        {field('status', 'Status', (
          <select
            id="status"
            value={form.status}
            onChange={e => setForm(f => ({ ...f, status: e.target.value as LeadStatus }))}
            style={inputStyle}
          >
            {allLeadStatuses.map(s => (
              <option key={s} value={s}>{leadStatusLabels[s]}</option>
            ))}
          </select>
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
            {isPending ? 'Adding...' : 'Add Lead'}
          </button>
        </div>
      </form>
    </DetailSidebar>
  )
}
