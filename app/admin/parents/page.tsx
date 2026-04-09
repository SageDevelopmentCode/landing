import { createAdminClient } from '@/app/lib/supabase-server'
import { cssColors as colors } from '../design-system'
import { Merriweather } from 'next/font/google'
import { ParentsClient } from './ParentsClient'

const merriweather = Merriweather({
  weight: ['300', '400', '700', '900'],
  subsets: ['latin'],
})

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

async function fetchParentDetail(parentId: string) {
  'use server'
  const client = createAdminClient()

  const [{ data: children }, { data: applications }] = await Promise.all([
    client
      .schema('admin')
      .from('students')
      .select('id, child_legal_name, dob_month, dob_day, dob_year')
      .eq('parent_id', parentId)
      .eq('is_deleted', false),
    client
      .schema('parent_app')
      .from('applications')
      .select('id, child_legal_name, program, drop_in_program, status, approved, approved_at, updated_at')
      .eq('user_id', parentId),
  ])

  return {
    children: (children ?? []) as {
      id: string
      child_legal_name: string | null
      dob_month: string | null
      dob_day: string | null
      dob_year: string | null
    }[],
    applications: (applications ?? []) as {
      id: string
      child_legal_name: string | null
      program: string | null
      drop_in_program: string | null
      status: string
      approved: boolean
      approved_at: string | null
      updated_at: string | null
    }[],
  }
}

export default async function ParentsPage() {
  const { data: parents } = await createAdminClient()
    .schema('admin')
    .from('users')
    .select('*')
    .eq('role', 'parent')
    .eq('is_deleted', false)
    .order('full_name')

  const rows = (parents ?? []) as Parent[]

  return (
    <div className="space-y-6 pt-6">
      <div>
        <h1
          className={`text-2xl font-bold ${merriweather.className}`}
          style={{ color: colors.mistyForest }}
        >
          Parents
        </h1>
        <p className="mt-2" style={{ color: colors.textSecondary }}>
          {rows.length} parent{rows.length !== 1 ? 's' : ''}
        </p>
      </div>

      <ParentsClient parents={rows} fetchParentDetail={fetchParentDetail} />
    </div>
  )
}
