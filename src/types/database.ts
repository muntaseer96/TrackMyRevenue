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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      balance_categories: {
        Row: {
          account_id: string
          color: string | null
          created_at: string | null
          id: string
          initial_balance: number
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_id: string
          color?: string | null
          created_at?: string | null
          id?: string
          initial_balance?: number
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_id?: string
          color?: string | null
          created_at?: string | null
          id?: string
          initial_balance?: number
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "balance_categories_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "personal_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          id: string
          name: string
          type: string
          user_id: string
          website_id: string | null
          year: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          type: string
          user_id: string
          website_id?: string | null
          year?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          type?: string
          user_id?: string
          website_id?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "categories_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "websites"
            referencedColumns: ["id"]
          },
        ]
      }
      dividends: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          investment_id: string
          month: number
          user_id: string
          year: number
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          investment_id: string
          month: number
          user_id: string
          year: number
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          investment_id?: string
          month?: number
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "dividends_investment_id_fkey"
            columns: ["investment_id"]
            isOneToOne: false
            referencedRelation: "investments"
            referencedColumns: ["id"]
          },
        ]
      }
      investments: {
        Row: {
          company_name: string
          created_at: string | null
          id: string
          notes: string | null
          principal_amount: number
          updated_at: string | null
          user_id: string
          year: number
        }
        Insert: {
          company_name: string
          created_at?: string | null
          id?: string
          notes?: string | null
          principal_amount?: number
          updated_at?: string | null
          user_id: string
          year: number
        }
        Update: {
          company_name?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          principal_amount?: number
          updated_at?: string | null
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      monthly_entries: {
        Row: {
          amount: number
          category_id: string
          created_at: string | null
          id: string
          month: number
          updated_at: string | null
          user_id: string
          website_id: string
          year: number
        }
        Insert: {
          amount?: number
          category_id: string
          created_at?: string | null
          id?: string
          month: number
          updated_at?: string | null
          user_id: string
          website_id: string
          year: number
        }
        Update: {
          amount?: number
          category_id?: string
          created_at?: string | null
          id?: string
          month?: number
          updated_at?: string | null
          user_id?: string
          website_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "monthly_entries_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_entries_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "websites"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_exchange_rates: {
        Row: {
          created_at: string | null
          id: string
          month: number
          rate: number
          updated_at: string | null
          user_id: string
          year: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          month: number
          rate?: number
          updated_at?: string | null
          user_id: string
          year: number
        }
        Update: {
          created_at?: string | null
          id?: string
          month?: number
          rate?: number
          updated_at?: string | null
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          available_years: number[] | null
          avatar_url: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string | null
          phone: string | null
          selected_year: number | null
          updated_at: string | null
        }
        Insert: {
          available_years?: number[] | null
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          id: string
          name?: string | null
          phone?: string | null
          selected_year?: number | null
          updated_at?: string | null
        }
        Update: {
          available_years?: number[] | null
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          selected_year?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      tools: {
        Row: {
          cost_bdt: number | null
          cost_usd: number
          created_at: string | null
          due_month: number | null
          exchange_rate: number
          id: string
          is_template: boolean | null
          month: number
          name: string
          recurrence: string | null
          user_id: string
          website_id: string | null
          year: number
        }
        Insert: {
          cost_bdt?: number | null
          cost_usd?: number
          created_at?: string | null
          due_month?: number | null
          exchange_rate?: number
          id?: string
          is_template?: boolean | null
          month: number
          name: string
          recurrence?: string | null
          user_id: string
          website_id?: string | null
          year: number
        }
        Update: {
          cost_bdt?: number | null
          cost_usd?: number
          created_at?: string | null
          due_month?: number | null
          exchange_rate?: number
          id?: string
          is_template?: boolean | null
          month?: number
          name?: string
          recurrence?: string | null
          user_id?: string
          website_id?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "tools_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "websites"
            referencedColumns: ["id"]
          },
        ]
      }
      websites: {
        Row: {
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
          url: string | null
          user_id: string
          year: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
          url?: string | null
          user_id: string
          year?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          url?: string | null
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      personal_accounts: {
        Row: {
          id: string
          user_id: string
          name: string
          color: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          color?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          color?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      personal_categories: {
        Row: {
          id: string
          user_id: string
          name: string
          type: string
          color: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: string
          color?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: string
          color?: string
          created_at?: string
        }
        Relationships: []
      }
      personal_balances: {
        Row: {
          id: string
          user_id: string
          account_id: string
          year: number
          month: number
          beginning_balance: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          account_id: string
          year: number
          month: number
          beginning_balance?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          account_id?: string
          year?: number
          month?: number
          beginning_balance?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "personal_balances_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "personal_accounts"
            referencedColumns: ["id"]
          }
        ]
      }
      personal_transactions: {
        Row: {
          id: string
          user_id: string
          account_id: string
          category_id: string | null
          balance_category_id: string | null
          year: number
          month: number
          day: number
          amount: number
          note: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          account_id: string
          category_id?: string | null
          balance_category_id?: string | null
          year: number
          month: number
          day: number
          amount: number
          note?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          account_id?: string
          category_id?: string | null
          balance_category_id?: string | null
          year?: number
          month?: number
          day?: number
          amount?: number
          note?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "personal_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "personal_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personal_transactions_balance_category_id_fkey"
            columns: ["balance_category_id"]
            isOneToOne: false
            referencedRelation: "balance_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personal_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "personal_categories"
            referencedColumns: ["id"]
          }
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
  public: {
    Enums: {},
  },
} as const
