'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Merriweather } from 'next/font/google'
import { colors, radius, shadows } from '../../design-system'
import ContractEditor from '../components/ContractEditor'

const merriweather = Merriweather({
  weight: ['300', '400', '700', '900'],
  subsets: ['latin'],
})

export default function NewContractPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function handleSave() {
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required.')
      return
    }

    setIsSaving(true)
    setError(null)

    const { error: insertError } = await supabase
      .schema('contracts')
      .from('documents')
      .insert({
        title: title.trim(),
        content: content.trim(),
        is_active: isActive,
      })

    if (insertError) {
      setError(insertError.message)
      setIsSaving(false)
    } else {
      router.push('/admin/contracts')
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/admin/contracts')}
          className="inline-flex items-center gap-1.5 text-sm transition-colors duration-200"
          style={{ color: colors.textSecondary, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Contracts
        </button>
        <span style={{ color: colors.border }}>/</span>
        <h1
          className={`text-xl font-bold ${merriweather.className}`}
          style={{ color: colors.mistyForest }}
        >
          Add Contract
        </h1>
      </div>

      {/* Form */}
      <div
        className="space-y-5 px-8 py-6"
        style={{
          backgroundColor: colors.softCloud,
          borderRadius: radius.lg,
          border: `1px solid ${colors.border}`,
          boxShadow: shadows.soft,
        }}
      >
        {error && (
          <div
            className="px-4 py-3 text-sm"
            style={{
              backgroundColor: colors.error,
              color: colors.errorText,
              borderRadius: radius.md,
            }}
          >
            {error}
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: colors.textPrimary }}>
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Enrollment Agreement 2025"
            className="w-full px-3 py-2 text-sm outline-none"
            style={{
              backgroundColor: colors.warmLinen,
              border: `1px solid ${colors.border}`,
              borderRadius: radius.md,
              color: colors.textPrimary,
            }}
          />
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: colors.textPrimary }}>
            Content
          </label>
          <ContractEditor content={content} onChange={setContent} />
        </div>

        {/* Active toggle */}
        <div className="flex items-center gap-3">
          <button
            role="switch"
            aria-checked={isActive}
            onClick={() => setIsActive((v) => !v)}
            className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200"
            style={{
              backgroundColor: isActive ? colors.mistyForest : colors.border,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <span
              className="inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform duration-200"
              style={{ transform: isActive ? 'translateX(18px)' : 'translateX(2px)' }}
            />
          </button>
          <span className="text-sm" style={{ color: colors.textPrimary }}>
            Active
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3">
        <button
          onClick={() => router.push('/admin/contracts')}
          className="px-4 py-2 text-sm transition-all duration-200 hover:scale-105 active:scale-95"
          style={{
            backgroundColor: colors.warmLinen,
            color: colors.textSecondary,
            borderRadius: radius.md,
            border: `1px solid ${colors.border}`,
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
          style={{
            backgroundColor: colors.mistyForest,
            borderRadius: radius.md,
            border: 'none',
            cursor: isSaving ? 'not-allowed' : 'pointer',
            boxShadow: shadows.soft,
          }}
        >
          {isSaving ? 'Saving...' : 'Add Contract'}
        </button>
      </div>
    </div>
  )
}
