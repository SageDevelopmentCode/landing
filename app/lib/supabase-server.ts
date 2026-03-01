import { createClient } from '@supabase/supabase-js'

// Server-side Supabase client for use in Server Components and Server Actions
// IMPORTANT: Always call this function to get a fresh client instance per request
// Never create a singleton as it can share state between requests in serverless environments

export function createServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return createClient(supabaseUrl, supabaseAnonKey)
}
