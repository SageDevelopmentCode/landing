'use server'
import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'

export async function adminUploadImmunizationRecord(formData: FormData) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const adminClient = createAdminClient()
  const { data: adminUser } = await adminClient.schema('admin').from('users').select('role').eq('id', user.id).single()
  if (adminUser?.role !== 'super_admin') return { error: 'Forbidden' }

  const parentId = formData.get('parentId') as string
  const studentId = formData.get('studentId') as string
  const file = formData.get('file') as File

  if (!parentId || !studentId || !file) return { error: 'Missing required fields' }

  const timestamp = Date.now()
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `${parentId}/${studentId}/${timestamp}-${safeName}`

  const { error } = await adminClient.storage
    .from('immunization-records')
    .upload(path, file, { contentType: file.type, upsert: false })

  if (error) return { error: error.message }
  return { path }
}
