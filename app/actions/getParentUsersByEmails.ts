'use server'
import { createAdminClient } from '@/app/lib/supabase-server'

export type ParentUserInfo = { id: string; full_name: string }

export async function getParentUsersByEmails(
  emails: string[]
): Promise<Record<string, ParentUserInfo | null>> {
  const nonEmpty = emails.filter(Boolean)
  if (!nonEmpty.length) return {}

  const { data, error } = await createAdminClient()
    .schema('admin')
    .from('users')
    .select('id, full_name, email')
    .in('email', nonEmpty)

  if (error || !data) return {}

  const result: Record<string, ParentUserInfo | null> = Object.fromEntries(
    nonEmpty.map((e) => [e, null])
  )
  for (const row of data) {
    if (row.email) result[row.email] = { id: row.id, full_name: row.full_name }
  }
  return result
}
