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
      users: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          role: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          role?: string | null
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
  contact: {
    Tables: {
      submissions: {
        Row: {
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
          updated_at: string | null
        }
        Insert: {
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
          updated_at?: string | null
        }
        Update: {
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
  parent_app: {
    Tables: {
      applications: {
        Row: {
          activities_to_avoid: string | null
          address_city: string | null
          address_state: string | null
          address_street: string | null
          address_zip: string | null
          allergies_description: string | null
          approved: boolean
          approved_at: string | null
          child_age: number | null
          child_grade: string | null
          child_legal_name: string | null
          created_at: string | null
          current_challenges: string | null
          custody_orders_description: string | null
          dob_day: string | null
          dob_month: string | null
          dob_year: string | null
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
          is_homeschooled: string | null
          learning_style: string | null
          medical_conditions_description: string | null
          needs_aide: string | null
          needs_aide_description: string | null
          preferred_name: string | null
          previous_schools: string | null
          previous_schools_list: string | null
          program: string | null
          regulation_strategies: string | null
          special_interests: string | null
          status: string
          strengths_interests: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          activities_to_avoid?: string | null
          address_city?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          allergies_description?: string | null
          approved?: boolean
          approved_at?: string | null
          child_age?: number | null
          child_grade?: string | null
          child_legal_name?: string | null
          created_at?: string | null
          current_challenges?: string | null
          custody_orders_description?: string | null
          dob_day?: string | null
          dob_month?: string | null
          dob_year?: string | null
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
          is_homeschooled?: string | null
          learning_style?: string | null
          medical_conditions_description?: string | null
          needs_aide?: string | null
          needs_aide_description?: string | null
          preferred_name?: string | null
          previous_schools?: string | null
          previous_schools_list?: string | null
          program?: string | null
          regulation_strategies?: string | null
          special_interests?: string | null
          status?: string
          strengths_interests?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          activities_to_avoid?: string | null
          address_city?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          allergies_description?: string | null
          approved?: boolean
          approved_at?: string | null
          child_age?: number | null
          child_grade?: string | null
          child_legal_name?: string | null
          created_at?: string | null
          current_challenges?: string | null
          custody_orders_description?: string | null
          dob_day?: string | null
          dob_month?: string | null
          dob_year?: string | null
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
          is_homeschooled?: string | null
          learning_style?: string | null
          medical_conditions_description?: string | null
          needs_aide?: string | null
          needs_aide_description?: string | null
          preferred_name?: string | null
          previous_schools?: string | null
          previous_schools_list?: string | null
          program?: string | null
          regulation_strategies?: string | null
          special_interests?: string | null
          status?: string
          strengths_interests?: string | null
          updated_at?: string | null
          user_id?: string
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
          updated_at: string
        }
        Insert: {
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
          updated_at?: string
        }
        Update: {
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

// =====================================================
// Budget schema interfaces
// =====================================================

export interface BudgetLineItem {
  id: string
  category: string
  item_name: string
  planned_amount: number
  is_active: boolean
  sort_order: number
  notes: string | null
  created_at: string | null
  updated_at: string | null
}

export interface BudgetExpense {
  id: string
  expense_name: string
  category: string
  amount: number
  payment_method: string | null
  expense_date: string
  notes: string | null
  tax_deductible: boolean
  is_deleted: boolean
  created_at: string | null
  updated_at: string | null
}

export interface BudgetIncome {
  id: string
  source: 'tuition' | 'aftercare' | 'fun_friday' | 'summer' | 'other'
  student_name: string | null
  description: string | null
  amount: number
  income_date: string
  created_at: string | null
  updated_at: string | null
}

export interface BudgetSettings {
  id: string
  key: string
  value: unknown
  updated_at: string | null
}

export const Constants = {
  admin: {
    Enums: {},
  },
  contact: {
    Enums: {},
  },
  parent_app: {
    Enums: {},
  },
  waitlist: {
    Enums: {},
  },
} as const
