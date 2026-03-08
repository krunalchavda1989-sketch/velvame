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
  public: {
    Tables: {
      awards_rewards: {
        Row: {
          cash_amount: number | null
          created_at: string
          gift_description: string | null
          gift_image_url: string | null
          gift_name: string | null
          id: string
          is_active: boolean
          reward_type: string
          sort_order: number
          title_name: string
        }
        Insert: {
          cash_amount?: number | null
          created_at?: string
          gift_description?: string | null
          gift_image_url?: string | null
          gift_name?: string | null
          id?: string
          is_active?: boolean
          reward_type?: string
          sort_order?: number
          title_name: string
        }
        Update: {
          cash_amount?: number | null
          created_at?: string
          gift_description?: string | null
          gift_image_url?: string | null
          gift_name?: string | null
          id?: string
          is_active?: boolean
          reward_type?: string
          sort_order?: number
          title_name?: string
        }
        Relationships: []
      }
      binary_payouts: {
        Row: {
          created_at: string
          id: string
          matching_amount: number
          payout_percentage: number
          period_end: string | null
          period_start: string | null
          status: string
          strong_leg_bv: number
          user_id: string
          weak_leg_bv: number
        }
        Insert: {
          created_at?: string
          id?: string
          matching_amount?: number
          payout_percentage?: number
          period_end?: string | null
          period_start?: string | null
          status?: string
          strong_leg_bv?: number
          user_id: string
          weak_leg_bv?: number
        }
        Update: {
          created_at?: string
          id?: string
          matching_amount?: number
          payout_percentage?: number
          period_end?: string | null
          period_start?: string | null
          status?: string
          strong_leg_bv?: number
          user_id?: string
          weak_leg_bv?: number
        }
        Relationships: []
      }
      binary_positions: {
        Row: {
          carry_forward_left: number
          carry_forward_right: number
          created_at: string
          id: string
          left_bv: number
          parent_id: string | null
          position: string
          profile_id: string | null
          right_bv: number
          sponsor_id: string | null
          total_left_bv: number
          total_right_bv: number
          user_id: string
        }
        Insert: {
          carry_forward_left?: number
          carry_forward_right?: number
          created_at?: string
          id?: string
          left_bv?: number
          parent_id?: string | null
          position?: string
          profile_id?: string | null
          right_bv?: number
          sponsor_id?: string | null
          total_left_bv?: number
          total_right_bv?: number
          user_id: string
        }
        Update: {
          carry_forward_left?: number
          carry_forward_right?: number
          created_at?: string
          id?: string
          left_bv?: number
          parent_id?: string | null
          position?: string
          profile_id?: string | null
          right_bv?: number
          sponsor_id?: string | null
          total_left_bv?: number
          total_right_bv?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "binary_positions_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "binary_positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "binary_positions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "binary_positions_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "binary_positions"
            referencedColumns: ["id"]
          },
        ]
      }
      binary_settings: {
        Row: {
          cap_amount: number
          created_at: string
          id: string
          is_active: boolean
          matching_percentage: number
          min_bv_for_payout: number
          min_monthly_purchase: number
          payout_frequency: string
          updated_at: string
        }
        Insert: {
          cap_amount?: number
          created_at?: string
          id?: string
          is_active?: boolean
          matching_percentage?: number
          min_bv_for_payout?: number
          min_monthly_purchase?: number
          payout_frequency?: string
          updated_at?: string
        }
        Update: {
          cap_amount?: number
          created_at?: string
          id?: string
          is_active?: boolean
          matching_percentage?: number
          min_bv_for_payout?: number
          min_monthly_purchase?: number
          payout_frequency?: string
          updated_at?: string
        }
        Relationships: []
      }
      brand_settings: {
        Row: {
          address: string | null
          brand_name: string
          created_at: string
          email: string | null
          gst_number: string | null
          id: string
          logo_url: string | null
          phone: string | null
          tagline: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          brand_name?: string
          created_at?: string
          email?: string | null
          gst_number?: string | null
          id?: string
          logo_url?: string | null
          phone?: string | null
          tagline?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          brand_name?: string
          created_at?: string
          email?: string | null
          gst_number?: string | null
          id?: string
          logo_url?: string | null
          phone?: string | null
          tagline?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      commission_levels: {
        Row: {
          commission_type: string
          created_at: string
          id: string
          is_active: boolean
          level: number
          min_referrals: number
          rate: number
        }
        Insert: {
          commission_type?: string
          created_at?: string
          id?: string
          is_active?: boolean
          level: number
          min_referrals?: number
          rate?: number
        }
        Update: {
          commission_type?: string
          created_at?: string
          id?: string
          is_active?: boolean
          level?: number
          min_referrals?: number
          rate?: number
        }
        Relationships: []
      }
      commissions: {
        Row: {
          amount: number
          beneficiary_id: string
          commission_type: string
          created_at: string
          id: string
          level: number
          order_id: string
          rate: number
          source_user_id: string
          status: string
        }
        Insert: {
          amount: number
          beneficiary_id: string
          commission_type?: string
          created_at?: string
          id?: string
          level: number
          order_id: string
          rate: number
          source_user_id: string
          status?: string
        }
        Update: {
          amount?: number
          beneficiary_id?: string
          commission_type?: string
          created_at?: string
          id?: string
          level?: number
          order_id?: string
          rate?: number
          source_user_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "commissions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          discount_type: string
          discount_value: number
          end_date: string
          id: string
          is_active: boolean
          max_discount_amount: number | null
          max_uses: number | null
          min_order_amount: number | null
          start_date: string
          used_count: number
        }
        Insert: {
          code: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          end_date?: string
          id?: string
          is_active?: boolean
          max_discount_amount?: number | null
          max_uses?: number | null
          min_order_amount?: number | null
          start_date?: string
          used_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          end_date?: string
          id?: string
          is_active?: boolean
          max_discount_amount?: number | null
          max_uses?: number | null
          min_order_amount?: number | null
          start_date?: string
          used_count?: number
        }
        Relationships: []
      }
      faqs: {
        Row: {
          answer: string
          category: string | null
          created_at: string
          id: string
          is_active: boolean
          question: string
          sort_order: number
        }
        Insert: {
          answer: string
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          question: string
          sort_order?: number
        }
        Update: {
          answer?: string
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          question?: string
          sort_order?: number
        }
        Relationships: []
      }
      hero_stats: {
        Row: {
          created_at: string
          icon: string
          id: string
          is_active: boolean
          label: string
          sort_order: number
          value: string
        }
        Insert: {
          created_at?: string
          icon?: string
          id?: string
          is_active?: boolean
          label: string
          sort_order?: number
          value: string
        }
        Update: {
          created_at?: string
          icon?: string
          id?: string
          is_active?: boolean
          label?: string
          sort_order?: number
          value?: string
        }
        Relationships: []
      }
      localization_settings: {
        Row: {
          available_currencies: Json
          available_languages: Json
          created_at: string
          currency_symbol: string
          default_currency: string
          default_language: string
          id: string
          tax_enabled: boolean
          tax_label: string
          tax_rate: number
          updated_at: string
        }
        Insert: {
          available_currencies?: Json
          available_languages?: Json
          created_at?: string
          currency_symbol?: string
          default_currency?: string
          default_language?: string
          id?: string
          tax_enabled?: boolean
          tax_label?: string
          tax_rate?: number
          updated_at?: string
        }
        Update: {
          available_currencies?: Json
          available_languages?: Json
          created_at?: string
          currency_symbol?: string
          default_currency?: string
          default_language?: string
          id?: string
          tax_enabled?: boolean
          tax_label?: string
          tax_rate?: number
          updated_at?: string
        }
        Relationships: []
      }
      monthly_offers: {
        Row: {
          created_at: string
          description: string | null
          discount_percentage: number | null
          end_date: string
          id: string
          image_url: string | null
          is_active: boolean
          offer_type: string
          product_id: string | null
          start_date: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          discount_percentage?: number | null
          end_date?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          offer_type?: string
          product_id?: string | null
          start_date?: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          discount_percentage?: number | null
          end_date?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          offer_type?: string
          product_id?: string | null
          start_date?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "monthly_offers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      nav_menus: {
        Row: {
          created_at: string
          href: string
          id: string
          is_active: boolean
          label: string
          parent_id: string | null
          sort_order: number
        }
        Insert: {
          created_at?: string
          href?: string
          id?: string
          is_active?: boolean
          label: string
          parent_id?: string | null
          sort_order?: number
        }
        Update: {
          created_at?: string
          href?: string
          id?: string
          is_active?: boolean
          label?: string
          parent_id?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "nav_menus_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "nav_menus"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          price: number
          product_id: string
          quantity: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          price: number
          product_id: string
          quantity?: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          price?: number
          product_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_notes: {
        Row: {
          content: string
          created_at: string
          id: string
          is_internal: boolean
          note_type: string
          order_id: string
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_internal?: boolean
          note_type?: string
          order_id: string
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_internal?: boolean
          note_type?: string
          order_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_notes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          id: string
          is_repurchase: boolean
          payment_method: string | null
          shipping_address: Json | null
          shipping_method: string | null
          status: string
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_repurchase?: boolean
          payment_method?: string | null
          shipping_address?: Json | null
          shipping_method?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_repurchase?: boolean
          payment_method?: string | null
          shipping_address?: Json | null
          shipping_method?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pages_content: {
        Row: {
          content: Json
          created_at: string
          id: string
          is_published: boolean
          meta_description: string | null
          meta_title: string | null
          page_slug: string
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content?: Json
          created_at?: string
          id?: string
          is_published?: boolean
          meta_description?: string | null
          meta_title?: string | null
          page_slug: string
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          is_published?: boolean
          meta_description?: string | null
          meta_title?: string | null
          page_slug?: string
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          order_ref_id: string | null
          purpose: string
          razorpay_order_id: string
          razorpay_payment_id: string | null
          razorpay_signature: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          order_ref_id?: string | null
          purpose?: string
          razorpay_order_id: string
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          order_ref_id?: string | null
          purpose?: string
          razorpay_order_id?: string
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      product_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      product_images: {
        Row: {
          created_at: string
          id: string
          image_url: string
          product_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          product_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          product_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          category: string
          created_at: string
          description: string | null
          distributor_price: number
          id: string
          image_url: string | null
          name: string
          rating: number | null
          retail_price: number
          stock: number
        }
        Insert: {
          active?: boolean
          category?: string
          created_at?: string
          description?: string | null
          distributor_price: number
          id?: string
          image_url?: string | null
          name: string
          rating?: number | null
          retail_price: number
          stock?: number
        }
        Update: {
          active?: boolean
          category?: string
          created_at?: string
          description?: string | null
          distributor_price?: number
          id?: string
          image_url?: string | null
          name?: string
          rating?: number | null
          retail_price?: number
          stock?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          direct_referral_count: number
          full_name: string
          id: string
          phone: string | null
          referral_code: string
          referred_by: string | null
          subscription_date: string | null
          subscription_paid: boolean
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          direct_referral_count?: number
          full_name?: string
          id?: string
          phone?: string | null
          referral_code: string
          referred_by?: string | null
          subscription_date?: string | null
          subscription_paid?: boolean
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          direct_referral_count?: number
          full_name?: string
          id?: string
          phone?: string | null
          referral_code?: string
          referred_by?: string | null
          subscription_date?: string | null
          subscription_paid?: boolean
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      testimonials: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          rating: number
          sort_order: number
          text: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          rating?: number
          sort_order?: number
          text: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          rating?: number
          sort_order?: number
          text?: string
        }
        Relationships: []
      }
      title_roadmap: {
        Row: {
          badge_color: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          required_referrals: number
          sort_order: number
          title_name: string
        }
        Insert: {
          badge_color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          required_referrals?: number
          sort_order?: number
          title_name: string
        }
        Update: {
          badge_color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          required_referrals?: number
          sort_order?: number
          title_name?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          balance: number
          created_at: string
          id: string
          total_earned: number
          total_withdrawn: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          total_earned?: number
          total_withdrawn?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          total_earned?: number
          total_withdrawn?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      withdrawal_requests: {
        Row: {
          admin_note: string | null
          amount: number
          bank_details: Json | null
          created_at: string
          id: string
          status: string
          updated_at: string
          upi_id: string | null
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          amount: number
          bank_details?: Json | null
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          upi_id?: string | null
          user_id: string
        }
        Update: {
          admin_note?: string | null
          amount?: number
          bank_details?: Json | null
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          upi_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_genealogy_tree: {
        Args: {
          _max_depth?: number
          _root_profile_id?: string
          _user_id: string
        }
        Returns: {
          avatar_url: string
          depth: number
          direct_referral_count: number
          full_name: string
          profile_id: string
          referral_code: string
          referred_by: string
          subscription_paid: boolean
          title: string
          user_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_coupon_usage: {
        Args: { _coupon_id: string }
        Returns: undefined
      }
      is_direct_referral: {
        Args: { _profile_id: string; _viewer_user_id: string }
        Returns: boolean
      }
      validate_referral_code: { Args: { _code: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
