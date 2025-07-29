export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      cask_ownership: {
        Row: {
          acquired_date: string
          acquisition_price: number | null
          cask_id: string
          created_at: string
          id: string
          is_active: boolean | null
          owner_id: string
          ownership_percentage: number
          updated_at: string
          volume_liters: number
        }
        Insert: {
          acquired_date?: string
          acquisition_price?: number | null
          cask_id: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          owner_id: string
          ownership_percentage: number
          updated_at?: string
          volume_liters: number
        }
        Update: {
          acquired_date?: string
          acquisition_price?: number | null
          cask_id?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          owner_id?: string
          ownership_percentage?: number
          updated_at?: string
          volume_liters?: number
        }
        Relationships: [
          {
            foreignKeyName: "cask_ownership_cask_id_fkey"
            columns: ["cask_id"]
            isOneToOne: false
            referencedRelation: "casks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cask_ownership_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cask_types: {
        Row: {
          capacity_liters: number
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          capacity_liters: number
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          capacity_liters?: number
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      casks: {
        Row: {
          alcohol_percentage: number | null
          available_for_sale: boolean | null
          blockchain_hash: string | null
          blockchain_id: string
          cask_number: string
          cask_type_id: string
          created_at: string
          current_volume_liters: number | null
          distillation_date: string
          distillery_id: string
          expected_maturation_years: number | null
          id: string
          price_per_liter: number | null
          spirit_name: string
          tasting_notes: string | null
          total_price: number | null
          updated_at: string
          warehouse_location: string | null
        }
        Insert: {
          alcohol_percentage?: number | null
          available_for_sale?: boolean | null
          blockchain_hash?: string | null
          blockchain_id: string
          cask_number: string
          cask_type_id: string
          created_at?: string
          current_volume_liters?: number | null
          distillation_date: string
          distillery_id: string
          expected_maturation_years?: number | null
          id?: string
          price_per_liter?: number | null
          spirit_name: string
          tasting_notes?: string | null
          total_price?: number | null
          updated_at?: string
          warehouse_location?: string | null
        }
        Update: {
          alcohol_percentage?: number | null
          available_for_sale?: boolean | null
          blockchain_hash?: string | null
          blockchain_id?: string
          cask_number?: string
          cask_type_id?: string
          created_at?: string
          current_volume_liters?: number | null
          distillation_date?: string
          distillery_id?: string
          expected_maturation_years?: number | null
          id?: string
          price_per_liter?: number | null
          spirit_name?: string
          tasting_notes?: string | null
          total_price?: number | null
          updated_at?: string
          warehouse_location?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "casks_cask_type_id_fkey"
            columns: ["cask_type_id"]
            isOneToOne: false
            referencedRelation: "cask_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "casks_distillery_id_fkey"
            columns: ["distillery_id"]
            isOneToOne: false
            referencedRelation: "distilleries"
            referencedColumns: ["id"]
          },
        ]
      }
      distilleries: {
        Row: {
          created_at: string
          description: string | null
          established_year: number | null
          id: string
          license_number: string | null
          location: string | null
          logo_url: string | null
          name: string
          profile_id: string
          updated_at: string
          verified: boolean | null
          website: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          established_year?: number | null
          id?: string
          license_number?: string | null
          location?: string | null
          logo_url?: string | null
          name: string
          profile_id: string
          updated_at?: string
          verified?: boolean | null
          website?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          established_year?: number | null
          id?: string
          license_number?: string | null
          location?: string | null
          logo_url?: string | null
          name?: string
          profile_id?: string
          updated_at?: string
          verified?: boolean | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "distilleries_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_structure: {
        Row: {
          created_at: string
          description: string | null
          fee_type: string
          fixed_amount: number | null
          id: string
          is_active: boolean | null
          percentage: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          fee_type: string
          fixed_amount?: number | null
          id?: string
          is_active?: boolean | null
          percentage?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          fee_type?: string
          fixed_amount?: number | null
          id?: string
          is_active?: boolean | null
          percentage?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company_name: string | null
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          verification_status: string | null
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          id: string
          last_name?: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          verification_status?: string | null
        }
        Update: {
          company_name?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          verification_status?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          blockchain_transaction_hash: string | null
          buyer_id: string
          cask_id: string
          completed_at: string | null
          created_at: string
          distillery_fee: number
          id: string
          platform_fee: number
          price_per_liter: number
          seller_amount: number | null
          seller_id: string
          status: string | null
          total_amount: number
          transaction_fee: number
          transaction_type: string
          volume_liters: number
        }
        Insert: {
          blockchain_transaction_hash?: string | null
          buyer_id: string
          cask_id: string
          completed_at?: string | null
          created_at?: string
          distillery_fee: number
          id?: string
          platform_fee: number
          price_per_liter: number
          seller_amount?: number | null
          seller_id: string
          status?: string | null
          total_amount: number
          transaction_fee: number
          transaction_type: string
          volume_liters: number
        }
        Update: {
          blockchain_transaction_hash?: string | null
          buyer_id?: string
          cask_id?: string
          completed_at?: string | null
          created_at?: string
          distillery_fee?: number
          id?: string
          platform_fee?: number
          price_per_liter?: number
          seller_amount?: number | null
          seller_id?: string
          status?: string | null
          total_amount?: number
          transaction_fee?: number
          transaction_type?: string
          volume_liters?: number
        }
        Relationships: [
          {
            foreignKeyName: "transactions_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_cask_id_fkey"
            columns: ["cask_id"]
            isOneToOne: false
            referencedRelation: "casks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      user_role: "distillery" | "consumer" | "investor"
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
    Enums: {
      user_role: ["distillery", "consumer", "investor"],
    },
  },
} as const
