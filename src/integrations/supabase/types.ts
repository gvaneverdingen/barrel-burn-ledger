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
      audit_logs: {
        Row: {
          action_type: string
          admin_id: string | null
          created_at: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          new_value: Json | null
          old_value: Json | null
          resource_id: string | null
          resource_type: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          admin_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_value?: Json | null
          old_value?: Json | null
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          admin_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_value?: Json | null
          old_value?: Json | null
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      blockchain_logs: {
        Row: {
          block_number: number | null
          blockchain_hash: string
          cask_id: string | null
          contract_address: string | null
          created_at: string | null
          gas_used: number | null
          id: string
          metadata: Json | null
          token_id: number | null
          transaction_id: string | null
          transaction_type: string
          updated_at: string | null
        }
        Insert: {
          block_number?: number | null
          blockchain_hash: string
          cask_id?: string | null
          contract_address?: string | null
          created_at?: string | null
          gas_used?: number | null
          id?: string
          metadata?: Json | null
          token_id?: number | null
          transaction_id?: string | null
          transaction_type: string
          updated_at?: string | null
        }
        Update: {
          block_number?: number | null
          blockchain_hash?: string
          cask_id?: string | null
          contract_address?: string | null
          created_at?: string | null
          gas_used?: number | null
          id?: string
          metadata?: Json | null
          token_id?: number | null
          transaction_id?: string | null
          transaction_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blockchain_logs_cask_id_fkey"
            columns: ["cask_id"]
            isOneToOne: false
            referencedRelation: "casks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blockchain_logs_cask_id_fkey"
            columns: ["cask_id"]
            isOneToOne: false
            referencedRelation: "casks_marketplace"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blockchain_logs_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
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
            foreignKeyName: "cask_ownership_cask_id_fkey"
            columns: ["cask_id"]
            isOneToOne: false
            referencedRelation: "casks_marketplace"
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
      cask_regauges: {
        Row: {
          abv: number
          bulk_liters: number
          cask_id: string
          created_at: string
          document_filename: string | null
          document_type: string | null
          document_url: string | null
          id: string
          measured_by: string | null
          notes: string | null
          regauge_date: string
          rla_liters: number
          updated_at: string
        }
        Insert: {
          abv: number
          bulk_liters: number
          cask_id: string
          created_at?: string
          document_filename?: string | null
          document_type?: string | null
          document_url?: string | null
          id?: string
          measured_by?: string | null
          notes?: string | null
          regauge_date: string
          rla_liters: number
          updated_at?: string
        }
        Update: {
          abv?: number
          bulk_liters?: number
          cask_id?: string
          created_at?: string
          document_filename?: string | null
          document_type?: string | null
          document_url?: string | null
          id?: string
          measured_by?: string | null
          notes?: string | null
          regauge_date?: string
          rla_liters?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cask_regauges_cask_id_fkey"
            columns: ["cask_id"]
            isOneToOne: false
            referencedRelation: "casks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cask_regauges_cask_id_fkey"
            columns: ["cask_id"]
            isOneToOne: false
            referencedRelation: "casks_marketplace"
            referencedColumns: ["id"]
          },
        ]
      }
      cask_sales: {
        Row: {
          asking_price_per_liter: number
          cask_id: string | null
          created_at: string
          expires_at: string | null
          id: string
          last_gauging_date: string | null
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
          cask_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          last_gauging_date?: string | null
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
          cask_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          last_gauging_date?: string | null
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
            foreignKeyName: "cask_sales_cask_id_fkey"
            columns: ["cask_id"]
            isOneToOne: false
            referencedRelation: "casks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cask_sales_cask_id_fkey"
            columns: ["cask_id"]
            isOneToOne: false
            referencedRelation: "casks_marketplace"
            referencedColumns: ["id"]
          },
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
      cask_transfers: {
        Row: {
          cask_id: string
          created_at: string
          created_by: string | null
          doc_hash: string | null
          document_filename: string | null
          document_type: string | null
          document_url: string | null
          from_cask_id: string | null
          from_warehouse_id: string | null
          id: string
          reason: string | null
          to_cask_id: string | null
          to_warehouse_id: string | null
          transfer_date: string
          transfer_type: Database["public"]["Enums"]["cask_transfer_type"]
          updated_at: string
        }
        Insert: {
          cask_id: string
          created_at?: string
          created_by?: string | null
          doc_hash?: string | null
          document_filename?: string | null
          document_type?: string | null
          document_url?: string | null
          from_cask_id?: string | null
          from_warehouse_id?: string | null
          id?: string
          reason?: string | null
          to_cask_id?: string | null
          to_warehouse_id?: string | null
          transfer_date: string
          transfer_type: Database["public"]["Enums"]["cask_transfer_type"]
          updated_at?: string
        }
        Update: {
          cask_id?: string
          created_at?: string
          created_by?: string | null
          doc_hash?: string | null
          document_filename?: string | null
          document_type?: string | null
          document_url?: string | null
          from_cask_id?: string | null
          from_warehouse_id?: string | null
          id?: string
          reason?: string | null
          to_cask_id?: string | null
          to_warehouse_id?: string | null
          transfer_date?: string
          transfer_type?: Database["public"]["Enums"]["cask_transfer_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cask_transfers_cask_id_fkey"
            columns: ["cask_id"]
            isOneToOne: false
            referencedRelation: "casks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cask_transfers_cask_id_fkey"
            columns: ["cask_id"]
            isOneToOne: false
            referencedRelation: "casks_marketplace"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cask_transfers_from_cask_id_fkey"
            columns: ["from_cask_id"]
            isOneToOne: false
            referencedRelation: "casks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cask_transfers_from_cask_id_fkey"
            columns: ["from_cask_id"]
            isOneToOne: false
            referencedRelation: "casks_marketplace"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cask_transfers_from_warehouse_id_fkey"
            columns: ["from_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cask_transfers_from_warehouse_id_fkey"
            columns: ["from_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cask_transfers_to_cask_id_fkey"
            columns: ["to_cask_id"]
            isOneToOne: false
            referencedRelation: "casks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cask_transfers_to_cask_id_fkey"
            columns: ["to_cask_id"]
            isOneToOne: false
            referencedRelation: "casks_marketplace"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cask_transfers_to_warehouse_id_fkey"
            columns: ["to_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cask_transfers_to_warehouse_id_fkey"
            columns: ["to_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses_public"
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
          age_years: number | null
          alcohol_percentage: number | null
          available_for_sale: boolean | null
          blockchain_hash: string | null
          blockchain_id: string
          cask_fill_generation:
            | Database["public"]["Enums"]["cask_fill_generation"]
            | null
          cask_number: string
          cask_type_id: string
          char_level: number | null
          cooperage: string | null
          created_at: string
          current_volume_liters: number | null
          distillation_date: string
          distillery_id: string | null
          dsp_code: string | null
          duty_status: Database["public"]["Enums"]["duty_status"] | null
          expected_maturation_years: number | null
          finishing_cask_type: string | null
          finishing_duration_months: number | null
          finishing_notes: string | null
          has_been_finished: boolean | null
          id: string
          insurance_valuation: number | null
          insurance_valuation_at: string | null
          is_single_barrel: boolean | null
          last_gauging_date: string | null
          nft_contract_address: string | null
          nft_minted_at: string | null
          nft_token_id: number | null
          original_cask_type: string | null
          original_lpa: number | null
          previous_contents:
            | Database["public"]["Enums"]["previous_contents"]
            | null
          price_per_liter: number | null
          provenance_doc_hash: string | null
          quality_grade: string | null
          rarity_tier: number | null
          region: string | null
          special_finish: string | null
          spirit_name: string
          spirit_type: Database["public"]["Enums"]["spirit_type"] | null
          tasting_notes: string | null
          toast_level: Database["public"]["Enums"]["toast_level"] | null
          total_price: number | null
          updated_at: string
          warehouse_id: string | null
          warehouse_location: string | null
          wood_species: Database["public"]["Enums"]["wood_species"] | null
          wowgr_holder_warehouse_id: string | null
        }
        Insert: {
          age_years?: number | null
          alcohol_percentage?: number | null
          available_for_sale?: boolean | null
          blockchain_hash?: string | null
          blockchain_id: string
          cask_fill_generation?:
            | Database["public"]["Enums"]["cask_fill_generation"]
            | null
          cask_number: string
          cask_type_id: string
          char_level?: number | null
          cooperage?: string | null
          created_at?: string
          current_volume_liters?: number | null
          distillation_date: string
          distillery_id?: string | null
          dsp_code?: string | null
          duty_status?: Database["public"]["Enums"]["duty_status"] | null
          expected_maturation_years?: number | null
          finishing_cask_type?: string | null
          finishing_duration_months?: number | null
          finishing_notes?: string | null
          has_been_finished?: boolean | null
          id?: string
          insurance_valuation?: number | null
          insurance_valuation_at?: string | null
          is_single_barrel?: boolean | null
          last_gauging_date?: string | null
          nft_contract_address?: string | null
          nft_minted_at?: string | null
          nft_token_id?: number | null
          original_cask_type?: string | null
          original_lpa?: number | null
          previous_contents?:
            | Database["public"]["Enums"]["previous_contents"]
            | null
          price_per_liter?: number | null
          provenance_doc_hash?: string | null
          quality_grade?: string | null
          rarity_tier?: number | null
          region?: string | null
          special_finish?: string | null
          spirit_name: string
          spirit_type?: Database["public"]["Enums"]["spirit_type"] | null
          tasting_notes?: string | null
          toast_level?: Database["public"]["Enums"]["toast_level"] | null
          total_price?: number | null
          updated_at?: string
          warehouse_id?: string | null
          warehouse_location?: string | null
          wood_species?: Database["public"]["Enums"]["wood_species"] | null
          wowgr_holder_warehouse_id?: string | null
        }
        Update: {
          age_years?: number | null
          alcohol_percentage?: number | null
          available_for_sale?: boolean | null
          blockchain_hash?: string | null
          blockchain_id?: string
          cask_fill_generation?:
            | Database["public"]["Enums"]["cask_fill_generation"]
            | null
          cask_number?: string
          cask_type_id?: string
          char_level?: number | null
          cooperage?: string | null
          created_at?: string
          current_volume_liters?: number | null
          distillation_date?: string
          distillery_id?: string | null
          dsp_code?: string | null
          duty_status?: Database["public"]["Enums"]["duty_status"] | null
          expected_maturation_years?: number | null
          finishing_cask_type?: string | null
          finishing_duration_months?: number | null
          finishing_notes?: string | null
          has_been_finished?: boolean | null
          id?: string
          insurance_valuation?: number | null
          insurance_valuation_at?: string | null
          is_single_barrel?: boolean | null
          last_gauging_date?: string | null
          nft_contract_address?: string | null
          nft_minted_at?: string | null
          nft_token_id?: number | null
          original_cask_type?: string | null
          original_lpa?: number | null
          previous_contents?:
            | Database["public"]["Enums"]["previous_contents"]
            | null
          price_per_liter?: number | null
          provenance_doc_hash?: string | null
          quality_grade?: string | null
          rarity_tier?: number | null
          region?: string | null
          special_finish?: string | null
          spirit_name?: string
          spirit_type?: Database["public"]["Enums"]["spirit_type"] | null
          tasting_notes?: string | null
          toast_level?: Database["public"]["Enums"]["toast_level"] | null
          total_price?: number | null
          updated_at?: string
          warehouse_id?: string | null
          warehouse_location?: string | null
          wood_species?: Database["public"]["Enums"]["wood_species"] | null
          wowgr_holder_warehouse_id?: string | null
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
          {
            foreignKeyName: "casks_distillery_id_fkey"
            columns: ["distillery_id"]
            isOneToOne: false
            referencedRelation: "distilleries_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "casks_wowgr_holder_warehouse_id_fkey"
            columns: ["wowgr_holder_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "casks_wowgr_holder_warehouse_id_fkey"
            columns: ["wowgr_holder_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses_public"
            referencedColumns: ["id"]
          },
        ]
      }
      counter_offers: {
        Row: {
          counter_price_per_liter: number
          counter_total_price: number
          counter_volume_liters: number | null
          created_at: string
          id: string
          message: string | null
          original_offer_id: string
          status: string
          updated_at: string
        }
        Insert: {
          counter_price_per_liter: number
          counter_total_price: number
          counter_volume_liters?: number | null
          created_at?: string
          id?: string
          message?: string | null
          original_offer_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          counter_price_per_liter?: number
          counter_total_price?: number
          counter_volume_liters?: number | null
          created_at?: string
          id?: string
          message?: string | null
          original_offer_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "counter_offers_original_offer_id_fkey"
            columns: ["original_offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
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
          stripe_account_id: string | null
          stripe_onboarding_complete: boolean | null
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
          stripe_account_id?: string | null
          stripe_onboarding_complete?: boolean | null
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
          stripe_account_id?: string | null
          stripe_onboarding_complete?: boolean | null
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
      notifications: {
        Row: {
          created_at: string | null
          id: string
          link: string | null
          message: string
          metadata: Json | null
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          link?: string | null
          message: string
          metadata?: Json | null
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          link?: string | null
          message?: string
          metadata?: Json | null
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          buyer_id: string
          cask_id: string
          created_at: string
          expires_at: string | null
          id: string
          message: string | null
          offer_type: string
          offered_price_per_liter: number
          offered_total_price: number
          sale_listing_id: string | null
          seller_id: string
          status: string
          updated_at: string
          volume_liters: number
        }
        Insert: {
          buyer_id: string
          cask_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          message?: string | null
          offer_type: string
          offered_price_per_liter: number
          offered_total_price: number
          sale_listing_id?: string | null
          seller_id: string
          status?: string
          updated_at?: string
          volume_liters: number
        }
        Update: {
          buyer_id?: string
          cask_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          message?: string | null
          offer_type?: string
          offered_price_per_liter?: number
          offered_total_price?: number
          sale_listing_id?: string | null
          seller_id?: string
          status?: string
          updated_at?: string
          volume_liters?: number
        }
        Relationships: [
          {
            foreignKeyName: "offers_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_cask_id_fkey"
            columns: ["cask_id"]
            isOneToOne: false
            referencedRelation: "casks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_cask_id_fkey"
            columns: ["cask_id"]
            isOneToOne: false
            referencedRelation: "casks_marketplace"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_sale_listing_id_fkey"
            columns: ["sale_listing_id"]
            isOneToOne: false
            referencedRelation: "cask_sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      price_alerts: {
        Row: {
          alert_type: string
          cask_id: string
          created_at: string
          id: string
          is_active: boolean
          target_price: number
          triggered_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          alert_type?: string
          cask_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          target_price: number
          triggered_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          alert_type?: string
          cask_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          target_price?: number
          triggered_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company_name: string | null
          created_at: string
          date_of_birth: string | null
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
          date_of_birth?: string | null
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
          date_of_birth?: string | null
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string
          verification_status?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rating: number
          reviewed_id: string
          reviewer_id: string
          transaction_id: string
          updated_at: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          reviewed_id: string
          reviewer_id: string
          transaction_id: string
          updated_at?: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          reviewed_id?: string
          reviewer_id?: string
          transaction_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
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
            foreignKeyName: "transactions_cask_id_fkey"
            columns: ["cask_id"]
            isOneToOne: false
            referencedRelation: "casks_marketplace"
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
      warehouses: {
        Row: {
          bonded_warehouse_number: string | null
          capacity_casks: number | null
          country: string | null
          created_at: string
          customs_jurisdiction: string | null
          description: string | null
          established_year: number | null
          excise_authority: string | null
          id: string
          location: string | null
          logo_url: string | null
          name: string
          profile_id: string
          stripe_account_id: string | null
          stripe_onboarding_complete: boolean | null
          updated_at: string
          verified: boolean | null
          warehouse_keeper_license: string | null
          website: string | null
        }
        Insert: {
          bonded_warehouse_number?: string | null
          capacity_casks?: number | null
          country?: string | null
          created_at?: string
          customs_jurisdiction?: string | null
          description?: string | null
          established_year?: number | null
          excise_authority?: string | null
          id?: string
          location?: string | null
          logo_url?: string | null
          name: string
          profile_id: string
          stripe_account_id?: string | null
          stripe_onboarding_complete?: boolean | null
          updated_at?: string
          verified?: boolean | null
          warehouse_keeper_license?: string | null
          website?: string | null
        }
        Update: {
          bonded_warehouse_number?: string | null
          capacity_casks?: number | null
          country?: string | null
          created_at?: string
          customs_jurisdiction?: string | null
          description?: string | null
          established_year?: number | null
          excise_authority?: string | null
          id?: string
          location?: string | null
          logo_url?: string | null
          name?: string
          profile_id?: string
          stripe_account_id?: string | null
          stripe_onboarding_complete?: boolean | null
          updated_at?: string
          verified?: boolean | null
          warehouse_keeper_license?: string | null
          website?: string | null
        }
        Relationships: []
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
            foreignKeyName: "fk_wishlist_cask"
            columns: ["cask_id"]
            isOneToOne: false
            referencedRelation: "casks_marketplace"
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
      casks_marketplace: {
        Row: {
          age_years: number | null
          available_for_sale: boolean | null
          cask_number: string | null
          cask_type_capacity: number | null
          cask_type_id: string | null
          cask_type_name: string | null
          distillation_date: string | null
          distillery_id: string | null
          expected_maturation_years: number | null
          finishing_cask_type: string | null
          finishing_duration_months: number | null
          has_been_finished: boolean | null
          id: string | null
          is_single_barrel: boolean | null
          quality_grade: string | null
          rarity_tier: number | null
          region: string | null
          special_finish: string | null
          spirit_name: string | null
          tasting_notes: string | null
          warehouse_location: string | null
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
          {
            foreignKeyName: "casks_distillery_id_fkey"
            columns: ["distillery_id"]
            isOneToOne: false
            referencedRelation: "distilleries_public"
            referencedColumns: ["id"]
          },
        ]
      }
      distilleries_public: {
        Row: {
          created_at: string | null
          description: string | null
          established_year: number | null
          id: string | null
          location: string | null
          logo_url: string | null
          name: string | null
          profile_id: string | null
          verified: boolean | null
          website: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          established_year?: number | null
          id?: string | null
          location?: string | null
          logo_url?: string | null
          name?: string | null
          profile_id?: string | null
          verified?: boolean | null
          website?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          established_year?: number | null
          id?: string | null
          location?: string | null
          logo_url?: string | null
          name?: string | null
          profile_id?: string | null
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
      warehouses_public: {
        Row: {
          country: string | null
          created_at: string | null
          description: string | null
          id: string | null
          location: string | null
          name: string | null
          profile_id: string | null
          verified: boolean | null
        }
        Insert: {
          country?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          location?: string | null
          name?: string | null
          profile_id?: string | null
          verified?: boolean | null
        }
        Update: {
          country?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          location?: string | null
          name?: string | null
          profile_id?: string | null
          verified?: boolean | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_manage_cask: { Args: { _cask_id: string }; Returns: boolean }
      can_view_cask: { Args: { _cask_id: string }; Returns: boolean }
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
      cask_fill_generation:
        | "first_fill"
        | "refill"
        | "second_fill"
        | "third_fill"
        | "fourth_fill_plus"
        | "rejuvenated"
        | "virgin"
      cask_transfer_type:
        | "re_rack"
        | "marrying"
        | "finishing_transfer"
        | "warehouse_move"
        | "other"
      duty_status: "under_bond" | "duty_paid"
      previous_contents:
        | "virgin_oak"
        | "ex_bourbon"
        | "ex_sherry_oloroso"
        | "ex_sherry_px"
        | "ex_sherry_fino"
        | "ex_sherry_amontillado"
        | "ex_sherry_manzanilla"
        | "ex_sherry_palo_cortado"
        | "ex_port_ruby"
        | "ex_port_tawny"
        | "ex_port_white"
        | "ex_wine_sauternes"
        | "ex_wine_bordeaux"
        | "ex_wine_burgundy"
        | "ex_wine_tokaji"
        | "ex_wine_other"
        | "ex_rum"
        | "ex_cognac"
        | "ex_madeira"
        | "ex_marsala"
        | "str"
        | "other"
      spirit_type:
        | "single_malt"
        | "single_grain"
        | "blended_malt"
        | "blended_grain"
        | "blended_whisky"
        | "bourbon"
        | "rye"
        | "corn_whiskey"
        | "tennessee_whiskey"
        | "irish_pot_still"
        | "rum"
        | "cognac"
        | "armagnac"
        | "brandy"
        | "tequila"
        | "mezcal"
        | "other"
      toast_level: "light" | "medium" | "medium_plus" | "heavy"
      user_role:
        | "distillery"
        | "consumer"
        | "investor"
        | "administrator"
        | "facilitator"
      wood_species:
        | "american_oak"
        | "european_oak"
        | "spanish_oak"
        | "french_oak"
        | "hungarian_oak"
        | "japanese_mizunara"
        | "chestnut"
        | "cherry"
        | "other"
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
      cask_fill_generation: [
        "first_fill",
        "refill",
        "second_fill",
        "third_fill",
        "fourth_fill_plus",
        "rejuvenated",
        "virgin",
      ],
      cask_transfer_type: [
        "re_rack",
        "marrying",
        "finishing_transfer",
        "warehouse_move",
        "other",
      ],
      duty_status: ["under_bond", "duty_paid"],
      previous_contents: [
        "virgin_oak",
        "ex_bourbon",
        "ex_sherry_oloroso",
        "ex_sherry_px",
        "ex_sherry_fino",
        "ex_sherry_amontillado",
        "ex_sherry_manzanilla",
        "ex_sherry_palo_cortado",
        "ex_port_ruby",
        "ex_port_tawny",
        "ex_port_white",
        "ex_wine_sauternes",
        "ex_wine_bordeaux",
        "ex_wine_burgundy",
        "ex_wine_tokaji",
        "ex_wine_other",
        "ex_rum",
        "ex_cognac",
        "ex_madeira",
        "ex_marsala",
        "str",
        "other",
      ],
      spirit_type: [
        "single_malt",
        "single_grain",
        "blended_malt",
        "blended_grain",
        "blended_whisky",
        "bourbon",
        "rye",
        "corn_whiskey",
        "tennessee_whiskey",
        "irish_pot_still",
        "rum",
        "cognac",
        "armagnac",
        "brandy",
        "tequila",
        "mezcal",
        "other",
      ],
      toast_level: ["light", "medium", "medium_plus", "heavy"],
      user_role: [
        "distillery",
        "consumer",
        "investor",
        "administrator",
        "facilitator",
      ],
      wood_species: [
        "american_oak",
        "european_oak",
        "spanish_oak",
        "french_oak",
        "hungarian_oak",
        "japanese_mizunara",
        "chestnut",
        "cherry",
        "other",
      ],
    },
  },
} as const
