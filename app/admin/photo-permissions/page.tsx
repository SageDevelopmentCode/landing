import { createAdminClient } from '@/app/lib/supabase-server'
import { PhotoPermissionsClient } from './PhotoPermissionsClient'

export type PhotoConsentRow = {
  id: string
  student_id: string
  parent_id: string
  consent_level: 'FULL' | 'LIMITED' | 'NO' | null
  created_at: string | null
  updated_at: string | null
  student_name: string
  parent_name: string | null
  parent_email: string | null
}

export default async function PhotoPermissionsPage() {
  const adminClient = createAdminClient()

  const [{ data: consents }, { data: students }, { data: parents }] = await Promise.all([
    adminClient.schema('parent_app').from('student_photo_release_consent').select('*'),
    adminClient.schema('admin').from('students').select('id, child_legal_name, parent_id').eq('is_deleted', false),
    adminClient.schema('admin').from('users').select('id, full_name, email').eq('role', 'parent').eq('is_deleted', false),
  ])

  const consentMap: Record<string, { id: string; student_id: string; parent_id: string; consent_level: string | null; created_at: string | null; updated_at: string | null }> = {}
  for (const c of consents ?? []) {
    consentMap[c.student_id] = c
  }

  const parentMap: Record<string, { full_name: string | null; email: string | null }> = {}
  for (const p of parents ?? []) {
    parentMap[p.id] = { full_name: p.full_name, email: p.email }
  }

  const rows: PhotoConsentRow[] = (students ?? []).map((s) => {
    const consent = consentMap[s.id]
    const parent = parentMap[s.parent_id]
    return {
      id: consent?.id ?? s.id,
      student_id: s.id,
      parent_id: s.parent_id,
      consent_level: (consent?.consent_level ?? null) as 'FULL' | 'LIMITED' | 'NO' | null,
      created_at: consent?.created_at ?? null,
      updated_at: consent?.updated_at ?? null,
      student_name: s.child_legal_name ?? 'Unknown',
      parent_name: parent?.full_name ?? null,
      parent_email: parent?.email ?? null,
    }
  })

  const fullCount = rows.filter((r) => r.consent_level === 'FULL').length
  const limitedCount = rows.filter((r) => r.consent_level === 'LIMITED').length
  const noCount = rows.filter((r) => r.consent_level === 'NO').length
  const pendingCount = rows.filter((r) => r.consent_level === null).length

  return (
    <div className="space-y-6 pt-6">
      <div>
        <h1 className="text-xl font-semibold" style={{ color: 'var(--admin-text-primary)' }}>
          Photo Permissions
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--admin-text-tertiary)' }}>
          {rows.length} students · {pendingCount} not yet submitted
        </p>
      </div>
      <PhotoPermissionsClient
        rows={rows}
        fullCount={fullCount}
        limitedCount={limitedCount}
        noCount={noCount}
        pendingCount={pendingCount}
      />
    </div>
  )
}
