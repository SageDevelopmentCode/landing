'use server'

import { createServerSupabaseClient } from '@/app/lib/supabase-server'

export async function uploadReligiousExemption(formData: FormData) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const parentId = formData.get('parentId') as string
  const studentId = formData.get('studentId') as string
  const file = formData.get('file') as File

  if (!parentId || !studentId || !file) return { error: 'Missing required fields' }
  if (parentId !== user.id) return { error: 'Unauthorized' }

  const timestamp = Date.now()
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `${parentId}/${studentId}/${timestamp}-${safeName}`

  const { error } = await supabase.storage
    .from('religious-exemption-affidavits')
    .upload(path, file, { contentType: file.type, upsert: false })

  if (error) return { error: error.message }
  return { path }
}
