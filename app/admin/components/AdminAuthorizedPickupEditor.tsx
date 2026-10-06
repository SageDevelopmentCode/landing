'use client'

import { useState } from 'react'
import { Car, Clock, Pencil, Plus, Trash2 } from 'lucide-react'
import { adminSaveAuthorizedPickup } from '@/app/actions/adminSaveAuthorizedPickup'
import type { StudentAuthorizedPickupPerson } from '@/app/actions/getAdminEnrollmentData'
import {
  PickupPersonForm,
  blankPickupPerson,
  pickupPersonRowToEditable,
  validatePickupPersonEntry,
  editableToPickupEntries,
  type EditablePickupPerson,
} from '@/app/components/authorized-pickup/PickupPersonForm'

type Props = {
  parentId: string
  studentId: string
  persons: StudentAuthorizedPickupPerson[]
  dateOfRequest: string | null
  effectiveUntil: string | null
  onSaved: () => void
}

export function AdminAuthorizedPickupEditor({
  parentId,
  studentId,
  persons: initialPersons,
  dateOfRequest: initialDateOfRequest,
  effectiveUntil: initialEffectiveUntil,
  onSaved,
}: Props) {
  const [persons, setPersons] = useState<EditablePickupPerson[]>(() =>
    initialPersons.map(pickupPersonRowToEditable)
  )
  const [dateOfRequest, setDateOfRequest] = useState(initialDateOfRequest ?? '')
  const [effectiveUntil, setEffectiveUntil] = useState(initialEffectiveUntil ?? '')
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<EditablePickupPerson | null>(null)
  const [addingNew, setAddingNew] = useState(false)
  const [newDraft, setNewDraft] = useState<EditablePickupPerson>(() => blankPickupPerson())
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  async function commitSave(updatedPersons: EditablePickupPerson[]) {
    setSaving(true)
    setFormError(null)
    const result = await adminSaveAuthorizedPickup(parentId, {
      studentId,
      dateOfRequest: dateOfRequest || new Date().toISOString().slice(0, 10),
      effectiveUntil: effectiveUntil || '',
      persons: editableToPickupEntries(updatedPersons),
    })
    setSaving(false)
    if (result.error) {
      setFormError(result.error)
      return false
    }
    onSaved()
    return true
  }

  async function handleSaveEdit() {
    if (!editDraft) return
    const err = validatePickupPersonEntry(editDraft)
    if (err) {
      setFormError(err)
      return
    }
    const updated = persons.map((p) => (p._key === editDraft._key ? editDraft : p))
    const ok = await commitSave(updated)
    if (ok) {
      setPersons(updated)
      setEditingKey(null)
      setEditDraft(null)
    }
  }

  async function handleSaveNew() {
    const err = validatePickupPersonEntry(newDraft)
    if (err) {
      setFormError(err)
      return
    }
    const updated = [...persons, newDraft]
    const ok = await commitSave(updated)
    if (ok) {
      setPersons(updated)
      setAddingNew(false)
      setNewDraft(blankPickupPerson())
    }
  }

  async function handleDelete(key: string) {
    const updated = persons.filter((p) => p._key !== key)
    const ok = await commitSave(updated)
    if (ok) setPersons(updated)
  }

  function startEdit(person: EditablePickupPerson) {
    setAddingNew(false)
    setFormError(null)
    setEditingKey(person._key)
    setEditDraft({ ...person })
  }

  function startAdd() {
    setEditingKey(null)
    setEditDraft(null)
    setFormError(null)
    setNewDraft(blankPickupPerson())
    setAddingNew(true)
  }

  const showPlanDates = persons.length > 0 || addingNew

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 4 }}>
      {effectiveUntil && editingKey === null && !addingNew && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <Clock size={11} color="#94A3B8" />
          <span style={{ fontSize: 11, color: '#94A3B8' }}>Effective until: {effectiveUntil}</span>
        </div>
      )}

      {showPlanDates && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 4 }}>
          <div>
            <label style={{ fontSize: 10, color: '#94A3B8', display: 'block', marginBottom: 3 }}>
              Date of request
            </label>
            <input
              type="date"
              value={dateOfRequest}
              onChange={(e) => setDateOfRequest(e.target.value)}
              disabled={saving || editingKey !== null}
              style={{
                width: '100%',
                fontSize: 12,
                padding: '6px 8px',
                borderRadius: 6,
                border: '1px solid #E2E8F0',
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: 10, color: '#94A3B8', display: 'block', marginBottom: 3 }}>
              Effective until
            </label>
            <input
              type="date"
              value={effectiveUntil}
              onChange={(e) => setEffectiveUntil(e.target.value)}
              disabled={saving || editingKey !== null}
              style={{
                width: '100%',
                fontSize: 12,
                padding: '6px 8px',
                borderRadius: 6,
                border: '1px solid #E2E8F0',
              }}
            />
          </div>
        </div>
      )}

      {persons.length === 0 && !addingNew && (
        <p style={{ fontSize: 12, color: '#94A3B8', padding: '4px 0', margin: 0 }}>
          No authorized pickup persons on file.
        </p>
      )}

      {persons.map((p, i) => (
        <div key={p._key}>
          {i > 0 && (
            <div style={{ borderTop: '1px solid #E2E8F0', marginBottom: 8 }} />
          )}
          {editingKey === p._key && editDraft ? (
            <PickupPersonForm
              variant="compact"
              person={editDraft}
              onChange={(field, value) =>
                setEditDraft((prev) => (prev ? { ...prev, [field]: value } : prev))
              }
              onCancel={() => {
                setEditingKey(null)
                setEditDraft(null)
                setFormError(null)
              }}
              onSave={handleSaveEdit}
              saving={saving}
              error={formError}
            />
          ) : (
            <div
              style={{
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: 8,
                padding: '10px 12px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 8,
                  marginBottom: 5,
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>{p.fullName}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  <span style={{ fontSize: 11, color: '#4A6354', fontWeight: 500 }}>{p.relationship}</span>
                  <button
                    type="button"
                    onClick={() => startEdit(p)}
                    disabled={saving || addingNew}
                    title="Edit"
                    style={{
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      padding: 4,
                      color: '#64748B',
                    }}
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(p._key)}
                    disabled={saving || addingNew}
                    title="Remove"
                    style={{
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      padding: 4,
                      color: '#64748B',
                    }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {p.phone && <span style={{ fontSize: 11, color: '#475569' }}>{p.phone}</span>}
                {p.email && <span style={{ fontSize: 11, color: '#475569' }}>{p.email}</span>}
                {p.vehicleInfo && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                    <Car size={11} color="#94A3B8" />
                    <span style={{ fontSize: 11, color: '#94A3B8' }}>
                      {p.vehicleInfo}
                      {p.licensePlateState ? ` · ${p.licensePlateState}` : ''}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ))}

      {addingNew && (
        <div style={{ marginTop: persons.length > 0 ? 8 : 0 }}>
          <p style={{ fontSize: 10, fontWeight: 600, color: '#64748B', marginBottom: 8 }}>NEW PERSON</p>
          <PickupPersonForm
            variant="compact"
            person={newDraft}
            onChange={(field, value) => setNewDraft((prev) => ({ ...prev, [field]: value }))}
            onCancel={() => {
              setAddingNew(false)
              setFormError(null)
            }}
            onSave={handleSaveNew}
            saving={saving}
            error={formError}
          />
        </div>
      )}

      {!addingNew && editingKey === null && (
        <button
          type="button"
          onClick={startAdd}
          disabled={saving}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginTop: 4,
            fontSize: 12,
            fontWeight: 600,
            color: '#2563EB',
            background: 'none',
            border: 'none',
            cursor: saving ? 'default' : 'pointer',
            padding: 0,
          }}
        >
          <Plus size={14} />
          Add person
        </button>
      )}
    </div>
  )
}
