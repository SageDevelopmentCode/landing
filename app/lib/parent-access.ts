import { createAdminClient } from '@/app/lib/supabase-server'

export async function resolveActingParentId(userId: string): Promise<string> {
  const adminClient = createAdminClient()
  const { data: grant } = await adminClient
    .schema('parent_app')
    .from('dashboard_access_grants')
    .select('owner_id')
    .eq('grantee_id', userId)
    .eq('status', 'active')
    .maybeSingle()

  return grant?.owner_id ?? userId
}

export async function assertCanActAsParent(
  userId: string,
  parentId: string
): Promise<{ error?: string }> {
  if (parentId === userId) return {}

  const adminClient = createAdminClient()
  const { data: grant } = await adminClient
    .schema('parent_app')
    .from('dashboard_access_grants')
    .select('id')
    .eq('grantee_id', userId)
    .eq('owner_id', parentId)
    .eq('status', 'active')
    .maybeSingle()

  if (!grant) return { error: 'Unauthorized' }
  return {}
}

export async function assertStudentBelongsToParent(
  studentId: string,
  parentId: string
): Promise<{ error?: string }> {
  if (!studentId?.trim()) return { error: 'Missing student ID' }

  const adminClient = createAdminClient()
  const { data: app } = await adminClient
    .schema('parent_app')
    .from('applications')
    .select('id')
    .eq('user_id', parentId)
    .eq('student_id', studentId)
    .eq('approved', true)
    .limit(1)
    .maybeSingle()

  if (!app) return { error: 'Unauthorized' }
  return {}
}
