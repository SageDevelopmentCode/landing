'use client'

import { useState } from 'react'
import { UserPlus } from 'lucide-react'
import ManageAccessModal from './ManageAccessModal'

export default function ManageAccessButton({ isSharedAccess }: { isSharedAccess: boolean }) {
  const [isOpen, setIsOpen] = useState(false)

  if (isSharedAccess) return null

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        title="Manage dashboard access"
        className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
      >
        <UserPlus className="w-5 h-5" />
      </button>
      <ManageAccessModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}
