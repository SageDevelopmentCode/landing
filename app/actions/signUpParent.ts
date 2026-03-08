'use server'
import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'
import { redirect } from 'next/navigation'

export async function signUpParent(fullName: string, email: string, password: string) {
  const supabase = await createServerSupabaseClient()

  // 1. Sign up the user
  const { data, error } = await supabase.auth.signUp({ email, password })

  // When email confirmation is ON, Supabase throws a real error for duplicate emails
  if (error?.message === 'User already registered') return { error: 'EMAIL_EXISTS' }
  if (error) return { error: error.message }

  // When email confirmation is OFF, Supabase returns existing user with empty identities
  if (data.user?.identities?.length === 0) return { error: 'EMAIL_EXISTS' }

  const userId = data.user?.id
  if (!userId) return { error: 'Account creation failed. Please try again.' }

  // 2. Sign them in immediately (Supabase auto-confirms if email confirm is disabled)
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
  if (signInError) return { error: signInError.message }

  // 3. Insert into admin.users via service role to bypass RLS
  const adminClient = createAdminClient()
  const { error: insertError } = await adminClient
    .schema('admin')
    .from('users')
    .insert({ id: userId, email, full_name: fullName, role: 'parent' })
  if (insertError) console.error('admin.users insert failed:', insertError.message)

  // 4. Redirect to step 1 (must be outside try/catch)
  redirect('/apply/step/1')
}
