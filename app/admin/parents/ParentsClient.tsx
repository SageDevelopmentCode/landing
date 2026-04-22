'use client'

import { useState } from 'react'
import { Table, TableRow, TableCell } from '../components/Table'
import { ParentDetailSidebar } from '../components/ParentDetailSidebar'

type Parent = {
  id: string
  email: string | null
  full_name: string | null
  g1_cell_phone: string | null
  g1_work_phone: string | null
  g1_preferred_contact: boolean | null
  g1_lives_with_child: boolean | null
  g1_has_custody: boolean | null
  g2_full_name: string | null
  g2_relationship: string | null
  g2_email: string | null
  g2_cell_phone: string | null
  g2_work_phone: string | null
  [key: string]: unknown
}

type ParentDetail = {
  children: {
    id: string
    child_legal_name: string | null
    dob_month: string | null
    dob_day: string | null
    dob_year: string | null
  }[]
  applications: {
    id: string
    child_legal_name: string | null
    program: string | null
    drop_in_program: string | null
    status: string
    approved: boolean
    approved_at: string | null
    updated_at: string | null
  }[]
}

interface ParentsClientProps {
  parents: Parent[]
  fetchParentDetail: (parentId: string) => Promise<ParentDetail>
}

export function ParentsClient({ parents: initialParents, fetchParentDetail }: ParentsClientProps) {
  const [parents, setParents] = useState<Parent[]>(initialParents)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedParent, setSelectedParent] = useState<Parent | null>(null)
  const [detail, setDetail] = useState<ParentDetail | null>(null)
  const [loading, setLoading] = useState(false)

  const handleRowClick = async (parent: Parent) => {
    setSelectedParent(parent)
    setDetail(null)
    setLoading(true)
    try {
      const result = await fetchParentDetail(parent.id)
      setDetail(result)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setSelectedParent(null)
    setDetail(null)
  }

  const handleParentDeleted = (parentId: string) => {
    setParents((prev) => prev.filter((p) => p.id !== parentId))
  }

  const filteredParents = searchQuery
    ? parents.filter((p) => {
        const q = searchQuery.toLowerCase()
        return (
          p.full_name?.toLowerCase().includes(q) ||
          p.email?.toLowerCase().includes(q) ||
          p.g1_cell_phone?.toLowerCase().includes(q) ||
          p.g2_full_name?.toLowerCase().includes(q) ||
          p.g2_email?.toLowerCase().includes(q) ||
          p.g2_cell_phone?.toLowerCase().includes(q)
        )
      })
    : parents

  return (
    <>
      <div className="flex items-center gap-1.5 p-1 rounded-xl w-fit mb-4" style={{ backgroundColor: '#F5F0E8', border: '1px solid #E8E0D0' }}>
        <svg className="ml-1.5 w-3.5 h-3.5 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pr-2 py-0.5 text-xs font-semibold bg-transparent border-none outline-none w-40 placeholder:font-normal text-gray-500"
        />
      </div>
      <Table
        headers={[
          'Full Name',
          'G1 Cell Phone',
          'G2 Full Name',
          'G2 Relationship',
          'G2 Email',
          'G2 Cell Phone',
        ]}
      >
        {filteredParents.map((parent, index) => (
          <TableRow key={parent.id} index={index} onClick={() => handleRowClick(parent)}>
            <TableCell>
              <div className="font-medium">{parent.full_name ?? '—'}</div>
            </TableCell>
            <TableCell>{parent.g1_cell_phone ?? '—'}</TableCell>
            <TableCell>{parent.g2_full_name ?? '—'}</TableCell>
            <TableCell>{parent.g2_relationship ?? '—'}</TableCell>
            <TableCell>{parent.g2_email ?? '—'}</TableCell>
            <TableCell>{parent.g2_cell_phone ?? '—'}</TableCell>
          </TableRow>
        ))}
      </Table>

      <ParentDetailSidebar
        parent={selectedParent}
        detail={detail}
        loading={loading}
        onClose={handleClose}
        onParentDeleted={handleParentDeleted}
      />
    </>
  )
}
