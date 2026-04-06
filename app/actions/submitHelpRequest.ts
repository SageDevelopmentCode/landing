'use server'

import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'
import { sendDiscordNotification, createErrorEmbed, createHelpRequestEmbed } from '@/app/lib/discord'

export async function submitHelpRequest(formData: FormData) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const description = formData.get('description') as string
  const pageUrl = formData.get('pageUrl') as string | null
  if (!description?.trim()) return { error: 'Description is required' }

  const adminClient = createAdminClient()

  // Insert help request record
  const { data: helpRequest, error: insertError } = await adminClient
    .schema('admin')
    .from('help_requests')
    .insert({ parent_id: user.id, description: description.trim(), page_url: pageUrl ?? null })
    .select()
    .single()

  if (insertError) {
    void sendDiscordNotification(createErrorEmbed({
      context: 'submitHelpRequest – DB Insert',
      error: insertError.message,
      details: { parentId: user.id },
    })).catch(() => {})
    return { error: insertError.message }
  }

  // Upload attachments (if any)
  const attachmentUrls: string[] = []
  const files = formData.getAll('files') as File[]

  for (const file of files) {
    if (!file || file.size === 0) continue
    const timestamp = Date.now()
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const path = `${user.id}/${helpRequest.id}/${timestamp}-${safeName}`

    const { error: uploadError } = await supabase.storage
      .from('help-request-attachments')
      .upload(path, file, { contentType: file.type, upsert: false })

    if (uploadError) {
      void sendDiscordNotification(createErrorEmbed({
        context: 'submitHelpRequest – Storage Upload',
        error: uploadError.message,
        details: { parentId: user.id, helpRequestId: helpRequest.id, path },
      })).catch(() => {})
      // Continue uploading remaining files; don't block the whole submission
    } else {
      attachmentUrls.push(path)
    }
  }

  // Fetch parent name for Discord notification
  const { data: parentProfile } = await adminClient
    .schema('admin')
    .from('users')
    .select('full_name, email')
    .eq('id', user.id)
    .single()

  void sendDiscordNotification(createHelpRequestEmbed({
    parentName: parentProfile?.full_name ?? 'Unknown',
    parentEmail: parentProfile?.email ?? user.email ?? 'Unknown',
    description: description.trim(),
    attachmentCount: attachmentUrls.length,
    helpRequestId: helpRequest.id,
    pageUrl: pageUrl,
  })).catch(() => {})

  return { success: true }
}
