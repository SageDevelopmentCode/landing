'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { motion, AnimatePresence } from 'framer-motion'
import { colors, radius, shadows, animations } from '../design-system'
import { Merriweather } from 'next/font/google'

const merriweather = Merriweather({
  weight: ['300', '400', '700', '900'],
  subsets: ['latin'],
})

type Contract = {
  id: string
  title: string
  content: string
  version: number
  is_active: boolean
  created_at: string
  updated_at: string
}

type ContractHistory = {
  id: string
  document_id: string
  title: string
  content: string
  version: number
  saved_at: string
}

export default function ContractsPage() {
  const router = useRouter()
  const [contracts, setContracts] = useState<Contract[]>([])
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [history, setHistory] = useState<ContractHistory[]>([])
  const [isDiffOpen, setIsDiffOpen] = useState(false)
  const [diffVersion, setDiffVersion] = useState<ContractHistory | null>(null)
  const [diffContent, setDiffContent] = useState('')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function fetchContracts() {
    const { data, error } = await supabase
      .schema('contracts')
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error) {
      setContracts(data || [])
      if (data && data.length > 0 && !selectedContract) {
        setSelectedContract(data[0])
      }
    }
    setIsLoading(false)
  }

  async function fetchHistory(documentId: string) {
    const { data } = await supabase
      .schema('contracts')
      .from('history')
      .select('*')
      .eq('document_id', documentId)
      .order('saved_at', { ascending: false })
    setHistory(data || [])
  }

  useEffect(() => {
    fetchContracts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (selectedContract) fetchHistory(selectedContract.id)
    else setHistory([])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedContract?.id])

  function openDiffFromViewer(contract: Contract) {
    setDiffContent(contract.content)
    setDiffVersion(history[0])
    setIsDiffOpen(true)
  }

  function closeDiff() {
    setIsDiffOpen(false)
    setDiffVersion(null)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-12">
        <p style={{ color: colors.textSecondary }}>Loading...</p>
      </div>
    )
  }

  return (
    <div
      className="flex h-full overflow-hidden -mx-3 sm:-mx-4 lg:-mx-6 -my-8"
      style={{ borderTop: `1px solid ${colors.border}` }}
    >
      {/* Left sidebar */}
      <div
        className="w-72 flex-shrink-0 flex flex-col overflow-hidden"
        style={{ borderRight: `1px solid ${colors.border}` }}
      >
        {/* Sidebar header */}
        <div
          className="flex items-center justify-between px-4 py-4 flex-shrink-0"
          style={{ borderBottom: `1px solid ${colors.divider}` }}
        >
          <div>
            <h1
              className={`text-lg font-bold ${merriweather.className}`}
              style={{ color: colors.mistyForest }}
            >
              Contracts
            </h1>
            <p className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>
              {contracts.length} document{contracts.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => router.push('/admin/contracts/new')}
            className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium text-white transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              backgroundColor: colors.mistyForest,
              borderRadius: radius.md,
              boxShadow: shadows.soft,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <svg className="-ml-0.5 mr-1 h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add
          </button>
        </div>

        {/* Scrollable contract list */}
        <div className="flex-1 overflow-y-auto">
          {contracts.length === 0 ? (
            <div className="p-8 text-center">
              <svg
                className="mx-auto mb-3 h-10 w-10"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{ color: colors.textTertiary }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-sm" style={{ color: colors.textTertiary }}>
                No contracts yet
              </p>
            </div>
          ) : (
            <ul className="p-2 space-y-1">
              {contracts.map((contract, index) => {
                const isSelected = selectedContract?.id === contract.id
                return (
                  <motion.li
                    key={contract.id}
                    initial={animations.fadeIn.initial}
                    animate={animations.fadeIn.animate}
                    transition={{ ...animations.fadeIn.transition, delay: index * 0.04 }}
                  >
                    <button
                      onClick={() => setSelectedContract(contract)}
                      className="w-full text-left px-4 py-3 transition-all duration-200"
                      style={{
                        backgroundColor: isSelected ? colors.pastelSage : 'transparent',
                        borderRadius: radius.md,
                        cursor: 'pointer',
                        border: 'none',
                      }}
                    >
                      <div
                        className="font-medium text-sm truncate"
                        style={{ color: isSelected ? colors.mistyForest : colors.textPrimary }}
                      >
                        {contract.title}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs" style={{ color: colors.textTertiary }}>
                          v{contract.version} · {new Date(contract.created_at).toLocaleDateString()}
                        </span>
                        <span
                          className="inline-flex items-center px-1.5 py-0.5 text-xs rounded-full"
                          style={{
                            backgroundColor: contract.is_active ? colors.success : colors.border,
                            color: contract.is_active ? colors.successText : colors.textSecondary,
                          }}
                        >
                          {contract.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </button>
                  </motion.li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Right panel: viewer */}
      <div className="flex-1 overflow-y-auto" style={{ backgroundColor: colors.softCloud }}>
        {selectedContract ? (
          <motion.div
            key={selectedContract.id}
            initial={animations.fadeIn.initial}
            animate={animations.fadeIn.animate}
            transition={animations.fadeIn.transition}
            className="min-h-full"
          >
            {/* Viewer header */}
            <div
              className="flex items-center justify-between px-8 py-5"
              style={{ borderBottom: `1px solid ${colors.divider}` }}
            >
              <div>
                <h2
                  className={`text-xl font-bold ${merriweather.className}`}
                  style={{ color: colors.mistyForest }}
                >
                  {selectedContract.title}
                </h2>
                <p className="text-sm mt-0.5" style={{ color: colors.textSecondary }}>
                  Version {selectedContract.version} · Last updated{' '}
                  {new Date(selectedContract.updated_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center px-3 py-1.5 text-sm transition-all duration-200 hover:scale-105 active:scale-95"
                  style={{
                    backgroundColor: colors.warmLinen,
                    color: colors.textSecondary,
                    borderRadius: radius.md,
                    border: `1px solid ${colors.border}`,
                    cursor: 'pointer',
                  }}
                >
                  <svg className="mr-1.5 h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print
                </button>
                {history.length > 0 && (
                  <button
                    onClick={() => openDiffFromViewer(selectedContract)}
                    className="inline-flex items-center px-3 py-1.5 text-sm transition-all duration-200 hover:scale-105 active:scale-95"
                    style={{
                      backgroundColor: colors.warmLinen,
                      color: colors.textSecondary,
                      borderRadius: radius.md,
                      border: `1px solid ${colors.border}`,
                      cursor: 'pointer',
                    }}
                  >
                    History ▾
                  </button>
                )}
                <button
                  onClick={() => router.push(`/admin/contracts/${selectedContract.id}/edit`)}
                  className="inline-flex items-center px-3 py-1.5 text-sm text-white transition-all duration-200 hover:scale-105 active:scale-95"
                  style={{
                    backgroundColor: colors.mistyForest,
                    borderRadius: radius.md,
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <svg className="mr-1.5 h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
              </div>
            </div>

            {/* Contract body */}
            <div className="px-8 py-6 text-sm">
              <div
                dangerouslySetInnerHTML={{ __html: selectedContract.content }}
                className="tiptap-view"
              />
            </div>
          </motion.div>
        ) : (
          <div
            className="flex flex-col items-center justify-center h-full"
            style={{ minHeight: '400px' }}
          >
            <svg
              className="h-12 w-12 mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{ color: colors.textTertiary }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p style={{ color: colors.textTertiary }}>Select a contract to view</p>
          </div>
        )}
      </div>

      {/* Diff overlay */}
      <AnimatePresence>
        {isDiffOpen && diffVersion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] flex flex-col"
            style={{ backgroundColor: colors.softCloud }}
          >
            {/* Diff header */}
            <div
              className="flex items-center justify-between px-6 py-4 flex-shrink-0"
              style={{ borderBottom: `1px solid ${colors.divider}` }}
            >
              <div className="flex items-center gap-4">
                <h2
                  className={`text-lg font-bold ${merriweather.className}`}
                  style={{ color: colors.mistyForest }}
                >
                  Version History
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm" style={{ color: colors.textSecondary }}>
                    Compare with:
                  </span>
                  <select
                    value={diffVersion.id}
                    onChange={(e) => {
                      const v = history.find((h) => h.id === e.target.value)
                      if (v) setDiffVersion(v)
                    }}
                    className="text-sm outline-none px-2 py-1"
                    style={{
                      backgroundColor: colors.warmLinen,
                      border: `1px solid ${colors.border}`,
                      borderRadius: radius.md,
                      color: colors.textPrimary,
                      cursor: 'pointer',
                    }}
                  >
                    {history.map((h) => (
                      <option key={h.id} value={h.id}>
                        v{h.version} — {new Date(h.saved_at).toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                onClick={closeDiff}
                className="inline-flex items-center px-3 py-1.5 text-sm transition-all duration-200 hover:scale-105 active:scale-95"
                style={{
                  backgroundColor: colors.warmLinen,
                  color: colors.textSecondary,
                  borderRadius: radius.md,
                  border: `1px solid ${colors.border}`,
                  cursor: 'pointer',
                }}
              >
                ← Back
              </button>
            </div>

            {/* Column headers */}
            <div
              className="flex flex-shrink-0"
              style={{ borderBottom: `1px solid ${colors.divider}` }}
            >
              <div
                className="flex-1 px-6 py-2 text-xs font-medium"
                style={{ color: colors.successText, backgroundColor: '#f0faf0' }}
              >
                Current
              </div>
              <div
                className="w-px flex-shrink-0"
                style={{ backgroundColor: colors.divider }}
              />
              <div
                className="flex-1 px-6 py-2 text-xs font-medium"
                style={{ color: colors.errorText, backgroundColor: '#fdf0f0' }}
              >
                v{diffVersion.version} — {new Date(diffVersion.saved_at).toLocaleString()}
              </div>
            </div>

            {/* Diff body */}
            <div className="flex flex-1 overflow-hidden">
              {/* Left: current version */}
              <div
                className="flex-1 overflow-y-auto px-8 py-6 text-sm"
                style={{ backgroundColor: '#f0faf0' }}
              >
                <div dangerouslySetInnerHTML={{ __html: diffContent }} className="tiptap-view" />
              </div>

              <div className="w-px flex-shrink-0" style={{ backgroundColor: colors.divider }} />

              {/* Right: history version */}
              <div
                className="flex-1 overflow-y-auto px-8 py-6 text-sm"
                style={{ backgroundColor: '#fdf0f0' }}
              >
                <div dangerouslySetInnerHTML={{ __html: diffVersion.content }} className="tiptap-view" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
