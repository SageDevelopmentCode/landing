'use client'

import { useState, type CSSProperties } from 'react'
import { Check, Loader2, X } from 'lucide-react'
import type { PickupPersonEntry } from '@/app/actions/saveAuthorizedPickup'
import { formatPhone } from '@/app/utils/formatPhone'
import { validatePickupPersonEntry } from '@/app/lib/authorizedPickupValidation'

export type EditablePickupPerson = PickupPersonEntry & { _key: string }

export function blankPickupPerson(): EditablePickupPerson {
  return {
    _key: Math.random().toString(36).slice(2),
    fullName: '',
    relationship: '',
    phone: '',
    email: '',
    dlStateIdNumber: '',
    vehicleInfo: '',
    licensePlateState: '',
  }
}

export function pickupPersonRowToEditable(row: {
  id: string
  full_name: string | null
  relationship: string | null
  phone: string | null
  email: string | null
  dl_state_id_number: string | null
  vehicle_info: string | null
  license_plate_state: string | null
}): EditablePickupPerson {
  return {
    _key: row.id,
    fullName: row.full_name ?? '',
    relationship: row.relationship ?? '',
    phone: row.phone ?? '',
    email: row.email ?? '',
    dlStateIdNumber: row.dl_state_id_number ?? '',
    vehicleInfo: row.vehicle_info ?? '',
    licensePlateState: row.license_plate_state ?? '',
  }
}

export { validatePickupPersonEntry }

export function editableToPickupEntries(
  persons: EditablePickupPerson[]
): PickupPersonEntry[] {
  return persons.map(({ _key: _k, ...p }) => p)
}

type PickupPersonFormProps = {
  person: EditablePickupPerson
  onChange: (field: keyof PickupPersonEntry, value: string) => void
  onCancel: () => void
  onSave: () => void
  saving: boolean
  error: string | null
  /** Tailwind-style inputs (parent portal). Omit for compact admin sidebar styling. */
  variant?: 'default' | 'compact'
}

export function PickupPersonForm({
  person,
  onChange,
  onCancel,
  onSave,
  saving,
  error,
  variant = 'default',
}: PickupPersonFormProps) {
  if (variant === 'compact') {
    return (
      <CompactPickupPersonForm
        person={person}
        onChange={onChange}
        onCancel={onCancel}
        onSave={onSave}
        saving={saving}
        error={error}
      />
    )
  }

  const inputCls =
    'w-full text-sm font-body text-gray-800 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#4a7c59] focus:ring-1 focus:ring-[#4a7c59]'
  const labelCls =
    'block text-xs font-body text-gray-400 uppercase tracking-wide mb-1'

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>
            Full Name <span className="text-red-400">*</span>
          </label>
          <input
            className={inputCls}
            value={person.fullName}
            onChange={(e) => onChange('fullName', e.target.value)}
            placeholder="Jane Smith"
          />
        </div>
        <div>
          <label className={labelCls}>
            Relationship <span className="text-red-400">*</span>
          </label>
          <input
            className={inputCls}
            value={person.relationship}
            onChange={(e) => onChange('relationship', e.target.value)}
            placeholder="Aunt"
          />
        </div>
        <div>
          <label className={labelCls}>
            Phone <span className="text-red-400">*</span>
          </label>
          <input
            className={inputCls}
            value={person.phone}
            onChange={(e) => onChange('phone', formatPhone(e.target.value))}
            placeholder="(555) 000-0000"
          />
        </div>
        <div>
          <label className={labelCls}>Email</label>
          <input
            className={inputCls}
            value={person.email}
            onChange={(e) => onChange('email', e.target.value)}
            placeholder="optional"
          />
        </div>
        <div>
          <label className={labelCls}>DL / State ID</label>
          <input
            className={inputCls}
            value={person.dlStateIdNumber}
            onChange={(e) => onChange('dlStateIdNumber', e.target.value)}
            placeholder="optional"
          />
        </div>
        <div>
          <label className={labelCls}>Vehicle Info</label>
          <input
            className={inputCls}
            value={person.vehicleInfo}
            onChange={(e) => onChange('vehicleInfo', e.target.value)}
            placeholder="optional"
          />
        </div>
        <div>
          <label className={labelCls}>License Plate State</label>
          <input
            className={inputCls}
            value={person.licensePlateState}
            onChange={(e) => onChange('licensePlateState', e.target.value)}
            placeholder="optional"
          />
        </div>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-[#4a7c59] text-white text-sm rounded-full font-semibold disabled:opacity-50 cursor-pointer hover:bg-[#3d6b4a] transition-colors"
        >
          {saving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Check className="w-3.5 h-3.5" />
          )}
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-1.5 text-gray-500 text-sm rounded-full hover:text-gray-700 transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
          Cancel
        </button>
      </div>
    </div>
  )
}

function CompactPickupPersonForm({
  person,
  onChange,
  onCancel,
  onSave,
  saving,
  error,
}: Omit<PickupPersonFormProps, 'variant'>) {
  const fieldStyle: CSSProperties = {
    width: '100%',
    fontSize: 12,
    padding: '6px 8px',
    borderRadius: 6,
    border: '1px solid #E2E8F0',
    color: '#1E293B',
  }
  const labelStyle: CSSProperties = {
    display: 'block',
    fontSize: 10,
    color: '#94A3B8',
    marginBottom: 3,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div>
          <label style={labelStyle}>Full name *</label>
          <input
            style={fieldStyle}
            value={person.fullName}
            onChange={(e) => onChange('fullName', e.target.value)}
          />
        </div>
        <div>
          <label style={labelStyle}>Relationship *</label>
          <input
            style={fieldStyle}
            value={person.relationship}
            onChange={(e) => onChange('relationship', e.target.value)}
          />
        </div>
        <div>
          <label style={labelStyle}>Phone *</label>
          <input
            style={fieldStyle}
            value={person.phone}
            onChange={(e) => onChange('phone', formatPhone(e.target.value))}
          />
        </div>
        <div>
          <label style={labelStyle}>Email</label>
          <input
            style={fieldStyle}
            value={person.email}
            onChange={(e) => onChange('email', e.target.value)}
          />
        </div>
        <div>
          <label style={labelStyle}>DL / State ID</label>
          <input
            style={fieldStyle}
            value={person.dlStateIdNumber}
            onChange={(e) => onChange('dlStateIdNumber', e.target.value)}
          />
        </div>
        <div>
          <label style={labelStyle}>Vehicle</label>
          <input
            style={fieldStyle}
            value={person.vehicleInfo}
            onChange={(e) => onChange('vehicleInfo', e.target.value)}
          />
        </div>
        <div>
          <label style={labelStyle}>Plate state</label>
          <input
            style={fieldStyle}
            value={person.licensePlateState}
            onChange={(e) => onChange('licensePlateState', e.target.value)}
          />
        </div>
      </div>
      {error && <p style={{ fontSize: 11, color: '#DC2626', margin: 0 }}>{error}</p>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          style={{
            fontSize: 12,
            fontWeight: 600,
            padding: '6px 12px',
            borderRadius: 6,
            border: 'none',
            backgroundColor: '#4A6354',
            color: '#fff',
            cursor: saving ? 'default' : 'pointer',
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          style={{
            fontSize: 12,
            padding: '6px 12px',
            borderRadius: 6,
            border: '1px solid #E2E8F0',
            backgroundColor: '#fff',
            color: '#64748B',
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
