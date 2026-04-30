import { createAdminClient } from '@/app/lib/supabase-server'
import { DropoffsClient } from './DropoffsClient'

export type DropoffKid = {
  id: string
  name: string | null
  grade: string | null
  dob_year: string | null
}

export type DropoffRow = {
  parent_id: string
  slot: string
  updated_at: string
  parent_name: string | null
  parent_email: string | null
  kids: DropoffKid[]
}

export default async function DropoffsPage() {
  const adminClient = createAdminClient()

  const { data: dropoffs } = await adminClient
    .schema('parent_app')
    .from('dropoff_times')
    .select('parent_id, slot, updated_at')
    .order('updated_at', { ascending: false })

  const rows = dropoffs ?? []
  const parentIds = [...new Set(rows.map((r) => r.parent_id))]

  const [{ data: users }, { data: students }] = await Promise.all([
    parentIds.length > 0
      ? adminClient
          .schema('admin')
          .from('users')
          .select('id, full_name, email')
          .in('id', parentIds)
      : Promise.resolve({ data: [] }),
    parentIds.length > 0
      ? adminClient
          .schema('admin')
          .from('students')
          .select('id, parent_id, child_legal_name, child_grade, dob_year')
          .in('parent_id', parentIds)
          .eq('is_deleted', false)
      : Promise.resolve({ data: [] }),
  ])

  const userMap: Record<string, { full_name: string | null; email: string | null }> = {}
  for (const u of users ?? []) {
    userMap[u.id] = { full_name: u.full_name, email: u.email }
  }

  const kidsMap: Record<string, DropoffKid[]> = {}
  for (const s of students ?? []) {
    if (!kidsMap[s.parent_id]) kidsMap[s.parent_id] = []
    kidsMap[s.parent_id].push({
      id: s.id,
      name: s.child_legal_name,
      grade: s.child_grade,
      dob_year: s.dob_year ?? null,
    })
  }

  const enriched: DropoffRow[] = rows.map((r) => ({
    parent_id: r.parent_id,
    slot: r.slot,
    updated_at: r.updated_at,
    parent_name: userMap[r.parent_id]?.full_name ?? null,
    parent_email: userMap[r.parent_id]?.email ?? null,
    kids: kidsMap[r.parent_id] ?? [],
  }))

  return (
    <div className="space-y-6 pt-6">
      <div>
        <h1 className="text-xl font-semibold" style={{ color: 'var(--admin-text-primary)' }}>
          Drop-Offs
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--admin-text-tertiary)' }}>
          {enriched.length} {enriched.length === 1 ? 'family' : 'families'} have selected a drop-off time
        </p>
      </div>
      <DropoffsClient rows={enriched} />
    </div>
  )
}
