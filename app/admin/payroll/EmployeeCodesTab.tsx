'use client'

import { useState } from 'react'
import { Check, Hash, Save, Shuffle } from 'lucide-react'
import { Table, TableRow, TableCell } from '../components/Table'
import { cssColors as colors } from '../design-system'
import { setEmployeeCode } from '@/app/actions/timeclock'
import type { TeacherRate } from './PayrollClient'

export type TeacherWithCode = TeacherRate & { employee_code: string | null }

export function EmployeeCodesTab({ teachers: initial }: { teachers: TeacherWithCode[] }) {
  const [teachers, setTeachers] = useState(initial)
  const [codes, setCodes] = useState<Record<string, string>>(
    Object.fromEntries(initial.map((t) => [t.id, t.employee_code ?? '']))
  )
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  function generateCode(teacherId: string) {
    const used = new Set(Object.values(codes).filter((c) => c.length === 5))
    let code: string
    do {
      code = String(Math.floor(Math.random() * 90000) + 10000)
    } while (used.has(code))
    setCodes((c) => ({ ...c, [teacherId]: code }))
    setErrors((e) => ({ ...e, [teacherId]: '' }))
  }

  async function handleSave(teacherId: string) {
    const code = codes[teacherId]?.trim()
    if (!/^\d{5}$/.test(code)) {
      setErrors((e) => ({ ...e, [teacherId]: 'Must be exactly 5 digits' }))
      return
    }
    setErrors((e) => ({ ...e, [teacherId]: '' }))
    setSaving((s) => ({ ...s, [teacherId]: true }))
    const result = await setEmployeeCode(teacherId, code)
    setSaving((s) => ({ ...s, [teacherId]: false }))
    if (result.error) {
      setErrors((e) => ({ ...e, [teacherId]: result.error! }))
    } else {
      setSaved((s) => ({ ...s, [teacherId]: true }))
      setTeachers((prev) => prev.map((t) => t.id === teacherId ? { ...t, employee_code: code } : t))
      setTimeout(() => setSaved((s) => ({ ...s, [teacherId]: false })), 2000)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <Hash className="w-3.5 h-3.5" style={{ color: colors.textTertiary }} />
        <p className="text-xs" style={{ color: colors.textSecondary }}>
          Assign a 5-digit PIN to each employee. They use this code to clock in on the{' '}
          <a href="/timeclock" target="_blank" className="underline" style={{ color: colors.accent }}>
            /timeclock
          </a>{' '}
          kiosk page.
        </p>
      </div>

      <Table headers={['Teacher', 'Email', 'Employee Code', '']}>
        {teachers.map((t, i) => (
          <TableRow key={t.id} index={i}>
            <TableCell>
              <span style={{ color: colors.textPrimary, fontWeight: 500 }}>{t.full_name ?? '—'}</span>
            </TableCell>
            <TableCell>{t.email}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={5}
                  value={codes[t.id] ?? ''}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 5)
                    setCodes((c) => ({ ...c, [t.id]: val }))
                    setErrors((err) => ({ ...err, [t.id]: '' }))
                  }}
                  placeholder="5 digits"
                  className="px-2.5 py-1 rounded-md text-xs w-24 font-mono tracking-widest focus:outline-none focus:ring-1"
                  style={{
                    background: colors.elevated,
                    border: `1px solid ${colors.border}`,
                    color: colors.textPrimary,
                  }}
                />
                <button
                  onClick={() => generateCode(t.id)}
                  title="Generate random code"
                  className="p-1 rounded-md transition-colors"
                  style={{ color: colors.textTertiary, background: colors.elevated, border: `1px solid ${colors.border}` }}
                >
                  <Shuffle className="w-3.5 h-3.5" />
                </button>
                {errors[t.id] && (
                  <span className="text-[10px]" style={{ color: colors.error }}>{errors[t.id]}</span>
                )}
              </div>
            </TableCell>
            <TableCell>
              <button
                onClick={() => handleSave(t.id)}
                disabled={saving[t.id]}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors disabled:opacity-50"
                style={{
                  background: saved[t.id] ? colors.successBg : colors.accentLight,
                  color: saved[t.id] ? colors.success : colors.accent,
                  border: `1px solid ${saved[t.id] ? colors.successBorder : 'transparent'}`,
                }}
              >
                {saved[t.id] ? <Check className="w-3 h-3" /> : <Save className="w-3 h-3" />}
                {saving[t.id] ? 'Saving…' : saved[t.id] ? 'Saved' : 'Save'}
              </button>
            </TableCell>
          </TableRow>
        ))}
      </Table>
    </div>
  )
}
