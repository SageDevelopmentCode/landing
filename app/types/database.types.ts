export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  admin: {
    Tables: {
      students: {
        Row: {
          activities_to_avoid: string | null
          allergies_description: string | null
          child_grade: string | null
          child_legal_name: string
          created_at: string
          current_challenges: string | null
          dob_day: string
          dob_month: string
          dob_year: string
          dysregulation_response: string | null
          emergency_medications_description: string | null
          has_allergies: string | null
          has_emergency_medications: string | null
          has_medical_conditions: string | null
          history_explanation: string | null
          history_flags: string | null
          id: string
          is_deleted: boolean
          learning_style: string | null
          medical_conditions_description: string | null
          needs_aide: string | null
          needs_aide_description: string | null
          parent_id: string
          regulation_strategies: string | null
          special_interests: string | null
          strengths_interests: string | null
        }
        Insert: {
          activities_to_avoid?: string | null
          allergies_description?: string | null
          child_grade?: string | null
          child_legal_name: string
          created_at?: string
          current_challenges?: string | null
          dob_day: string
          dob_month: string
          dob_year: string
          dysregulation_response?: string | null
          emergency_medications_description?: string | null
          has_allergies?: string | null
          has_emergency_medications?: string | null
          has_medical_conditions?: string | null
          history_explanation?: string | null
          history_flags?: string | null
          id?: string
          is_deleted?: boolean
          learning_style?: string | null
          medical_conditions_description?: string | null
          needs_aide?: string | null
          needs_aide_description?: string | null
          parent_id: string
          regulation_strategies?: string | null
          special_interests?: string | null
          strengths_interests?: string | null
        }
        Update: {
          activities_to_avoid?: string | null
          allergies_description?: string | null
          child_grade?: string | null
          child_legal_name?: string
          created_at?: string
          current_challenges?: string | null
          dob_day?: string
          dob_month?: string
          dob_year?: string
          dysregulation_response?: string | null
          emergency_medications_description?: string | null
          has_allergies?: string | null
          has_emergency_medications?: string | null
          has_medical_conditions?: string | null
          history_explanation?: string | null
          history_flags?: string | null
          id?: string
          is_deleted?: boolean
          learning_style?: string | null
          medical_conditions_description?: string | null
          needs_aide?: string | null
          needs_aide_description?: string | null
          parent_id?: string
          regulation_strategies?: string | null
          special_interests?: string | null
          strengths_interests?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          custody_orders_description: string | null
          email: string
          full_name: string | null
          g1_cell_phone: string | null
          g1_has_custody: string | null
          g1_lives_with_child: string | null
          g1_preferred_contact: string | null
          g1_work_phone: string | null
          g2_cell_phone: string | null
          g2_email: string | null
          g2_full_name: string | null
          g2_has_custody: string | null
          g2_lives_with_child: string | null
          g2_preferred_contact: string | null
          g2_relationship: string | null
          g2_relationship_other: string | null
          g2_work_phone: string | null
          has_custody_orders: string | null
          id: string
          is_deleted: boolean
          role: string | null
          stripe_customer_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          custody_orders_description?: string | null
          email: string
          full_name?: string | null
          g1_cell_phone?: string | null
          g1_has_custody?: string | null
          g1_lives_with_child?: string | null
          g1_preferred_contact?: string | null
          g1_work_phone?: string | null
          g2_cell_phone?: string | null
          g2_email?: string | null
          g2_full_name?: string | null
          g2_has_custody?: string | null
          g2_lives_with_child?: string | null
          g2_preferred_contact?: string | null
          g2_relationship?: string | null
          g2_relationship_other?: string | null
          g2_work_phone?: string | null
          has_custody_orders?: string | null
          id: string
          is_deleted?: boolean
          role?: string | null
          stripe_customer_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          custody_orders_description?: string | null
          email?: string
          full_name?: string | null
          g1_cell_phone?: string | null
          g1_has_custody?: string | null
          g1_lives_with_child?: string | null
          g1_preferred_contact?: string | null
          g1_work_phone?: string | null
          g2_cell_phone?: string | null
          g2_email?: string | null
          g2_full_name?: string | null
          g2_has_custody?: string | null
          g2_lives_with_child?: string | null
          g2_preferred_contact?: string | null
          g2_relationship?: string | null
          g2_relationship_other?: string | null
          g2_work_phone?: string | null
          has_custody_orders?: string | null
          id?: string
          is_deleted?: boolean
          role?: string | null
          stripe_customer_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      volunteer_interests: {
        Row: {
          availability: string[]
          created_at: string | null
          help_areas: string[]
          id: string
          notes: string | null
          parent_id: string | null
          skills: string
          status: string
          updated_at: string | null
        }
        Insert: {
          availability: string[]
          created_at?: string | null
          help_areas: string[]
          id?: string
          notes?: string | null
          parent_id?: string | null
          skills: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          availability?: string[]
          created_at?: string | null
          help_areas?: string[]
          id?: string
          notes?: string | null
          parent_id?: string | null
          skills?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_interests_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
  attendance: {
    Tables: {
      check_ins: {
        Row: {
          checked_in_at: string
          checked_in_by: string
          checked_out_at: string | null
          created_at: string
          id: string
          is_deleted: boolean
          notes: string | null
          student_id: string
          updated_at: string
        }
        Insert: {
          checked_in_at?: string
          checked_in_by: string
          checked_out_at?: string | null
          created_at?: string
          id?: string
          is_deleted?: boolean
          notes?: string | null
          student_id: string
          updated_at?: string
        }
        Update: {
          checked_in_at?: string
          checked_in_by?: string
          checked_out_at?: string | null
          created_at?: string
          id?: string
          is_deleted?: boolean
          notes?: string | null
          student_id?: string
          updated_at?: string
        }
        Relationships: []
      }
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
  billing: {
    Tables: {
      pending_payment_requests: {
        Row: {
          amount_cents: number | null
          created_at: string
          created_by: string | null
          id: string
          label: string
          month: string | null
          parent_id: string
          payment_type: string
          program: string
          status: string
          student_id: string | null
          week: string | null
        }
        Insert: {
          amount_cents?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          label: string
          month?: string | null
          parent_id: string
          payment_type: string
          program: string
          status?: string
          student_id?: string | null
          week?: string | null
        }
        Update: {
          amount_cents?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          label?: string
          month?: string | null
          parent_id?: string
          payment_type?: string
          program?: string
          status?: string
          student_id?: string | null
          week?: string | null
        }
        Relationships: []
      }
      stripe_transactions: {
        Row: {
          amount_cents: number
          application_id: string | null
          cover_fees: boolean | null
          created_at: string | null
          currency: string
          description: string | null
          exclude_from_revenue: boolean
          id: string
          intended_amount_cents: number | null
          is_deleted: boolean
          metadata: Json | null
          parent_id: string | null
          payer_email: string | null
          payer_name: string | null
          payment_type: string
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string
          student_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount_cents: number
          application_id?: string | null
          cover_fees?: boolean | null
          created_at?: string | null
          currency?: string
          description?: string | null
          exclude_from_revenue?: boolean
          id?: string
          intended_amount_cents?: number | null
          is_deleted?: boolean
          metadata?: Json | null
          parent_id?: string | null
          payer_email?: string | null
          payer_name?: string | null
          payment_type: string
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id: string
          student_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount_cents?: number
          application_id?: string | null
          cover_fees?: boolean | null
          created_at?: string | null
          currency?: string
          description?: string | null
          exclude_from_revenue?: boolean
          id?: string
          intended_amount_cents?: number | null
          is_deleted?: boolean
          metadata?: Json | null
          parent_id?: string | null
          payer_email?: string | null
          payer_name?: string | null
          payment_type?: string
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string
          student_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
  budget: {
    Tables: {
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string | null
          expense_date: string
          expense_name: string
          id: string
          is_deleted: boolean
          notes: string | null
          payment_method: string | null
          tax_deductible: boolean
          updated_at: string | null
        }
        Insert: {
          amount?: number
          category: string
          created_at?: string | null
          expense_date?: string
          expense_name: string
          id?: string
          is_deleted?: boolean
          notes?: string | null
          payment_method?: string | null
          tax_deductible?: boolean
          updated_at?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          expense_date?: string
          expense_name?: string
          id?: string
          is_deleted?: boolean
          notes?: string | null
          payment_method?: string | null
          tax_deductible?: boolean
          updated_at?: string | null
        }
        Relationships: []
      }
      income: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          id: string
          income_date: string
          parent_id: string | null
          source: string
          student_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          income_date?: string
          parent_id?: string | null
          source: string
          student_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          income_date?: string
          parent_id?: string | null
          source?: string
          student_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      line_items: {
        Row: {
          category: string
          created_at: string | null
          id: string
          is_active: boolean
          item_name: string
          notes: string | null
          planned_amount: number
          sort_order: number
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          is_active?: boolean
          item_name: string
          notes?: string | null
          planned_amount?: number
          sort_order?: number
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          is_active?: boolean
          item_name?: string
          notes?: string | null
          planned_amount?: number
          sort_order?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      settings: {
        Row: {
          id: string
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string | null
          value?: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_super_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  calendar: {
    Tables: {
      events: {
        Row: {
          attachment_links: string[] | null
          category: string | null
          color: string
          created_at: string | null
          created_by: string | null
          description: string | null
          end_time: string | null
          event_date: string
          id: string
          internal_notes: string | null
          is_all_day: boolean
          location: string | null
          programs: string[] | null
          recurrence: string | null
          recurrence_end_date: string | null
          reminder_email: boolean
          reminder_in_app: boolean
          reminder_timing: string | null
          rsvp_enabled: boolean
          shared_with: string[] | null
          start_time: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          attachment_links?: string[] | null
          category?: string | null
          color?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_time?: string | null
          event_date: string
          id?: string
          internal_notes?: string | null
          is_all_day?: boolean
          location?: string | null
          programs?: string[] | null
          recurrence?: string | null
          recurrence_end_date?: string | null
          reminder_email?: boolean
          reminder_in_app?: boolean
          reminder_timing?: string | null
          rsvp_enabled?: boolean
          shared_with?: string[] | null
          start_time?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          attachment_links?: string[] | null
          category?: string | null
          color?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_time?: string | null
          event_date?: string
          id?: string
          internal_notes?: string | null
          is_all_day?: boolean
          location?: string | null
          programs?: string[] | null
          recurrence?: string | null
          recurrence_end_date?: string | null
          reminder_email?: boolean
          reminder_in_app?: boolean
          reminder_timing?: string | null
          rsvp_enabled?: boolean
          shared_with?: string[] | null
          start_time?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
  chat: {
    Tables: {
      [_ in never]: never
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
  contact: {
    Tables: {
      submissions: {
        Row: {
          call_notes: string | null
          created_at: string | null
          email: string
          id: string
          is_deleted: boolean
          message: string
          name: string
          notes: string | null
          phone: string | null
          status:
            | "new_inquiry"
            | "not_contacted"
            | "contacted"
            | "emailed"
            | "application_sent"
            | "application_submitted"
            | "enrollment_offered"
            | "enrolled"
            | "waitlist"
            | "nurture"
            | "on_hold"
            | "not_fit"
            | "lost"
            | null
          subject: string
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          call_notes?: string | null
          created_at?: string | null
          email: string
          id?: string
          is_deleted?: boolean
          message: string
          name: string
          notes?: string | null
          phone?: string | null
          status?:
            | "new_inquiry"
            | "not_contacted"
            | "contacted"
            | "emailed"
            | "application_sent"
            | "application_submitted"
            | "enrollment_offered"
            | "enrolled"
            | "waitlist"
            | "nurture"
            | "on_hold"
            | "not_fit"
            | "lost"
            | null
          subject: string
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          call_notes?: string | null
          created_at?: string | null
          email?: string
          id?: string
          is_deleted?: boolean
          message?: string
          name?: string
          notes?: string | null
          phone?: string | null
          status?:
            | "new_inquiry"
            | "not_contacted"
            | "contacted"
            | "emailed"
            | "application_sent"
            | "application_submitted"
            | "enrollment_offered"
            | "enrolled"
            | "waitlist"
            | "nurture"
            | "on_hold"
            | "not_fit"
            | "lost"
            | null
          subject?: string
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
  donations: {
    Tables: {
      donations: {
        Row: {
          amount_cents: number
          created_at: string | null
          currency: string
          donor_email: string
          donor_name: string | null
          id: string
          message: string | null
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string
          updated_at: string | null
        }
        Insert: {
          amount_cents: number
          created_at?: string | null
          currency?: string
          donor_email: string
          donor_name?: string | null
          id?: string
          message?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id: string
          updated_at?: string | null
        }
        Update: {
          amount_cents?: number
          created_at?: string | null
          currency?: string
          donor_email?: string
          donor_name?: string | null
          id?: string
          message?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
  email_logs: {
    Tables: {
      sends: {
        Row: {
          application_id: string | null
          error_message: string | null
          id: string
          sent_at: string
          status: string
          subject: string
          template: string | null
          to_address: string
        }
        Insert: {
          application_id?: string | null
          error_message?: string | null
          id?: string
          sent_at?: string
          status: string
          subject: string
          template?: string | null
          to_address: string
        }
        Update: {
          application_id?: string | null
          error_message?: string | null
          id?: string
          sent_at?: string
          status?: string
          subject?: string
          template?: string | null
          to_address?: string
        }
        Relationships: []
      }
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
  marketing: {
    Tables: {
      open_house_rsvps: {
        Row: {
          adults_attending: number
          children_attending: number
          created_at: string
          email: string
          id: string
          name: string
          notes: string | null
          phone: string | null
        }
        Insert: {
          adults_attending: number
          children_attending: number
          created_at?: string
          email: string
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
        }
        Update: {
          adults_attending?: number
          children_attending?: number
          created_at?: string
          email?: string
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
        }
        Relationships: []
      }
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
  parent_app: {
    Tables: {
      application_notes: {
        Row: {
          application_id: string
          content: string
          created_at: string
          id: string
        }
        Insert: {
          application_id: string
          content: string
          created_at?: string
          id?: string
        }
        Update: {
          application_id?: string
          content?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_notes_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          activities_to_avoid: string | null
          address_city: string | null
          address_state: string | null
          address_street: string | null
          address_zip: string | null
          admin_notes: string | null
          allergies_description: string | null
          approved: boolean
          approved_at: string | null
          child_age: number | null
          child_grade: string | null
          child_legal_name: string | null
          created_at: string | null
          current_challenges: string | null
          custody_orders_description: string | null
          denied: boolean
          denied_at: string | null
          denied_reason: string | null
          dob_day: string | null
          dob_month: string | null
          dob_year: string | null
          drop_in_program: string | null
          dysregulation_response: string | null
          emergency_medications_description: string | null
          g1_cell_phone: string | null
          g1_email: string | null
          g1_full_name: string | null
          g1_has_custody: string | null
          g1_lives_with_child: string | null
          g1_preferred_contact: string | null
          g1_relationship: string | null
          g1_relationship_other: string | null
          g1_signature: string | null
          g1_signature_date: string | null
          g1_signature_name: string | null
          g1_work_phone: string | null
          g2_cell_phone: string | null
          g2_email: string | null
          g2_full_name: string | null
          g2_has_custody: string | null
          g2_lives_with_child: string | null
          g2_preferred_contact: string | null
          g2_relationship: string | null
          g2_relationship_other: string | null
          g2_signature: string | null
          g2_signature_date: string | null
          g2_signature_name: string | null
          g2_work_phone: string | null
          has_allergies: string | null
          has_custody_orders: string | null
          has_emergency_medications: string | null
          has_medical_conditions: string | null
          history_explanation: string | null
          history_flags: string | null
          homeschool_explanation: string | null
          household_phone: string | null
          id: string
          is_active: boolean
          is_homeschooled: string | null
          learning_style: string | null
          medical_conditions_description: string | null
          needs_aide: string | null
          needs_aide_description: string | null
          preferred_name: string | null
          previous_schools: string | null
          previous_schools_list: string | null
          program: string | null
          registration_fee_paid: boolean | null
          regulation_strategies: string | null
          special_interests: string | null
          status: string
          strengths_interests: string | null
          student_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          activities_to_avoid?: string | null
          address_city?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          admin_notes?: string | null
          allergies_description?: string | null
          approved?: boolean
          approved_at?: string | null
          child_age?: number | null
          child_grade?: string | null
          child_legal_name?: string | null
          created_at?: string | null
          current_challenges?: string | null
          custody_orders_description?: string | null
          denied?: boolean
          denied_at?: string | null
          denied_reason?: string | null
          dob_day?: string | null
          dob_month?: string | null
          dob_year?: string | null
          drop_in_program?: string | null
          dysregulation_response?: string | null
          emergency_medications_description?: string | null
          g1_cell_phone?: string | null
          g1_email?: string | null
          g1_full_name?: string | null
          g1_has_custody?: string | null
          g1_lives_with_child?: string | null
          g1_preferred_contact?: string | null
          g1_relationship?: string | null
          g1_relationship_other?: string | null
          g1_signature?: string | null
          g1_signature_date?: string | null
          g1_signature_name?: string | null
          g1_work_phone?: string | null
          g2_cell_phone?: string | null
          g2_email?: string | null
          g2_full_name?: string | null
          g2_has_custody?: string | null
          g2_lives_with_child?: string | null
          g2_preferred_contact?: string | null
          g2_relationship?: string | null
          g2_relationship_other?: string | null
          g2_signature?: string | null
          g2_signature_date?: string | null
          g2_signature_name?: string | null
          g2_work_phone?: string | null
          has_allergies?: string | null
          has_custody_orders?: string | null
          has_emergency_medications?: string | null
          has_medical_conditions?: string | null
          history_explanation?: string | null
          history_flags?: string | null
          homeschool_explanation?: string | null
          household_phone?: string | null
          id?: string
          is_active?: boolean
          is_homeschooled?: string | null
          learning_style?: string | null
          medical_conditions_description?: string | null
          needs_aide?: string | null
          needs_aide_description?: string | null
          preferred_name?: string | null
          previous_schools?: string | null
          previous_schools_list?: string | null
          program?: string | null
          registration_fee_paid?: boolean | null
          regulation_strategies?: string | null
          special_interests?: string | null
          status?: string
          strengths_interests?: string | null
          student_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          activities_to_avoid?: string | null
          address_city?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          admin_notes?: string | null
          allergies_description?: string | null
          approved?: boolean
          approved_at?: string | null
          child_age?: number | null
          child_grade?: string | null
          child_legal_name?: string | null
          created_at?: string | null
          current_challenges?: string | null
          custody_orders_description?: string | null
          denied?: boolean
          denied_at?: string | null
          denied_reason?: string | null
          dob_day?: string | null
          dob_month?: string | null
          dob_year?: string | null
          drop_in_program?: string | null
          dysregulation_response?: string | null
          emergency_medications_description?: string | null
          g1_cell_phone?: string | null
          g1_email?: string | null
          g1_full_name?: string | null
          g1_has_custody?: string | null
          g1_lives_with_child?: string | null
          g1_preferred_contact?: string | null
          g1_relationship?: string | null
          g1_relationship_other?: string | null
          g1_signature?: string | null
          g1_signature_date?: string | null
          g1_signature_name?: string | null
          g1_work_phone?: string | null
          g2_cell_phone?: string | null
          g2_email?: string | null
          g2_full_name?: string | null
          g2_has_custody?: string | null
          g2_lives_with_child?: string | null
          g2_preferred_contact?: string | null
          g2_relationship?: string | null
          g2_relationship_other?: string | null
          g2_signature?: string | null
          g2_signature_date?: string | null
          g2_signature_name?: string | null
          g2_work_phone?: string | null
          has_allergies?: string | null
          has_custody_orders?: string | null
          has_emergency_medications?: string | null
          has_medical_conditions?: string | null
          history_explanation?: string | null
          history_flags?: string | null
          homeschool_explanation?: string | null
          household_phone?: string | null
          id?: string
          is_active?: boolean
          is_homeschooled?: string | null
          learning_style?: string | null
          medical_conditions_description?: string | null
          needs_aide?: string | null
          needs_aide_description?: string | null
          preferred_name?: string | null
          previous_schools?: string | null
          previous_schools_list?: string | null
          program?: string | null
          registration_fee_paid?: boolean | null
          regulation_strategies?: string | null
          special_interests?: string | null
          status?: string
          strengths_interests?: string | null
          student_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      enrollment_signatures: {
        Row: {
          contract_id: number
          created_at: string
          id: string
          parent_id: string
          printed_name: string
          section_id: number
          signature: string
          signed_at: string
          student_id: string
        }
        Insert: {
          contract_id: number
          created_at?: string
          id?: string
          parent_id: string
          printed_name: string
          section_id: number
          signature: string
          signed_at?: string
          student_id: string
        }
        Update: {
          contract_id?: number
          created_at?: string
          id?: string
          parent_id?: string
          printed_name?: string
          section_id?: number
          signature?: string
          signed_at?: string
          student_id?: string
        }
        Relationships: []
      }
      student_authorized_pickup_persons: {
        Row: {
          created_at: string | null
          dl_state_id_number: string | null
          email: string | null
          full_name: string
          id: string
          license_plate_state: string | null
          parent_id: string
          phone: string | null
          relationship: string | null
          sort_order: number | null
          student_id: string
          vehicle_info: string | null
        }
        Insert: {
          created_at?: string | null
          dl_state_id_number?: string | null
          email?: string | null
          full_name: string
          id?: string
          license_plate_state?: string | null
          parent_id: string
          phone?: string | null
          relationship?: string | null
          sort_order?: number | null
          student_id: string
          vehicle_info?: string | null
        }
        Update: {
          created_at?: string | null
          dl_state_id_number?: string | null
          email?: string | null
          full_name?: string
          id?: string
          license_plate_state?: string | null
          parent_id?: string
          phone?: string | null
          relationship?: string | null
          sort_order?: number | null
          student_id?: string
          vehicle_info?: string | null
        }
        Relationships: []
      }
      student_authorized_pickup_plan: {
        Row: {
          created_at: string | null
          date_of_request: string | null
          effective_until: string | null
          id: string
          parent_id: string
          student_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date_of_request?: string | null
          effective_until?: string | null
          id?: string
          parent_id: string
          student_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date_of_request?: string | null
          effective_until?: string | null
          id?: string
          parent_id?: string
          student_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      student_health_info: {
        Row: {
          clinic_name: string | null
          created_at: string | null
          emergency_medication_description: string | null
          emergency_medication_required: boolean | null
          group_number: string | null
          health_conditions: string | null
          id: string
          immunization_status: string | null
          in_state_contact_name: string | null
          in_state_contact_phone: string | null
          in_state_contact_relation: string | null
          insurance_provider: string | null
          ongoing_care: boolean | null
          ongoing_care_description: string | null
          out_of_state_contact_name: string | null
          out_of_state_contact_phone: string | null
          out_of_state_contact_relation: string | null
          parent_id: string
          physician_name: string | null
          physician_phone: string | null
          policy_number: string | null
          preferred_hospital: string | null
          student_id: string
          updated_at: string | null
        }
        Insert: {
          clinic_name?: string | null
          created_at?: string | null
          emergency_medication_description?: string | null
          emergency_medication_required?: boolean | null
          group_number?: string | null
          health_conditions?: string | null
          id?: string
          immunization_status?: string | null
          in_state_contact_name?: string | null
          in_state_contact_phone?: string | null
          in_state_contact_relation?: string | null
          insurance_provider?: string | null
          ongoing_care?: boolean | null
          ongoing_care_description?: string | null
          out_of_state_contact_name?: string | null
          out_of_state_contact_phone?: string | null
          out_of_state_contact_relation?: string | null
          parent_id: string
          physician_name?: string | null
          physician_phone?: string | null
          policy_number?: string | null
          preferred_hospital?: string | null
          student_id: string
          updated_at?: string | null
        }
        Update: {
          clinic_name?: string | null
          created_at?: string | null
          emergency_medication_description?: string | null
          emergency_medication_required?: boolean | null
          group_number?: string | null
          health_conditions?: string | null
          id?: string
          immunization_status?: string | null
          in_state_contact_name?: string | null
          in_state_contact_phone?: string | null
          in_state_contact_relation?: string | null
          insurance_provider?: string | null
          ongoing_care?: boolean | null
          ongoing_care_description?: string | null
          out_of_state_contact_name?: string | null
          out_of_state_contact_phone?: string | null
          out_of_state_contact_relation?: string | null
          parent_id?: string
          physician_name?: string | null
          physician_phone?: string | null
          policy_number?: string | null
          preferred_hospital?: string | null
          student_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      student_health_statement: {
        Row: {
          created_at: string | null
          id: string
          option_type: string
          parent_id: string
          student_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          option_type: string
          parent_id: string
          student_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          option_type?: string
          parent_id?: string
          student_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      student_medication_plan: {
        Row: {
          created_at: string | null
          emergency_procedure: string | null
          id: string
          parent_id: string
          special_instructions: string | null
          student_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          emergency_procedure?: string | null
          id?: string
          parent_id: string
          special_instructions?: string | null
          student_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          emergency_procedure?: string | null
          id?: string
          parent_id?: string
          special_instructions?: string | null
          student_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      student_medications: {
        Row: {
          condition_reason: string | null
          created_at: string | null
          dosage_frequency: string | null
          expiration_date: string | null
          id: string
          is_daily: boolean | null
          is_emergency_only: boolean | null
          medication_name: string
          parent_id: string
          physician_name: string | null
          physician_phone: string | null
          sort_order: number | null
          student_id: string
        }
        Insert: {
          condition_reason?: string | null
          created_at?: string | null
          dosage_frequency?: string | null
          expiration_date?: string | null
          id?: string
          is_daily?: boolean | null
          is_emergency_only?: boolean | null
          medication_name: string
          parent_id: string
          physician_name?: string | null
          physician_phone?: string | null
          sort_order?: number | null
          student_id: string
        }
        Update: {
          condition_reason?: string | null
          created_at?: string | null
          dosage_frequency?: string | null
          expiration_date?: string | null
          id?: string
          is_daily?: boolean | null
          is_emergency_only?: boolean | null
          medication_name?: string
          parent_id?: string
          physician_name?: string | null
          physician_phone?: string | null
          sort_order?: number | null
          student_id?: string
        }
        Relationships: []
      }
      student_photo_release_consent: {
        Row: {
          consent_level: string
          created_at: string
          id: string
          parent_id: string
          student_id: string
          updated_at: string
        }
        Insert: {
          consent_level: string
          created_at?: string
          id?: string
          parent_id: string
          student_id: string
          updated_at?: string
        }
        Update: {
          consent_level?: string
          created_at?: string
          id?: string
          parent_id?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: []
      }
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
  teachers: {
    Tables: {
      teacher_note_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_type: string
          id: string
          note_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_type: string
          id?: string
          note_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_type?: string
          id?: string
          note_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_note_attachments_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "teacher_notes"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_notes: {
        Row: {
          category: string
          created_at: string
          id: string
          is_deleted: boolean
          is_shared: boolean
          note_text: string
          student_id: string
          teacher_id: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          is_deleted?: boolean
          is_shared?: boolean
          note_text: string
          student_id: string
          teacher_id: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_deleted?: boolean
          is_shared?: boolean
          note_text?: string
          student_id?: string
          teacher_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      teacher_students: {
        Row: {
          classroom: string | null
          created_at: string | null
          id: string
          is_deleted: boolean
          program: string
          student_id: string
          teacher_id: string
          updated_at: string | null
        }
        Insert: {
          classroom?: string | null
          created_at?: string | null
          id?: string
          is_deleted?: boolean
          program: string
          student_id: string
          teacher_id: string
          updated_at?: string | null
        }
        Update: {
          classroom?: string | null
          created_at?: string | null
          id?: string
          is_deleted?: boolean
          program?: string
          student_id?: string
          teacher_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
  waitlist: {
    Tables: {
      submissions: {
        Row: {
          call_notes: string | null
          child_age: number
          child_name: string
          created_at: string
          email: string
          id: string
          is_deleted: boolean
          notes: string | null
          parent_name: string
          phone: string | null
          program_interest: string
          special_interests: string | null
          status:
            | "new_inquiry"
            | "not_contacted"
            | "contacted"
            | "emailed"
            | "application_sent"
            | "application_submitted"
            | "enrollment_offered"
            | "enrolled"
            | "waitlist"
            | "nurture"
            | "on_hold"
            | "not_fit"
            | "lost"
            | null
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          call_notes?: string | null
          child_age: number
          child_name: string
          created_at?: string
          email: string
          id?: string
          is_deleted?: boolean
          notes?: string | null
          parent_name: string
          phone?: string | null
          program_interest: string
          special_interests?: string | null
          status?:
            | "new_inquiry"
            | "not_contacted"
            | "contacted"
            | "emailed"
            | "application_sent"
            | "application_submitted"
            | "enrollment_offered"
            | "enrolled"
            | "waitlist"
            | "nurture"
            | "on_hold"
            | "not_fit"
            | "lost"
            | null
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          call_notes?: string | null
          child_age?: number
          child_name?: string
          created_at?: string
          email?: string
          id?: string
          is_deleted?: boolean
          notes?: string | null
          parent_name?: string
          phone?: string | null
          program_interest?: string
          special_interests?: string | null
          status?:
            | "new_inquiry"
            | "not_contacted"
            | "contacted"
            | "emailed"
            | "application_sent"
            | "application_submitted"
            | "enrollment_offered"
            | "enrolled"
            | "waitlist"
            | "nurture"
            | "on_hold"
            | "not_fit"
            | "lost"
            | null
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  admin: {
    Enums: {},
  },
  attendance: {
    Enums: {},
  },
  billing: {
    Enums: {},
  },
  budget: {
    Enums: {},
  },
  calendar: {
    Enums: {},
  },
  chat: {
    Enums: {},
  },
  contact: {
    Enums: {},
  },
  donations: {
    Enums: {},
  },
  email_logs: {
    Enums: {},
  },
  marketing: {
    Enums: {},
  },
  parent_app: {
    Enums: {},
  },
  teachers: {
    Enums: {},
  },
  waitlist: {
    Enums: {},
  },
} as const
