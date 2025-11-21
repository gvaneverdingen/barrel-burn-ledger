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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      cask_images: {
        Row: {
          cask_id: string
          created_at: string
          description: string | null
          id: string
          image_type: string | null
          image_url: string
          is_primary: boolean | null
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          cask_id: string
          created_at?: string
          description?: string | null
          id?: string
          image_type?: string | null
          image_url: string
          is_primary?: boolean | null
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          cask_id?: string
          created_at?: string
          description?: string | null
          id?: string
          image_type?: string | null
          image_url?: string
          is_primary?: boolean | null
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: []
      }
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
      cask_sales: {
        Row: {
          asking_price_per_liter: number
          created_at: string
          expires_at: string | null
          id: string
          listing_date: string
          notes: string | null
          ownership_id: string
          seller_id: string
          status: string
          total_asking_price: number
          updated_at: string
          volume_for_sale_liters: number
        }
        Insert: {
          asking_price_per_liter: number
          created_at?: string
          expires_at?: string | null
          id?: string
          listing_date?: string
          notes?: string | null
          ownership_id: string
          seller_id: string
          status?: string
          total_asking_price: number
          updated_at?: string
          volume_for_sale_liters: number
        }
        Update: {
          asking_price_per_liter?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          listing_date?: string
          notes?: string | null
          ownership_id?: string
          seller_id?: string
          status?: string
          total_asking_price?: number
          updated_at?: string
          volume_for_sale_liters?: number
        }
        Relationships: [
          {
            foreignKeyName: "cask_sales_ownership_id_fkey"
            columns: ["ownership_id"]
            isOneToOne: false
            referencedRelation: "cask_ownership"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cask_sales_seller_id_fkey"
            columns: ["seller_id"]
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
          finishing_cask_type: string | null
          finishing_duration_months: number | null
          finishing_notes: string | null
          has_been_finished: boolean | null
          id: string
          original_cask_type: string | null
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
          finishing_cask_type?: string | null
          finishing_duration_months?: number | null
          finishing_notes?: string | null
          has_been_finished?: boolean | null
          id?: string
          original_cask_type?: string | null
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
          finishing_cask_type?: string | null
          finishing_duration_months?: number | null
          finishing_notes?: string | null
          has_been_finished?: boolean | null
          id?: string
          original_cask_type?: string | null
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
      payouts: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          fee_type: string
          id: string
          processed_at: string | null
          recipient_id: string | null
          recipient_type: string
          status: string
          transaction_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          fee_type: string
          id?: string
          processed_at?: string | null
          recipient_id?: string | null
          recipient_type: string
          status?: string
          transaction_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          fee_type?: string
          id?: string
          processed_at?: string | null
          recipient_id?: string | null
          recipient_type?: string
          status?: string
          transaction_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payouts_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company_name: string | null
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_name: string | null
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
          updated_at?: string
          verification_status?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          admin_notes: string | null
          blockchain_transaction_hash: string | null
          buyer_id: string
          cask_id: string
          completed_at: string | null
          created_at: string
          distillery_fee: number
          id: string
          platform_fee: number
          price_per_liter: number
          sale_listing_id: string | null
          seller_amount: number | null
          seller_id: string
          status: string | null
          stripe_payment_intent_id: string | null
          stripe_transfer_id: string | null
          total_amount: number
          transaction_fee: number
          transaction_type: string
          volume_liters: number
        }
        Insert: {
          admin_notes?: string | null
          blockchain_transaction_hash?: string | null
          buyer_id: string
          cask_id: string
          completed_at?: string | null
          created_at?: string
          distillery_fee: number
          id?: string
          platform_fee: number
          price_per_liter: number
          sale_listing_id?: string | null
          seller_amount?: number | null
          seller_id: string
          status?: string | null
          stripe_payment_intent_id?: string | null
          stripe_transfer_id?: string | null
          total_amount: number
          transaction_fee: number
          transaction_type: string
          volume_liters: number
        }
        Update: {
          admin_notes?: string | null
          blockchain_transaction_hash?: string | null
          buyer_id?: string
          cask_id?: string
          completed_at?: string | null
          created_at?: string
          distillery_fee?: number
          id?: string
          platform_fee?: number
          price_per_liter?: number
          sale_listing_id?: string | null
          seller_amount?: number | null
          seller_id?: string
          status?: string | null
          stripe_payment_intent_id?: string | null
          stripe_transfer_id?: string | null
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
            foreignKeyName: "transactions_sale_listing_id_fkey"
            columns: ["sale_listing_id"]
            isOneToOne: false
            referencedRelation: "cask_sales"
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
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          connected_at: string
          created_at: string
          id: string
          is_primary: boolean
          last_used_at: string | null
          updated_at: string
          user_id: string
          wallet_address: string
          wallet_type: string
        }
        Insert: {
          connected_at?: string
          created_at?: string
          id?: string
          is_primary?: boolean
          last_used_at?: string | null
          updated_at?: string
          user_id: string
          wallet_address: string
          wallet_type?: string
        }
        Update: {
          connected_at?: string
          created_at?: string
          id?: string
          is_primary?: boolean
          last_used_at?: string | null
          updated_at?: string
          user_id?: string
          wallet_address?: string
          wallet_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlist: {
        Row: {
          cask_id: string
          created_at: string
          id: string
          max_price: number
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cask_id: string
          created_at?: string
          id?: string
          max_price: number
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cask_id?: string
          created_at?: string
          id?: string
          max_price?: number
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_wishlist_cask"
            columns: ["cask_id"]
            isOneToOne: false
            referencedRelation: "casks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_wishlist_user"
            columns: ["user_id"]
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      user_role:
        | "distillery"
        | "consumer"
        | "investor"
        | "administrator"
        | "facilitator"
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
      user_role: [
        "distillery",
        "consumer",
        "investor",
        "administrator",
        "facilitator",
      ],
    },
  },
} as const
