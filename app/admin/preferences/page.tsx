import { notFound } from 'next/navigation'
import { createAdminClient } from '@/app/lib/supabase-server'
import { resolveEffectiveParentId } from '@/app/admin/impersonate/resolveEffectiveParentId'
import {
  loadEnrolledFamilies,
  loadFamilyPreferenceData,
} from './loadFamilyPreferenceData'
import { FamilyPickerClient } from './FamilyPickerClient'
import { FamilyPreferencesClient } from './FamilyPreferencesClient'

export default async function PreferencesPage({
  searchParams,
}: {
  searchParams: Promise<{ parentId?: string }>
}) {
  const { parentId } = await searchParams

  if (!parentId) {
    const families = await loadEnrolledFamilies()

    return (
      <div className="space-y-6 pt-6">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--admin-text-primary)' }}>
            Family Preferences
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--admin-text-tertiary)' }}>
            {families.length} enrolled famil{families.length !== 1 ? 'ies' : 'y'} · Select a family to edit preferences
          </p>
        </div>
        <FamilyPickerClient families={families} />
      </div>
    )
  }

  const adminClient = createAdminClient()
  const { effectiveParentId, isSharedAccess, ownerName } =
    await resolveEffectiveParentId(parentId)

  const [{ data: parentUser }, data] = await Promise.all([
    adminClient
      .schema('admin')
      .from('users')
      .select('full_name, email')
      .eq('id', parentId)
      .single(),
    loadFamilyPreferenceData(effectiveParentId),
  ])

  if (!parentUser) notFound()

  return (
    <div className="space-y-6 pt-6">
      <FamilyPreferencesClient
        effectiveParentId={effectiveParentId}
        parentName={parentUser.full_name}
        parentEmail={(parentUser.email as string | null) ?? null}
        isSharedAccess={isSharedAccess}
        ownerName={ownerName}
        data={data}
      />
    </div>
  )
}
