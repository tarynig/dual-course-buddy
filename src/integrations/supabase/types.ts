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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      app_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          token_hash: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          token_hash: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          token_hash?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      app_users: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          password_hash: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          password_hash: string
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          password_hash?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      course_payment_plans: {
        Row: {
          course_id: string
          plan_id: string
        }
        Insert: {
          course_id: string
          plan_id: string
        }
        Update: {
          course_id?: string
          plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_payment_plans_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_payment_plans_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "payment_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          award: string
          deposit: number | null
          description: string
          details: string | null
          faculty_id: string
          fee: number | null
          id: string
          months: number
          name: string
          saqa: string | null
          signature: boolean
          sort_order: number
          type: string
        }
        Insert: {
          award: string
          deposit?: number | null
          description: string
          details?: string | null
          faculty_id: string
          fee?: number | null
          id: string
          months: number
          name: string
          saqa?: string | null
          signature?: boolean
          sort_order?: number
          type: string
        }
        Update: {
          award?: string
          deposit?: number | null
          description?: string
          details?: string | null
          faculty_id?: string
          fee?: number | null
          id?: string
          months?: number
          name?: string
          saqa?: string | null
          signature?: boolean
          sort_order?: number
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "faculties"
            referencedColumns: ["id"]
          },
        ]
      }
      dual_course_courses: {
        Row: {
          course_id: string
          dual_id: string
          position: number
        }
        Insert: {
          course_id: string
          dual_id: string
          position?: number
        }
        Update: {
          course_id?: string
          dual_id?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "dual_course_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dual_course_courses_dual_id_fkey"
            columns: ["dual_id"]
            isOneToOne: false
            referencedRelation: "dual_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      dual_courses: {
        Row: {
          deposit: number | null
          faculty_id: string
          fee: number | null
          id: string
          months: number
          saving: number | null
          sort_order: number
          title: string
        }
        Insert: {
          deposit?: number | null
          faculty_id: string
          fee?: number | null
          id: string
          months: number
          saving?: number | null
          sort_order?: number
          title: string
        }
        Update: {
          deposit?: number | null
          faculty_id?: string
          fee?: number | null
          id?: string
          months?: number
          saving?: number | null
          sort_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "dual_courses_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "faculties"
            referencedColumns: ["id"]
          },
        ]
      }
      dual_payment_plans: {
        Row: {
          dual_id: string
          plan_id: string
        }
        Insert: {
          dual_id: string
          plan_id: string
        }
        Update: {
          dual_id?: string
          plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dual_payment_plans_dual_id_fkey"
            columns: ["dual_id"]
            isOneToOne: false
            referencedRelation: "dual_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dual_payment_plans_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "payment_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      enquiries: {
        Row: {
          campus: string
          course_id: string | null
          created_at: string
          dual_course_id: string | null
          email: string
          full_name: string
          id: string
          message: string | null
          phone: string
          status: string
        }
        Insert: {
          campus: string
          course_id?: string | null
          created_at?: string
          dual_course_id?: string | null
          email: string
          full_name: string
          id?: string
          message?: string | null
          phone: string
          status?: string
        }
        Update: {
          campus?: string
          course_id?: string | null
          created_at?: string
          dual_course_id?: string | null
          email?: string
          full_name?: string
          id?: string
          message?: string | null
          phone?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "enquiries_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enquiries_dual_course_id_fkey"
            columns: ["dual_course_id"]
            isOneToOne: false
            referencedRelation: "dual_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      faculties: {
        Row: {
          id: string
          name: string
          sort_order: number
          tagline: string
        }
        Insert: {
          id: string
          name: string
          sort_order?: number
          tagline: string
        }
        Update: {
          id?: string
          name?: string
          sort_order?: number
          tagline?: string
        }
        Relationships: []
      }
      payment_plans: {
        Row: {
          created_at: string
          deposit: number
          id: string
          instalment_amount: number
          instalments: number
          name: string
          notes: string | null
          sort_order: number
        }
        Insert: {
          created_at?: string
          deposit?: number
          id?: string
          instalment_amount?: number
          instalments?: number
          name: string
          notes?: string | null
          sort_order?: number
        }
        Update: {
          created_at?: string
          deposit?: number
          id?: string
          instalment_amount?: number
          instalments?: number
          name?: string
          notes?: string | null
          sort_order?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      hash_password: { Args: { plain: string }; Returns: string }
      verify_password: {
        Args: { hashed: string; plain: string }
        Returns: boolean
      }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
