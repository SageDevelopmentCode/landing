import { createAdminClient } from '@/app/lib/supabase-server'
import { PreferencesClient } from './PreferencesClient'

export type StudentPrefRow = {
  student_id: string
  student_name: string
  profile_image_url: string | null
  parent_id: string
  parent_name: string | null
  participation_level: 'watch' | 'cook_no_eat' | 'full' | null
}

export default async function PreferencesPage() {
  const adminClient = createAdminClient()

  const [
    { data: enrolledApps },
    { data: allStudents },
    { data: allParents },
    { data: allPrefs },
  ] = await Promise.all([
    adminClient
      .schema('parent_app')
      .from('applications')
      .select('student_id')
      .eq('status', 'enrolled'),
    adminClient
      .schema('admin')
      .from('students')
      .select('id, child_legal_name, profile_image_url, parent_id')
      .eq('is_deleted', false),
    adminClient
      .schema('admin')
      .from('users')
      .select('id, full_name')
      .eq('role', 'parent')
      .eq('is_deleted', false),
    adminClient
      .schema('parent_app')
      .from('student_default_preferences')
      .select('parent_id, student_id, participation_level'),
  ])

  const enrolledIds = new Set(
    (enrolledApps ?? []).map((a) => a.student_id).filter(Boolean)
  )

  const parentMap: Record<string, string | null> = {}
  for (const p of allParents ?? []) {
    parentMap[p.id] = p.full_name
  }

  const prefMap: Record<string, 'watch' | 'cook_no_eat' | 'full'> = {}
  for (const pref of allPrefs ?? []) {
    prefMap[pref.student_id] = pref.participation_level as 'watch' | 'cook_no_eat' | 'full'
  }

  const rows: StudentPrefRow[] = (allStudents ?? [])
    .filter((s) => enrolledIds.has(s.id))
    .map((s) => ({
      student_id: s.id,
      student_name: s.child_legal_name ?? 'Unknown',
      profile_image_url: s.profile_image_url ?? null,
      parent_id: s.parent_id,
      parent_name: parentMap[s.parent_id] ?? null,
      participation_level: prefMap[s.id] ?? null,
    }))
    .sort((a, b) => a.student_name.localeCompare(b.student_name))

  const setCount = rows.filter((r) => r.participation_level !== null).length
  const notSetCount = rows.filter((r) => r.participation_level === null).length

  return (
    <div className="space-y-6 pt-6">
      <div>
        <h1 className="text-xl font-semibold" style={{ color: 'var(--admin-text-primary)' }}>
          Auto-Fill Preferences
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--admin-text-tertiary)' }}>
          {rows.length} enrolled student{rows.length !== 1 ? 's' : ''} · {setCount} with a preference set
        </p>
      </div>
      <PreferencesClient
        rows={rows}
        totalCount={rows.length}
        setCount={setCount}
        notSetCount={notSetCount}
      />
    </div>
  )
}
