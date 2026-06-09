'use server'

import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'
import { sendZohoEmail, buildDashboardInviteEmail } from '@/app/lib/zoho'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sagefield.co'

export async function inviteForDashboardAccess(invitedEmail: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const normalizedEmail = invitedEmail.trim().toLowerCase()
  if (normalizedEmail === user.email?.toLowerCase()) {
    return { error: 'You cannot invite yourself.' }
  }

  const adminClient = createAdminClient()

  const { data: ownerUser } = await adminClient
    .schema('admin')
    .from('users')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const ownerName = ownerUser?.full_name ?? 'A Sage Field parent'

  const newToken = crypto.randomUUID()

  const { error: upsertError } = await adminClient
    .schema('parent_app')
    .from('dashboard_access_grants')
    .upsert(
      {
        owner_id: user.id,
        invited_email: normalizedEmail,
        token: newToken,
        status: 'pending',
        grantee_id: null,
        accepted_at: null,
        revoked_at: null,
      },
      { onConflict: 'owner_id,invited_email' }
    )

  if (upsertError) return { error: upsertError.message }

  const { data: grantRow } = await adminClient
    .schema('parent_app')
    .from('dashboard_access_grants')
    .select('token')
    .eq('owner_id', user.id)
    .eq('invited_email', normalizedEmail)
    .single()

  if (!grantRow) return { error: 'Failed to retrieve invite token.' }

  const nextPath = `/accept-dashboard-invite?token=${grantRow.token}`
  const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
    type: 'magiclink',
    email: normalizedEmail,
    options: {
      redirectTo: `${SITE_URL}/auth/callback?next=${encodeURIComponent(nextPath)}`,
    },
  })

  if (linkError || !linkData?.properties?.action_link) {
    return { error: linkError?.message ?? 'Failed to generate invite link.' }
  }

  const { data: approvedApps } = await adminClient
    .schema('parent_app')
    .from('applications')
    .select('student_id')
    .eq('user_id', user.id)
    .eq('approved', true)

  const studentIds = (approvedApps ?? [])
    .map((a) => a.student_id)
    .filter((id): id is string => id !== null)

  let studentNames: string[] = []
  if (studentIds.length > 0) {
    const { data: students } = await adminClient
      .schema('admin')
      .from('students')
      .select('child_legal_name')
      .in('id', studentIds)
    studentNames = (students ?? []).map((s) => s.child_legal_name).filter(Boolean) as string[]
  }

  const { subject, content } = await buildDashboardInviteEmail({
    ownerName,
    inviteLink: linkData.properties.action_link,
    studentNames,
  })

  const { error: emailError } = await sendZohoEmail({
    toAddress: normalizedEmail,
    subject,
    content,
  })

  if (emailError) return { error: `Invite created but email failed: ${emailError}` }

  return { success: true }
}

export async function acceptDashboardInvite(token: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const adminClient = createAdminClient()

  const { data: grant } = await adminClient
    .schema('parent_app')
    .from('dashboard_access_grants')
    .select('id, owner_id, invited_email')
    .eq('token', token)
    .eq('status', 'pending')
    .maybeSingle()

  if (!grant) return { error: 'Invalid or expired invite.' }

  const { error: updateError } = await adminClient
    .schema('parent_app')
    .from('dashboard_access_grants')
    .update({
      grantee_id: user.id,
      status: 'active',
      accepted_at: new Date().toISOString(),
    })
    .eq('id', grant.id)

  if (updateError) return { error: updateError.message }

  const { data: existingAdminUser } = await adminClient
    .schema('admin')
    .from('users')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (!existingAdminUser) {
    await adminClient
      .schema('admin')
      .from('users')
      .insert({
        id: user.id,
        email: user.email ?? grant.invited_email,
        role: 'parent',
      })
  }

  return { success: true }
}

export async function revokeDashboardAccess(grantId: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const adminClient = createAdminClient()

  const { data: grant } = await adminClient
    .schema('parent_app')
    .from('dashboard_access_grants')
    .select('owner_id')
    .eq('id', grantId)
    .maybeSingle()

  if (!grant) return { error: 'Grant not found.' }
  if (grant.owner_id !== user.id) return { error: 'Not authorized.' }

  const { error } = await adminClient
    .schema('parent_app')
    .from('dashboard_access_grants')
    .update({ status: 'revoked', revoked_at: new Date().toISOString() })
    .eq('id', grantId)

  if (error) return { error: error.message }
  return { success: true }
}

export async function listDashboardGrants() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated', grants: [] }

  const adminClient = createAdminClient()

  const { data, error } = await adminClient
    .schema('parent_app')
    .from('dashboard_access_grants')
    .select('id, invited_email, grantee_id, status, created_at, accepted_at')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return { error: error.message, grants: [] }
  return { grants: data ?? [] }
}
