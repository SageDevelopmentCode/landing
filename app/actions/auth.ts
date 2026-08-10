'use server'

import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'
import { sendDiscordNotification, createParentSignupEmbed, createErrorEmbed, createOtpSentEmbed } from '@/app/lib/discord'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

export async function signInWithEmail(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = await createServerSupabaseClient()

  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  const { data: adminUser } = await supabase
    .schema('admin')
    .from('users')
    .select('role')
    .eq('id', authData.user.id)
    .single()

  if (adminUser?.role === 'parent') {
    const adminClient = createAdminClient()
    const { data: grant } = await adminClient
      .schema('parent_app')
      .from('dashboard_access_grants')
      .select('id')
      .eq('grantee_id', authData.user.id)
      .eq('status', 'active')
      .maybeSingle()
    if (grant) return { redirectTo: '/parent/home' }
    return { redirectTo: '/apply/dashboard' }
  }

  if (adminUser?.role === 'teacher') {
    return { redirectTo: '/teacher/dashboard' }
  }

  return { redirectTo: '/admin' }
}

export async function signUpWithEmail(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = await createServerSupabaseClient()

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { message: 'Check your email to confirm your account' }
}

export async function signInWithMagicLink(formData: FormData) {
  const email = formData.get('email') as string
  const supabase = await createServerSupabaseClient()
  const headersList = await headers()
  const origin = headersList.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { message: 'Check your email for the magic link' }
}

export async function sendEmailOtp(formData: FormData) {
  const email = formData.get('email') as string
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false },
  })

  if (error) {
    return { error: error.message }
  }

  void sendDiscordNotification(createOtpSentEmbed({ email, context: 'login' }), process.env.DISCORD_SIGNINS_WEBHOOK_URL).catch(() => {})
  return { success: true }
}

export async function sendSignupOtp(formData: FormData) {
  const email = formData.get('email') as string
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  })

  if (error) {
    void sendDiscordNotification(createErrorEmbed({ context: 'sendSignupOtp – OTP Send', error: error.message, details: { email } })).catch(() => {})
    return { error: error.message }
  }

  void sendDiscordNotification(createOtpSentEmbed({ email, context: 'signup' }), process.env.DISCORD_SIGNINS_WEBHOOK_URL).catch(() => {})
  return { success: true }
}

export async function verifyEmailOtp(formData: FormData) {
  const email = formData.get('email') as string
  const token = formData.get('token') as string
  const fullName = formData.get('fullName') as string | null
  const refCode = formData.get('refCode') as string | null

  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'email' })

  if (error) {
    void sendDiscordNotification(createErrorEmbed({ context: 'verifyEmailOtp – OTP Verify', error: error.message, details: { email } })).catch(() => {})
    return { error: error.message }
  }

  const userId = data.user!.id

  const { data: adminUser } = await supabase
    .schema('admin')
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()

  // New user — create their admin.users record
  if (!adminUser) {
    const adminClient = createAdminClient()
    const { error: insertError } = await adminClient
      .schema('admin')
      .from('users')
      .insert({ id: userId, email, full_name: fullName ?? '', role: 'parent' })
    if (insertError) {
      void sendDiscordNotification(createErrorEmbed({ context: 'verifyEmailOtp – DB Insert user', error: insertError.message, details: { email, userId } })).catch(() => {})
      return { error: `Account setup failed: ${insertError.message}` }
    }
    void sendDiscordNotification(createParentSignupEmbed({ fullName: fullName ?? '', email })).catch(() => {})
    const redirectTo = refCode ? `/apply/step/1?ref=${encodeURIComponent(refCode)}` : '/apply/step/1'
    return { redirectTo }
  }

  if (adminUser.role === 'teacher') return { redirectTo: '/teacher/dashboard' }
  if (adminUser.role === 'super_admin') return { redirectTo: '/admin' }

  if (adminUser.role === 'parent') {
    const adminClient = createAdminClient()
    const { data: grant } = await adminClient
      .schema('parent_app')
      .from('dashboard_access_grants')
      .select('id')
      .eq('grantee_id', userId)
      .eq('status', 'active')
      .maybeSingle()
    if (grant) return { redirectTo: '/parent/home' }
  }

  return { redirectTo: '/apply/dashboard' }
}

export async function signInWithGoogle() {
  const supabase = await createServerSupabaseClient()
  const headersList = await headers()
  const origin = headersList.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (data.url) {
    redirect(data.url)
  }
}

export async function sendPasswordResetEmail(email: string) {
  const supabase = await createServerSupabaseClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=/login/reset-password`,
  })

  if (error) {
    return { error: error.message }
  }

  return { message: 'Check your email for a password reset link' }
}

export async function updatePassword(password: string) {
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function signOut() {
  const supabase = await createServerSupabaseClient()
  await supabase.auth.signOut()
  redirect('/')
}

export async function getUser() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

export async function isAdmin() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return false

  const { data } = await supabase
    .schema('admin')
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  return data?.role === 'super_admin'
}
