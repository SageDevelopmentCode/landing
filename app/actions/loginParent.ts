'use server'
import { createServerSupabaseClient } from '@/app/lib/supabase-server'
import { redirect } from 'next/navigation'

export async function loginParent(email: string, password: string) {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: error.message }
  redirect('/apply/dashboard')
}
