import { createClient } from '@supabase/supabase-js'

// Server-side Supabase client for use in Server Components and Server Actions
// This provides a fresh client instance for each request

export function createServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return createClient(supabaseUrl, supabaseAnonKey)
}

// Convenience export for Server Components and API routes
export const supabaseServer = createServerSupabaseClient()
