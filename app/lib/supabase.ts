import { createClient } from '@supabase/supabase-js'

// Create a single supabase client for interacting with your database
// This client is used in client components (marked with "use client")

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
