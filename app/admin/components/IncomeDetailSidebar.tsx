'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { DetailSidebar } from './DetailSidebar'
import { SidebarField, SidebarSection } from '../../components/SidebarPrimitives'
import type { Tables } from '../../types/database.types'
type BudgetIncome = Tables<{ schema: "budget" }, "income">
import { cssColors as colors, radius } from '../design-system'

const SOURCE_LABELS: Record<string, string> = {
  tuition:          'Tuition',
  aftercare:        'After Care',
  fun_friday:       'Fun Friday',
  summer:           'Summer Program',
  donation:         'Donation',
  grant:            'Grant',
  registration_fee: 'Registration Fee',
  late_fee:         'Late Fee',
  other:            'Other',
}

const inputStyle = {
  border: `1px solid ${colors.border}`,
  borderRadius: radius.sm,
  padding: '6px 10px',
  fontSize: '14px',
  color: colors.textPrimary,
  backgroundColor: 'white',
  outline: 'none',
  width: '100%',
}

const btnPrimary = {
  backgroundColor: colors.mistyForest,
  color: 'white',
  border: 'none',
  borderRadius: radius.sm,
  padding: '7px 14px',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
}

const btnGhost = {
  backgroundColor: 'transparent',
  color: colors.textSecondary,
  border: `1px solid ${colors.border}`,
  borderRadius: radius.sm,
  padding: '6px 12px',
  fontSize: '13px',
  cursor: 'pointer',
}

function formatDate(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null
  const d = new Date(dateStr + 'T00:00:00')
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

interface IncomeDetailSidebarProps {
  income: BudgetIncome | null
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
  students: { id: string; child_legal_name: string | null }[]
  parents: { id: string; full_name: string | null }[]
}

export function IncomeDetailSidebar({
  income,
  isOpen,
  onClose,
  onSaved,
  students,
  parents,
}: IncomeDetailSidebarProps) {
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    amount: '',
    income_date: '',
    source: '',
    description: '',
  })

  // Sync form when income changes or edit mode opens
  function enterEdit() {
    if (!income) return
    setForm({
      amount: String(Number(income.amount)),
      income_date: income.income_date,
      source: income.source,
      description: income.description ?? '',
    })
    setEditMode(true)
  }

  function handleClose() {
    setEditMode(false)
    onClose()
  }

  async function handleSave() {
    if (!income) return
    setSaving(true)
    const db = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    await db
      .schema('budget')
      .from('income')
      .update({
        amount: Number(form.amount),
        income_date: form.income_date,
        source: form.source,
        description: form.description || null,
      })
      .eq('id', income.id)
    setSaving(false)
    setEditMode(false)
    onSaved()
  }

  const studentName = income?.student_id
    ? (students.find((s) => s.id === income.student_id)?.child_legal_name ?? income.student_id)
    : null

  const parentName = income?.parent_id
    ? (parents.find((p) => p.id === income.parent_id)?.full_name ?? income.parent_id)
    : null

  const amountDisplay = income
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
        Number(income.amount),
      )
    : null

  const footer = editMode ? (
    <div style={{ display: 'flex', gap: '8px' }}>
      <button style={btnPrimary} onClick={handleSave} disabled={saving}>
        {saving ? 'Saving…' : 'Save'}
      </button>
      <button style={btnGhost} onClick={() => setEditMode(false)}>
        Cancel
      </button>
    </div>
  ) : (
    <button style={btnPrimary} onClick={enterEdit}>
      Edit
    </button>
  )

  return (
    <DetailSidebar
      isOpen={isOpen}
      onClose={handleClose}
      title="Income Detail"
      footer={footer}
    >
      {income && !editMode && (
        <>
          <SidebarSection title="Details">
            <SidebarField label="Date" value={formatDate(income.income_date)} />
            <SidebarField label="Source" value={SOURCE_LABELS[income.source] ?? income.source} />
            <SidebarField label="Student" value={studentName} />
            <SidebarField label="Parent" value={parentName} />
            <SidebarField label="Description" value={income.description} />
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-gray-400 font-body">Amount</span>
              <span className="text-sm font-semibold font-body" style={{ color: colors.successText }}>
                {amountDisplay}
              </span>
            </div>
          </SidebarSection>
        </>
      )}

      {income && editMode && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label className="text-xs text-gray-400 font-body block mb-1">Amount</label>
            <input
              type="number"
              step="0.01"
              style={inputStyle}
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 font-body block mb-1">Date</label>
            <input
              type="date"
              style={inputStyle}
              value={form.income_date}
              onChange={(e) => setForm((f) => ({ ...f, income_date: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 font-body block mb-1">Source</label>
            <select
              style={inputStyle}
              value={form.source}
              onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
            >
              {Object.entries(SOURCE_LABELS).map(([val, label]) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 font-body block mb-1">Description</label>
            <input
              type="text"
              style={inputStyle}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
        </div>
      )}
    </DetailSidebar>
  )
}
