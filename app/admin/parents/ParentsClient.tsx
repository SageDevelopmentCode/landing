'use client'

import { useState } from 'react'
import { Table, TableRow, TableCell } from '../components/Table'
import { ParentDetailSidebar } from '../components/ParentDetailSidebar'

type Parent = {
  id: string
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

export function ParentsClient({ parents, fetchParentDetail }: ParentsClientProps) {
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

  return (
    <>
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
        {parents.map((parent, index) => (
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
      />
    </>
  )
}
