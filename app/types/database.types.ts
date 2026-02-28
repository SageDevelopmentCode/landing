// Database type definitions for Supabase tables
// You can auto-generate these types from your Supabase schema using:
// npx supabase gen types typescript --project-id YOUR_PROJECT_ID > app/types/database.types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      // Add your table types here as you create them in Supabase
      // Example:
      // contacts: {
      //   Row: {
      //     id: string
      //     email: string
      //     name: string
      //     message: string
      //     created_at: string
      //   }
      //   Insert: {
      //     id?: string
      //     email: string
      //     name: string
      //     message: string
      //     created_at?: string
      //   }
      //   Update: {
      //     id?: string
      //     email?: string
      //     name?: string
      //     message?: string
      //     created_at?: string
      //   }
      // }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
