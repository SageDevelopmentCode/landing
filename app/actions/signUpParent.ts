'use server'
import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'
import { sendDiscordNotification, createErrorEmbed, createParentSignupEmbed } from '@/app/lib/discord'

export async function signUpParent(fullName: string, email: string, password: string) {
  const supabase = await createServerSupabaseClient()

  // 1. Sign up the user
  const { data, error } = await supabase.auth.signUp({ email, password })

  // When email confirmation is ON, Supabase throws a real error for duplicate emails
  if (error?.message === 'User already registered') return { error: 'EMAIL_EXISTS' }
  if (error) {
    void sendDiscordNotification(createErrorEmbed({ context: 'signUpParent – Auth SignUp', error: error.message, details: { email } })).catch(() => {})
    return { error: error.message }
  }

  // When email confirmation is OFF, Supabase returns existing user with empty identities
  if (data.user?.identities?.length === 0) return { error: 'EMAIL_EXISTS' }

  const userId = data.user?.id
  if (!userId) return { error: 'Account creation failed. Please try again.' }

  // 2. Sign them in immediately (Supabase auto-confirms if email confirm is disabled)
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
  if (signInError) {
    void sendDiscordNotification(createErrorEmbed({ context: 'signUpParent – Auth SignIn', error: signInError.message, details: { email } })).catch(() => {})
    return { error: signInError.message }
  }

  // 3. Insert into admin.users via service role to bypass RLS
  const adminClient = createAdminClient()
  const { error: insertError } = await adminClient
    .schema('admin')
    .from('users')
    .insert({ id: userId, email, full_name: fullName, role: 'parent' })
  if (insertError) {
    void sendDiscordNotification(createErrorEmbed({ context: 'signUpParent – DB Insert user', error: insertError.message, details: { email, userId } })).catch(() => {})
    return { error: `Account setup failed: ${insertError.message}` }
  }

  // 4. Notify Discord and return redirect URL
  void sendDiscordNotification(createParentSignupEmbed({ fullName, email })).catch(() => {})
  return { redirectTo: '/apply/step/1' }
}
