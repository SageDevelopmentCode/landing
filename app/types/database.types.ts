// Database type definitions for Supabase tables
// To auto-generate types from your Supabase schema, run:
// npx supabase gen types typescript --project-id vonuwpzepwrbdlectspd > app/types/database.types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  waitlist: {
    Tables: {
      submissions: {
        Row: {
          id: string
          parent_name: string
          email: string
          phone: string | null
          child_name: string
          child_age: number | null
          program_interest: string
          special_interests: string | null
          preferred_start_date: string | null
          status: string | null
          notes: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          parent_name: string
          email: string
          phone?: string | null
          child_name: string
          child_age?: number | null
          program_interest: string
          special_interests?: string | null
          preferred_start_date?: string | null
          status?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          parent_name?: string
          email?: string
          phone?: string | null
          child_name?: string
          child_age?: number | null
          program_interest?: string
          special_interests?: string | null
          preferred_start_date?: string | null
          status?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string | null
        }
      }
    }
  }
  contact: {
    Tables: {
      submissions: {
        Row: {
          id: string
          name: string
          email: string
          phone: string | null
          subject: string
          message: string
          status: string | null
          notes: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone?: string | null
          subject: string
          message: string
          status?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string | null
          subject?: string
          message?: string
          status?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string | null
        }
      }
    }
  }
  admin: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          role?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
  parent_app: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
