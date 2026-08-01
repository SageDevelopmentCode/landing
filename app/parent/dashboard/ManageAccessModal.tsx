'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState, useTransition } from 'react'
import { X, UserPlus, Loader2 } from 'lucide-react'
import {
  inviteForDashboardAccess,
  listDashboardGrants,
  revokeDashboardAccess,
} from '@/app/actions/dashboard-access'

type Grant = {
  id: string
  invited_email: string
  grantee_id: string | null
  status: string
  created_at: string
  accepted_at: string | null
}

interface ManageAccessModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ManageAccessModal({ isOpen, onClose }: ManageAccessModalProps) {
  const [email, setEmail] = useState('')
  const [grants, setGrants] = useState<Grant[]>([])
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteSuccess, setInviteSuccess] = useState(false)
  const [revokeError, setRevokeError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isRevoking, setIsRevoking] = useState<string | null>(null)

  async function loadGrants() {
    const result = await listDashboardGrants()
    if ('grants' in result) setGrants(result.grants as Grant[])
  }

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    let active = true
    void listDashboardGrants().then((result) => {
      if (active && 'grants' in result) setGrants(result.grants as Grant[])
    })
    return () => { active = false }
  }, [isOpen])

  function handleInvite() {
    setInviteError(null)
    setInviteSuccess(false)
    startTransition(async () => {
      const result = await inviteForDashboardAccess(email)
      if ('error' in result && result.error) {
        setInviteError(result.error)
      } else {
        setInviteSuccess(true)
        setEmail('')
        await loadGrants()
      }
    })
  }

  async function handleRevoke(grantId: string) {
    setRevokeError(null)
    setIsRevoking(grantId)
    const result = await revokeDashboardAccess(grantId)
    setIsRevoking(null)
    if ('error' in result && result.error) {
      setRevokeError(result.error)
    } else {
      await loadGrants()
    }
  }

  const statusLabel: Record<string, string> = {
    pending: 'Invite Sent',
    active: 'Active',
    revoked: 'Revoked',
  }

  const statusColor: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    active: 'bg-green-100 text-green-800',
    revoked: 'bg-gray-100 text-gray-500',
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div>
          <motion.div
            className="fixed inset-0 bg-black/60 z-[60]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-y-0 right-0 w-full max-w-md z-[70] bg-white flex flex-col shadow-2xl"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-gray-600" />
                <h2 className="text-base font-semibold text-gray-800">Manage Dashboard Access</h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
              {/* Invite section */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Invite someone</h3>
                <p className="text-sm text-gray-500 mb-4">
                  They&apos;ll receive an email with a link to access your child&apos;s dashboard.
                </p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleInvite() }}
                    placeholder="partner@email.com"
                    className="flex-1 border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent"
                    disabled={isPending}
                  />
                  <button
                    onClick={handleInvite}
                    disabled={isPending || !email.trim()}
                    className="px-4 py-2 bg-[#5a7a5a] text-white text-sm rounded-md hover:bg-[#4a6a4a] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors"
                  >
                    {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    Send invite
                  </button>
                </div>
                {inviteError && (
                  <p className="mt-2 text-sm text-red-600">{inviteError}</p>
                )}
                {inviteSuccess && (
                  <p className="mt-2 text-sm text-green-600">Invite sent successfully.</p>
                )}
              </div>

              {/* People with access */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">People with access</h3>
                {grants.length === 0 ? (
                  <p className="text-sm text-gray-400">No invites sent yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {grants.map((grant) => (
                      <li
                        key={grant.id}
                        className="flex items-center justify-between gap-3 py-2.5 border-b border-gray-50 last:border-0"
                      >
                        <div className="min-w-0">
                          <p className="text-sm text-gray-800 truncate">{grant.invited_email}</p>
                          <span className={`inline-block mt-0.5 text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[grant.status] ?? 'bg-gray-100 text-gray-500'}`}>
                            {statusLabel[grant.status] ?? grant.status}
                          </span>
                        </div>
                        {grant.status !== 'revoked' && (
                          <button
                            onClick={() => handleRevoke(grant.id)}
                            disabled={isRevoking === grant.id}
                            className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50 shrink-0 transition-colors"
                          >
                            {isRevoking === grant.id ? 'Revoking…' : 'Revoke'}
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                {revokeError && (
                  <p className="mt-2 text-sm text-red-600">{revokeError}</p>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
