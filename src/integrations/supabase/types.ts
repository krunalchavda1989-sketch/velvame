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
      admin_sub_users: {
        Row: {
          added_by: string
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          added_by: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          added_by?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      announcement_bar_settings: {
        Row: {
          auto_play: boolean
          bar_height: number
          bar_position: string
          bg_color: string
          display_duration: number
          font_size: number
          font_weight: string
          id: string
          is_enabled: boolean
          loop_enabled: boolean
          pause_on_hover: boolean
          show_arrows: boolean
          show_close_button: boolean
          show_dots: boolean
          show_on_desktop: boolean
          show_on_mobile: boolean
          swipe_mobile: boolean
          text_align: string
          text_color: string
          transition_effect: string
          transition_speed: number
          updated_at: string
        }
        Insert: {
          auto_play?: boolean
          bar_height?: number
          bar_position?: string
          bg_color?: string
          display_duration?: number
          font_size?: number
          font_weight?: string
          id?: string
          is_enabled?: boolean
          loop_enabled?: boolean
          pause_on_hover?: boolean
          show_arrows?: boolean
          show_close_button?: boolean
          show_dots?: boolean
          show_on_desktop?: boolean
          show_on_mobile?: boolean
          swipe_mobile?: boolean
          text_align?: string
          text_color?: string
          transition_effect?: string
          transition_speed?: number
          updated_at?: string
        }
        Update: {
          auto_play?: boolean
          bar_height?: number
          bar_position?: string
          bg_color?: string
          display_duration?: number
          font_size?: number
          font_weight?: string
          id?: string
          is_enabled?: boolean
          loop_enabled?: boolean
          pause_on_hover?: boolean
          show_arrows?: boolean
          show_close_button?: boolean
          show_dots?: boolean
          show_on_desktop?: boolean
          show_on_mobile?: boolean
          swipe_mobile?: boolean
          text_align?: string
          text_color?: string
          transition_effect?: string
          transition_speed?: number
          updated_at?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          bg_color: string
          created_at: string
          ends_at: string | null
          id: string
          is_active: boolean
          link_target: string
          link_text: string | null
          link_url: string | null
          message: string
          sort_order: number
          starts_at: string
          text_color: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          bg_color?: string
          created_at?: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          link_target?: string
          link_text?: string | null
          link_url?: string | null
          message?: string
          sort_order?: number
          starts_at?: string
          text_color?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Update: {
          bg_color?: string
          created_at?: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          link_target?: string
          link_text?: string | null
          link_url?: string | null
          message?: string
          sort_order?: number
          starts_at?: string
          text_color?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      awards_rewards: {
        Row: {
          cash_amount: number | null
          created_at: string
          description: string | null
          gift_description: string | null
          gift_image_url: string | null
          gift_name: string | null
          id: string
          is_active: boolean
          required_active_members: number
          reward_type: string
          sort_order: number
          title_name: string
        }
        Insert: {
          cash_amount?: number | null
          created_at?: string
          description?: string | null
          gift_description?: string | null
          gift_image_url?: string | null
          gift_name?: string | null
          id?: string
          is_active?: boolean
          required_active_members?: number
          reward_type?: string
          sort_order?: number
          title_name: string
        }
        Update: {
          cash_amount?: number | null
          created_at?: string
          description?: string | null
          gift_description?: string | null
          gift_image_url?: string | null
          gift_name?: string | null
          id?: string
          is_active?: boolean
          required_active_members?: number
          reward_type?: string
          sort_order?: number
          title_name?: string
        }
        Relationships: []
      }
      bank_details: {
        Row: {
          account_holder_name: string
          account_number: string
          bank_name: string
          bank_proof_url: string | null
          branch_name: string
          created_at: string
          id: string
          ifsc_code: string
          updated_at: string
          upi_id: string
          user_id: string
        }
        Insert: {
          account_holder_name?: string
          account_number?: string
          bank_name?: string
          bank_proof_url?: string | null
          branch_name?: string
          created_at?: string
          id?: string
          ifsc_code?: string
          updated_at?: string
          upi_id?: string
          user_id: string
        }
        Update: {
          account_holder_name?: string
          account_number?: string
          bank_name?: string
          bank_proof_url?: string | null
          branch_name?: string
          created_at?: string
          id?: string
          ifsc_code?: string
          updated_at?: string
          upi_id?: string
          user_id?: string
        }
        Relationships: []
      }
      banner_settings: {
        Row: {
          autoplay_speed: number
          created_at: string
          default_desktop_mode: string
          default_mobile_mode: string
          direction: string
          easing: string
          hero_section_enabled: boolean
          id: string
          loop_enabled: boolean
          pause_on_hover: boolean
          show_arrows: boolean
          show_dots: boolean
          transition_effect: string
          transition_speed: number
          updated_at: string
        }
        Insert: {
          autoplay_speed?: number
          created_at?: string
          default_desktop_mode?: string
          default_mobile_mode?: string
          direction?: string
          easing?: string
          hero_section_enabled?: boolean
          id?: string
          loop_enabled?: boolean
          pause_on_hover?: boolean
          show_arrows?: boolean
          show_dots?: boolean
          transition_effect?: string
          transition_speed?: number
          updated_at?: string
        }
        Update: {
          autoplay_speed?: number
          created_at?: string
          default_desktop_mode?: string
          default_mobile_mode?: string
          direction?: string
          easing?: string
          hero_section_enabled?: boolean
          id?: string
          loop_enabled?: boolean
          pause_on_hover?: boolean
          show_arrows?: boolean
          show_dots?: boolean
          transition_effect?: string
          transition_speed?: number
          updated_at?: string
        }
        Relationships: []
      }
      banners: {
        Row: {
          alt_text: string
          created_at: string
          custom_duration: number | null
          desktop_display_mode: string
          desktop_image_url: string
          destination_link: string
          id: string
          is_active: boolean
          link_target: string
          mobile_display_mode: string
          mobile_image_url: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          alt_text?: string
          created_at?: string
          custom_duration?: number | null
          desktop_display_mode?: string
          desktop_image_url?: string
          destination_link?: string
          id?: string
          is_active?: boolean
          link_target?: string
          mobile_display_mode?: string
          mobile_image_url?: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          alt_text?: string
          created_at?: string
          custom_duration?: number | null
          desktop_display_mode?: string
          desktop_image_url?: string
          destination_link?: string
          id?: string
          is_active?: boolean
          link_target?: string
          mobile_display_mode?: string
          mobile_image_url?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      brand_settings: {
        Row: {
          accent_color: string | null
          address: string | null
          brand_color: string | null
          brand_name: string
          button_color: string | null
          created_at: string
          danger_color: string | null
          email: string | null
          favicon_url: string | null
          font_body: string | null
          font_heading: string | null
          footer_logo_url: string | null
          id: string
          info_color: string | null
          logo_url: string | null
          og_image_url: string | null
          phone: string | null
          secondary_color: string | null
          sidebar_color: string | null
          stat_color_1: string | null
          stat_color_2: string | null
          stat_color_3: string | null
          stat_color_4: string | null
          success_color: string | null
          tagline: string | null
          updated_at: string
          warning_color: string | null
          website: string | null
        }
        Insert: {
          accent_color?: string | null
          address?: string | null
          brand_color?: string | null
          brand_name?: string
          button_color?: string | null
          created_at?: string
          danger_color?: string | null
          email?: string | null
          favicon_url?: string | null
          font_body?: string | null
          font_heading?: string | null
          footer_logo_url?: string | null
          id?: string
          info_color?: string | null
          logo_url?: string | null
          og_image_url?: string | null
          phone?: string | null
          secondary_color?: string | null
          sidebar_color?: string | null
          stat_color_1?: string | null
          stat_color_2?: string | null
          stat_color_3?: string | null
          stat_color_4?: string | null
          success_color?: string | null
          tagline?: string | null
          updated_at?: string
          warning_color?: string | null
          website?: string | null
        }
        Update: {
          accent_color?: string | null
          address?: string | null
          brand_color?: string | null
          brand_name?: string
          button_color?: string | null
          created_at?: string
          danger_color?: string | null
          email?: string | null
          favicon_url?: string | null
          font_body?: string | null
          font_heading?: string | null
          footer_logo_url?: string | null
          id?: string
          info_color?: string | null
          logo_url?: string | null
          og_image_url?: string | null
          phone?: string | null
          secondary_color?: string | null
          sidebar_color?: string | null
          stat_color_1?: string | null
          stat_color_2?: string | null
          stat_color_3?: string | null
          stat_color_4?: string | null
          success_color?: string | null
          tagline?: string | null
          updated_at?: string
          warning_color?: string | null
          website?: string | null
        }
        Relationships: []
      }
      breadcrumb_settings: {
        Row: {
          background_type: string
          bg_color: string
          bg_image_url: string
          bg_position: string
          bg_repeat: string
          bg_size: string
          created_at: string
          crumb_active_color: string
          crumb_font_size: number
          crumb_font_weight: string
          crumb_inactive_color: string
          custom_height: number
          gradient_direction: string
          gradient_stops: Json
          gradient_type: string
          id: string
          overlay_color: string
          overlay_enabled: boolean
          overlay_opacity: number
          padding_bottom: number
          padding_top: number
          section_height: string
          separator_color: string
          separator_symbol: string
          text_alignment: string
          title_color: string
          title_font_size: number
          title_font_weight: string
          title_letter_spacing: number
          title_transform: string
          updated_at: string
          vertical_position: string
          visibility_settings: Json
        }
        Insert: {
          background_type?: string
          bg_color?: string
          bg_image_url?: string
          bg_position?: string
          bg_repeat?: string
          bg_size?: string
          created_at?: string
          crumb_active_color?: string
          crumb_font_size?: number
          crumb_font_weight?: string
          crumb_inactive_color?: string
          custom_height?: number
          gradient_direction?: string
          gradient_stops?: Json
          gradient_type?: string
          id?: string
          overlay_color?: string
          overlay_enabled?: boolean
          overlay_opacity?: number
          padding_bottom?: number
          padding_top?: number
          section_height?: string
          separator_color?: string
          separator_symbol?: string
          text_alignment?: string
          title_color?: string
          title_font_size?: number
          title_font_weight?: string
          title_letter_spacing?: number
          title_transform?: string
          updated_at?: string
          vertical_position?: string
          visibility_settings?: Json
        }
        Update: {
          background_type?: string
          bg_color?: string
          bg_image_url?: string
          bg_position?: string
          bg_repeat?: string
          bg_size?: string
          created_at?: string
          crumb_active_color?: string
          crumb_font_size?: number
          crumb_font_weight?: string
          crumb_inactive_color?: string
          custom_height?: number
          gradient_direction?: string
          gradient_stops?: Json
          gradient_type?: string
          id?: string
          overlay_color?: string
          overlay_enabled?: boolean
          overlay_opacity?: number
          padding_bottom?: number
          padding_top?: number
          section_height?: string
          separator_color?: string
          separator_symbol?: string
          text_alignment?: string
          title_color?: string
          title_font_size?: number
          title_font_weight?: string
          title_letter_spacing?: number
          title_transform?: string
          updated_at?: string
          vertical_position?: string
          visibility_settings?: Json
        }
        Relationships: []
      }
      category_section_settings: {
        Row: {
          bg_color: string
          bg_image_url: string
          cat_name_color: string
          cat_name_font: string
          cat_name_size: number
          created_at: string
          display_count: number
          hover_effect: string
          id: string
          image_style: string
          is_active: boolean
          subtitle: string
          title: string
          title_alignment: string
          updated_at: string
        }
        Insert: {
          bg_color?: string
          bg_image_url?: string
          cat_name_color?: string
          cat_name_font?: string
          cat_name_size?: number
          created_at?: string
          display_count?: number
          hover_effect?: string
          id?: string
          image_style?: string
          is_active?: boolean
          subtitle?: string
          title?: string
          title_alignment?: string
          updated_at?: string
        }
        Update: {
          bg_color?: string
          bg_image_url?: string
          cat_name_color?: string
          cat_name_font?: string
          cat_name_size?: number
          created_at?: string
          display_count?: number
          hover_effect?: string
          id?: string
          image_style?: string
          is_active?: boolean
          subtitle?: string
          title?: string
          title_alignment?: string
          updated_at?: string
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
      commission_reprocess_runs: {
        Row: {
          affected_user_id: string | null
          completed_at: string | null
          created_at: string
          id: string
          net_change: number
          notes: string
          reason: string
          run_label: string
          scope: string
          started_at: string
          total_credits: number
          total_debits: number
          total_users_affected: number
          triggered_by: string | null
        }
        Insert: {
          affected_user_id?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          net_change?: number
          notes?: string
          reason?: string
          run_label?: string
          scope?: string
          started_at?: string
          total_credits?: number
          total_debits?: number
          total_users_affected?: number
          triggered_by?: string | null
        }
        Update: {
          affected_user_id?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          net_change?: number
          notes?: string
          reason?: string
          run_label?: string
          scope?: string
          started_at?: string
          total_credits?: number
          total_debits?: number
          total_users_affected?: number
          triggered_by?: string | null
        }
        Relationships: []
      }
      commission_settings: {
        Row: {
          created_at: string
          id: string
          min_monthly_purchase: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          min_monthly_purchase?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          min_monthly_purchase?: number
          updated_at?: string
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
      contact_form_fields: {
        Row: {
          created_at: string
          field_type: string
          id: string
          is_active: boolean
          is_protected: boolean
          is_required: boolean
          label: string
          options: Json
          placeholder: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          field_type?: string
          id?: string
          is_active?: boolean
          is_protected?: boolean
          is_required?: boolean
          label: string
          options?: Json
          placeholder?: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          field_type?: string
          id?: string
          is_active?: boolean
          is_protected?: boolean
          is_required?: boolean
          label?: string
          options?: Json
          placeholder?: string
          sort_order?: number
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          created_at: string
          id: string
          ip_address: string | null
          status: string
          submitted_data: Json
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address?: string | null
          status?: string
          submitted_data?: Json
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: string | null
          status?: string
          submitted_data?: Json
        }
        Relationships: []
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
      custom_code_history: {
        Row: {
          content: string
          id: string
          saved_at: string
          saved_by: string | null
          type: string
        }
        Insert: {
          content?: string
          id?: string
          saved_at?: string
          saved_by?: string | null
          type?: string
        }
        Update: {
          content?: string
          id?: string
          saved_at?: string
          saved_by?: string | null
          type?: string
        }
        Relationships: []
      }
      custom_code_settings: {
        Row: {
          css_enabled: boolean
          custom_css: string
          custom_js: string
          id: string
          js_enabled: boolean
          js_injection_position: string
          updated_at: string
        }
        Insert: {
          css_enabled?: boolean
          custom_css?: string
          custom_js?: string
          id?: string
          js_enabled?: boolean
          js_injection_position?: string
          updated_at?: string
        }
        Update: {
          css_enabled?: boolean
          custom_css?: string
          custom_js?: string
          id?: string
          js_enabled?: boolean
          js_injection_position?: string
          updated_at?: string
        }
        Relationships: []
      }
      default_placement_settings: {
        Row: {
          created_at: string
          default_referral_code: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_referral_code?: string
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_referral_code?: string
          id?: string
          updated_at?: string
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
      feature_toggles: {
        Row: {
          feature_key: string
          id: string
          is_enabled: boolean
          label: string
          updated_at: string
        }
        Insert: {
          feature_key: string
          id?: string
          is_enabled?: boolean
          label?: string
          updated_at?: string
        }
        Update: {
          feature_key?: string
          id?: string
          is_enabled?: boolean
          label?: string
          updated_at?: string
        }
        Relationships: []
      }
      featured_section_products: {
        Row: {
          created_at: string
          id: string
          product_id: string
          section_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          section_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          section_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "featured_section_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "featured_section_products_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "featured_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      featured_sections: {
        Row: {
          bg_color: string
          category_filter: string | null
          created_at: string
          id: string
          is_active: boolean
          selection_type: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          bg_color?: string
          category_filter?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          selection_type?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Update: {
          bg_color?: string
          category_filter?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          selection_type?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      footer_menu_items: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          label: string
          open_in_new_tab: boolean
          section_id: string
          url: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          label?: string
          open_in_new_tab?: boolean
          section_id: string
          url?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          label?: string
          open_in_new_tab?: boolean
          section_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "footer_menu_items_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "footer_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      footer_sections: {
        Row: {
          created_at: string
          display_order: number
          heading: string
          heading_color: string
          heading_font_size: string
          id: string
          is_active: boolean
          updated_at: string
          width_percentage: number
        }
        Insert: {
          created_at?: string
          display_order?: number
          heading?: string
          heading_color?: string
          heading_font_size?: string
          id?: string
          is_active?: boolean
          updated_at?: string
          width_percentage?: number
        }
        Update: {
          created_at?: string
          display_order?: number
          heading?: string
          heading_color?: string
          heading_font_size?: string
          id?: string
          is_active?: boolean
          updated_at?: string
          width_percentage?: number
        }
        Relationships: []
      }
      footer_settings: {
        Row: {
          bg_color: string
          border_color: string
          brand_description: string
          copyright_text: string
          created_at: string
          heading_color: string
          id: string
          layout_sections: number
          link_color: string
          link_hover_color: string
          show_brand_section: boolean
          show_visit_counter: boolean
          text_color: string
          updated_at: string
          visit_counter_base: number
          visit_counter_format: string
          visit_counter_label: string
          visit_counter_total: number
        }
        Insert: {
          bg_color?: string
          border_color?: string
          brand_description?: string
          copyright_text?: string
          created_at?: string
          heading_color?: string
          id?: string
          layout_sections?: number
          link_color?: string
          link_hover_color?: string
          show_brand_section?: boolean
          show_visit_counter?: boolean
          text_color?: string
          updated_at?: string
          visit_counter_base?: number
          visit_counter_format?: string
          visit_counter_label?: string
          visit_counter_total?: number
        }
        Update: {
          bg_color?: string
          border_color?: string
          brand_description?: string
          copyright_text?: string
          created_at?: string
          heading_color?: string
          id?: string
          layout_sections?: number
          link_color?: string
          link_hover_color?: string
          show_brand_section?: boolean
          show_visit_counter?: boolean
          text_color?: string
          updated_at?: string
          visit_counter_base?: number
          visit_counter_format?: string
          visit_counter_label?: string
          visit_counter_total?: number
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
      how_it_works_items: {
        Row: {
          created_at: string
          description: string
          icon: string
          id: string
          is_active: boolean
          sort_order: number
          title: string
        }
        Insert: {
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          title?: string
        }
        Update: {
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          title?: string
        }
        Relationships: []
      }
      how_it_works_settings: {
        Row: {
          bg_color: string
          bg_image_url: string
          card_bg_color: string
          created_at: string
          desc_color: string
          desc_font_size: number
          display_style: string
          icon_color: string
          icon_size: number
          id: string
          is_active: boolean
          show_step_numbers: boolean
          step_number_color: string
          subtitle: string
          title: string
          title_color: string
          title_font_size: number
          updated_at: string
        }
        Insert: {
          bg_color?: string
          bg_image_url?: string
          card_bg_color?: string
          created_at?: string
          desc_color?: string
          desc_font_size?: number
          display_style?: string
          icon_color?: string
          icon_size?: number
          id?: string
          is_active?: boolean
          show_step_numbers?: boolean
          step_number_color?: string
          subtitle?: string
          title?: string
          title_color?: string
          title_font_size?: number
          updated_at?: string
        }
        Update: {
          bg_color?: string
          bg_image_url?: string
          card_bg_color?: string
          created_at?: string
          desc_color?: string
          desc_font_size?: number
          display_style?: string
          icon_color?: string
          icon_size?: number
          id?: string
          is_active?: boolean
          show_step_numbers?: boolean
          step_number_color?: string
          subtitle?: string
          title?: string
          title_color?: string
          title_font_size?: number
          updated_at?: string
        }
        Relationships: []
      }
      inventory_logs: {
        Row: {
          change_quantity: number
          change_type: string
          changed_by: string | null
          created_at: string
          id: string
          new_stock: number
          note: string | null
          previous_stock: number
          product_id: string
        }
        Insert: {
          change_quantity?: number
          change_type?: string
          changed_by?: string | null
          created_at?: string
          id?: string
          new_stock?: number
          note?: string | null
          previous_stock?: number
          product_id: string
        }
        Update: {
          change_quantity?: number
          change_type?: string
          changed_by?: string | null
          created_at?: string
          id?: string
          new_stock?: number
          note?: string | null
          previous_stock?: number
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_logs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      kyc_documents: {
        Row: {
          admin_note: string | null
          created_at: string
          document_number: string
          document_type: string
          document_url: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          document_number?: string
          document_type: string
          document_url: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          document_number?: string
          document_type?: string
          document_url?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      landing_section_order: {
        Row: {
          id: string
          is_visible: boolean
          section_key: string
          section_label: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          id?: string
          is_visible?: boolean
          section_key: string
          section_label?: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          id?: string
          is_visible?: boolean
          section_key?: string
          section_label?: string
          sort_order?: number
          updated_at?: string
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
      manual_subscriptions: {
        Row: {
          activated_by: string
          amount: number
          created_at: string
          id: string
          notes: string | null
          payment_method: string
          screenshot_url: string | null
          user_id: string
        }
        Insert: {
          activated_by: string
          amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          payment_method?: string
          screenshot_url?: string | null
          user_id: string
        }
        Update: {
          activated_by?: string
          amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          payment_method?: string
          screenshot_url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      marquee_items: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          marquee_id: string
          sort_order: number
          text: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          marquee_id: string
          sort_order?: number
          text?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          marquee_id?: string
          sort_order?: number
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "marquee_items_marquee_id_fkey"
            columns: ["marquee_id"]
            isOneToOne: false
            referencedRelation: "marquee_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      marquee_sections: {
        Row: {
          bg_color: string
          created_at: string
          direction: string
          font_family: string
          font_size: number
          font_weight: string
          height: number
          id: string
          is_active: boolean
          sort_order: number
          speed: number
          text_color: string
          title: string
          updated_at: string
        }
        Insert: {
          bg_color?: string
          created_at?: string
          direction?: string
          font_family?: string
          font_size?: number
          font_weight?: string
          height?: number
          id?: string
          is_active?: boolean
          sort_order?: number
          speed?: number
          text_color?: string
          title?: string
          updated_at?: string
        }
        Update: {
          bg_color?: string
          created_at?: string
          direction?: string
          font_family?: string
          font_size?: number
          font_weight?: string
          height?: number
          id?: string
          is_active?: boolean
          sort_order?: number
          speed?: number
          text_color?: string
          title?: string
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
      newsletter_settings: {
        Row: {
          bg_color: string
          button_text: string
          heading: string
          id: string
          subtext: string
          updated_at: string
        }
        Insert: {
          bg_color?: string
          button_text?: string
          heading?: string
          id?: string
          subtext?: string
          updated_at?: string
        }
        Update: {
          bg_color?: string
          button_text?: string
          heading?: string
          id?: string
          subtext?: string
          updated_at?: string
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          email: string
          id: string
          is_active: boolean
          subscribed_at: string
        }
        Insert: {
          email: string
          id?: string
          is_active?: boolean
          subscribed_at?: string
        }
        Update: {
          email?: string
          id?: string
          is_active?: boolean
          subscribed_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          price: number
          product_id: string
          quantity: number
          variation_id: string | null
          variation_label: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          price: number
          product_id: string
          quantity?: number
          variation_id?: string | null
          variation_label?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          price?: number
          product_id?: string
          quantity?: number
          variation_id?: string | null
          variation_label?: string | null
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
          {
            foreignKeyName: "order_items_variation_id_fkey"
            columns: ["variation_id"]
            isOneToOne: false
            referencedRelation: "product_variations"
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
      order_number_settings: {
        Row: {
          created_at: string
          id: string
          next_number: number
          padding: number
          prefix: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          next_number?: number
          padding?: number
          prefix?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          next_number?: number
          padding?: number
          prefix?: string
          updated_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          created_at: string
          delivery_method: string
          id: string
          is_first_order: boolean | null
          is_repurchase: boolean
          order_number: string | null
          order_source: string
          payment_method: string | null
          picked_up_at: string | null
          picked_up_by_admin_id: string | null
          pickup_code: string | null
          pickup_location_id: string | null
          pickup_verified: boolean
          price_type_used: string | null
          razorpay_amount: number
          shipping_address: Json | null
          shipping_charge: number
          shipping_method: string | null
          status: string
          total_amount: number
          updated_at: string
          user_id: string
          wallet_amount_used: number
        }
        Insert: {
          created_at?: string
          delivery_method?: string
          id?: string
          is_first_order?: boolean | null
          is_repurchase?: boolean
          order_number?: string | null
          order_source?: string
          payment_method?: string | null
          picked_up_at?: string | null
          picked_up_by_admin_id?: string | null
          pickup_code?: string | null
          pickup_location_id?: string | null
          pickup_verified?: boolean
          price_type_used?: string | null
          razorpay_amount?: number
          shipping_address?: Json | null
          shipping_charge?: number
          shipping_method?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
          user_id: string
          wallet_amount_used?: number
        }
        Update: {
          created_at?: string
          delivery_method?: string
          id?: string
          is_first_order?: boolean | null
          is_repurchase?: boolean
          order_number?: string | null
          order_source?: string
          payment_method?: string | null
          picked_up_at?: string | null
          picked_up_by_admin_id?: string | null
          pickup_code?: string | null
          pickup_location_id?: string | null
          pickup_verified?: boolean
          price_type_used?: string | null
          razorpay_amount?: number
          shipping_address?: Json | null
          shipping_charge?: number
          shipping_method?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string
          wallet_amount_used?: number
        }
        Relationships: [
          {
            foreignKeyName: "orders_pickup_location_id_fkey"
            columns: ["pickup_location_id"]
            isOneToOne: false
            referencedRelation: "pickup_locations"
            referencedColumns: ["id"]
          },
        ]
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
      payout_transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          note: string | null
          paid_by_admin_id: string
          payment_date: string
          payment_mode: string
          status: string
          transaction_ref: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          note?: string | null
          paid_by_admin_id: string
          payment_date?: string
          payment_mode?: string
          status?: string
          transaction_ref: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          note?: string | null
          paid_by_admin_id?: string
          payment_date?: string
          payment_mode?: string
          status?: string
          transaction_ref?: string
          user_id?: string
        }
        Relationships: []
      }
      pickup_locations: {
        Row: {
          address_line1: string
          address_line2: string | null
          city: string
          created_at: string
          hours: string | null
          id: string
          is_active: boolean
          name: string
          phone: string | null
          pincode: string | null
          sort_order: number
          state: string | null
          updated_at: string
        }
        Insert: {
          address_line1: string
          address_line2?: string | null
          city: string
          created_at?: string
          hours?: string | null
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          pincode?: string | null
          sort_order?: number
          state?: string | null
          updated_at?: string
        }
        Update: {
          address_line1?: string
          address_line2?: string | null
          city?: string
          created_at?: string
          hours?: string | null
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          pincode?: string | null
          sort_order?: number
          state?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      pickup_verification_logs: {
        Row: {
          admin_id: string | null
          code_entered: string
          created_at: string
          id: string
          ip_address: string | null
          order_id: string
          reason: string | null
          success: boolean
          user_agent: string | null
        }
        Insert: {
          admin_id?: string | null
          code_entered: string
          created_at?: string
          id?: string
          ip_address?: string | null
          order_id: string
          reason?: string | null
          success: boolean
          user_agent?: string | null
        }
        Update: {
          admin_id?: string | null
          code_entered?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          order_id?: string
          reason?: string | null
          success?: boolean
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pickup_verification_logs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      popup_advanced_rules: {
        Row: {
          arriving_from_source: boolean
          arriving_from_url: boolean
          device_type: string
          hide_logged_in: boolean
          id: string
          max_times: number
          pageview_count: number
          popup_id: string
          referrer_url: string
          session_count: number
          show_after_pageviews: boolean
          show_after_sessions: boolean
          show_max_times: boolean
          show_on_devices: boolean
          traffic_source: string
        }
        Insert: {
          arriving_from_source?: boolean
          arriving_from_url?: boolean
          device_type?: string
          hide_logged_in?: boolean
          id?: string
          max_times?: number
          pageview_count?: number
          popup_id: string
          referrer_url?: string
          session_count?: number
          show_after_pageviews?: boolean
          show_after_sessions?: boolean
          show_max_times?: boolean
          show_on_devices?: boolean
          traffic_source?: string
        }
        Update: {
          arriving_from_source?: boolean
          arriving_from_url?: boolean
          device_type?: string
          hide_logged_in?: boolean
          id?: string
          max_times?: number
          pageview_count?: number
          popup_id?: string
          referrer_url?: string
          session_count?: number
          show_after_pageviews?: boolean
          show_after_sessions?: boolean
          show_max_times?: boolean
          show_on_devices?: boolean
          traffic_source?: string
        }
        Relationships: [
          {
            foreignKeyName: "popup_advanced_rules_popup_id_fkey"
            columns: ["popup_id"]
            isOneToOne: true
            referencedRelation: "popups"
            referencedColumns: ["id"]
          },
        ]
      }
      popup_conditions: {
        Row: {
          id: string
          include_exclude: string
          page_type: string
          popup_id: string
          scope: string
          sort_order: number
          specific_page: string
        }
        Insert: {
          id?: string
          include_exclude?: string
          page_type?: string
          popup_id: string
          scope?: string
          sort_order?: number
          specific_page?: string
        }
        Update: {
          id?: string
          include_exclude?: string
          page_type?: string
          popup_id?: string
          scope?: string
          sort_order?: number
          specific_page?: string
        }
        Relationships: [
          {
            foreignKeyName: "popup_conditions_popup_id_fkey"
            columns: ["popup_id"]
            isOneToOne: false
            referencedRelation: "popups"
            referencedColumns: ["id"]
          },
        ]
      }
      popup_triggers: {
        Row: {
          after_inactivity: boolean
          click_count: number
          element_selector: string
          id: string
          inactivity_seconds: number
          on_click: boolean
          on_exit_intent: boolean
          on_page_load: boolean
          on_scroll: boolean
          on_scroll_to_element: boolean
          page_load_delay: number
          popup_id: string
          scroll_direction: string
          scroll_percent: number
        }
        Insert: {
          after_inactivity?: boolean
          click_count?: number
          element_selector?: string
          id?: string
          inactivity_seconds?: number
          on_click?: boolean
          on_exit_intent?: boolean
          on_page_load?: boolean
          on_scroll?: boolean
          on_scroll_to_element?: boolean
          page_load_delay?: number
          popup_id: string
          scroll_direction?: string
          scroll_percent?: number
        }
        Update: {
          after_inactivity?: boolean
          click_count?: number
          element_selector?: string
          id?: string
          inactivity_seconds?: number
          on_click?: boolean
          on_exit_intent?: boolean
          on_page_load?: boolean
          on_scroll?: boolean
          on_scroll_to_element?: boolean
          page_load_delay?: number
          popup_id?: string
          scroll_direction?: string
          scroll_percent?: number
        }
        Relationships: [
          {
            foreignKeyName: "popup_triggers_popup_id_fkey"
            columns: ["popup_id"]
            isOneToOne: true
            referencedRelation: "popups"
            referencedColumns: ["id"]
          },
        ]
      }
      popups: {
        Row: {
          bg_color: string
          btn1_link: string
          btn1_text: string
          btn2_action: string
          btn2_text: string
          close_on_overlay: boolean
          created_at: string
          description: string
          id: string
          image_url: string
          name: string
          overlay_color: string
          overlay_opacity: number
          position: string
          show_close_btn: boolean
          sort_order: number
          status: boolean
          title: string
          type: string
          updated_at: string
          width: number
        }
        Insert: {
          bg_color?: string
          btn1_link?: string
          btn1_text?: string
          btn2_action?: string
          btn2_text?: string
          close_on_overlay?: boolean
          created_at?: string
          description?: string
          id?: string
          image_url?: string
          name?: string
          overlay_color?: string
          overlay_opacity?: number
          position?: string
          show_close_btn?: boolean
          sort_order?: number
          status?: boolean
          title?: string
          type?: string
          updated_at?: string
          width?: number
        }
        Update: {
          bg_color?: string
          btn1_link?: string
          btn1_text?: string
          btn2_action?: string
          btn2_text?: string
          close_on_overlay?: boolean
          created_at?: string
          description?: string
          id?: string
          image_url?: string
          name?: string
          overlay_color?: string
          overlay_opacity?: number
          position?: string
          show_close_btn?: boolean
          sort_order?: number
          status?: boolean
          title?: string
          type?: string
          updated_at?: string
          width?: number
        }
        Relationships: []
      }
      product_categories: {
        Row: {
          banner_url: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          seo_description: string
          seo_title: string
          slug: string
          sort_order: number
        }
        Insert: {
          banner_url?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          seo_description?: string
          seo_title?: string
          slug?: string
          sort_order?: number
        }
        Update: {
          banner_url?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          seo_description?: string
          seo_title?: string
          slug?: string
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
      product_reviews: {
        Row: {
          admin_note: string | null
          created_at: string
          id: string
          images: Json
          is_bulk_uploaded: boolean
          is_verified_purchase: boolean
          order_id: string | null
          product_id: string
          rating: number
          review_body: string
          review_date: string
          review_title: string
          reviewer_name: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          id?: string
          images?: Json
          is_bulk_uploaded?: boolean
          is_verified_purchase?: boolean
          order_id?: string | null
          product_id: string
          rating: number
          review_body?: string
          review_date?: string
          review_title?: string
          reviewer_name?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          id?: string
          images?: Json
          is_bulk_uploaded?: boolean
          is_verified_purchase?: boolean
          order_id?: string | null
          product_id?: string
          rating?: number
          review_body?: string
          review_date?: string
          review_title?: string
          reviewer_name?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_tags: {
        Row: {
          created_at: string
          id: string
          product_id: string
          tag: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          tag?: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_tags_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variations: {
        Row: {
          attribute_name: string
          attribute_value: string
          created_at: string
          id: string
          is_active: boolean
          price_adjustment: number
          product_id: string
          sku: string | null
          sort_order: number
          stock: number
        }
        Insert: {
          attribute_name?: string
          attribute_value?: string
          created_at?: string
          id?: string
          is_active?: boolean
          price_adjustment?: number
          product_id: string
          sku?: string | null
          sort_order?: number
          stock?: number
        }
        Update: {
          attribute_name?: string
          attribute_value?: string
          created_at?: string
          id?: string
          is_active?: boolean
          price_adjustment?: number
          product_id?: string
          sku?: string | null
          sort_order?: number
          stock?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_variations_product_id_fkey"
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
          allow_backorder: boolean
          category: string
          created_at: string
          description: string | null
          distributor_price: number
          id: string
          image_url: string | null
          name: string
          rating: number | null
          retail_price: number
          seo_description: string | null
          seo_keywords: string
          seo_slug: string | null
          seo_title: string | null
          sort_order: number
          stock: number
        }
        Insert: {
          active?: boolean
          allow_backorder?: boolean
          category?: string
          created_at?: string
          description?: string | null
          distributor_price: number
          id?: string
          image_url?: string | null
          name: string
          rating?: number | null
          retail_price: number
          seo_description?: string | null
          seo_keywords?: string
          seo_slug?: string | null
          seo_title?: string | null
          sort_order?: number
          stock?: number
        }
        Update: {
          active?: boolean
          allow_backorder?: boolean
          category?: string
          created_at?: string
          description?: string | null
          distributor_price?: number
          id?: string
          image_url?: string | null
          name?: string
          rating?: number | null
          retail_price?: number
          seo_description?: string | null
          seo_keywords?: string
          seo_slug?: string | null
          seo_title?: string | null
          sort_order?: number
          stock?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          anniversary_date: string | null
          avatar_url: string | null
          birth_date: string | null
          created_at: string
          direct_referral_count: number
          first_name: string
          full_name: string
          id: string
          last_name: string
          membership_activated_at: string | null
          membership_source: string | null
          middle_name: string
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
          anniversary_date?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string
          direct_referral_count?: number
          first_name?: string
          full_name?: string
          id?: string
          last_name?: string
          membership_activated_at?: string | null
          membership_source?: string | null
          middle_name?: string
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
          anniversary_date?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string
          direct_referral_count?: number
          first_name?: string
          full_name?: string
          id?: string
          last_name?: string
          membership_activated_at?: string | null
          membership_source?: string | null
          middle_name?: string
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
      reels_settings: {
        Row: {
          bg_color: string
          bg_image_url: string
          bg_type: string
          cards_desktop: number
          cards_mobile: number
          enable_swipe: boolean
          gradient_direction: string
          gradient_stops: Json
          id: string
          is_enabled: boolean
          padding_bottom: number
          padding_top: number
          section_subtitle: string
          section_title: string
          show_arrows: boolean
          show_description: boolean
          show_platform_badge: boolean
          show_title: boolean
          updated_at: string
        }
        Insert: {
          bg_color?: string
          bg_image_url?: string
          bg_type?: string
          cards_desktop?: number
          cards_mobile?: number
          enable_swipe?: boolean
          gradient_direction?: string
          gradient_stops?: Json
          id?: string
          is_enabled?: boolean
          padding_bottom?: number
          padding_top?: number
          section_subtitle?: string
          section_title?: string
          show_arrows?: boolean
          show_description?: boolean
          show_platform_badge?: boolean
          show_title?: boolean
          updated_at?: string
        }
        Update: {
          bg_color?: string
          bg_image_url?: string
          bg_type?: string
          cards_desktop?: number
          cards_mobile?: number
          enable_swipe?: boolean
          gradient_direction?: string
          gradient_stops?: Json
          id?: string
          is_enabled?: boolean
          padding_bottom?: number
          padding_top?: number
          section_subtitle?: string
          section_title?: string
          show_arrows?: boolean
          show_description?: boolean
          show_platform_badge?: boolean
          show_title?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      reels_videos: {
        Row: {
          created_at: string
          custom_thumbnail_url: string
          description: string
          destination_link: string
          id: string
          is_active: boolean
          link_target: string
          platform: string
          sort_order: number
          thumbnail_url: string
          title: string
          updated_at: string
          video_id: string
          video_url: string
        }
        Insert: {
          created_at?: string
          custom_thumbnail_url?: string
          description?: string
          destination_link?: string
          id?: string
          is_active?: boolean
          link_target?: string
          platform?: string
          sort_order?: number
          thumbnail_url?: string
          title?: string
          updated_at?: string
          video_id?: string
          video_url?: string
        }
        Update: {
          created_at?: string
          custom_thumbnail_url?: string
          description?: string
          destination_link?: string
          id?: string
          is_active?: boolean
          link_target?: string
          platform?: string
          sort_order?: number
          thumbnail_url?: string
          title?: string
          updated_at?: string
          video_id?: string
          video_url?: string
        }
        Relationships: []
      }
      referral_code_settings: {
        Row: {
          created_at: string
          id: string
          next_number: number
          padding: number
          prefix: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          next_number?: number
          padding?: number
          prefix?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          next_number?: number
          padding?: number
          prefix?: string
          updated_at?: string
        }
        Relationships: []
      }
      review_platforms: {
        Row: {
          brand_name: string
          created_at: string
          description: string | null
          icon_url: string | null
          id: string
          is_active: boolean
          platform: string
          rating: number | null
          review_count: number | null
          review_url: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          brand_name: string
          created_at?: string
          description?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean
          platform: string
          rating?: number | null
          review_count?: number | null
          review_url: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          brand_name?: string
          created_at?: string
          description?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean
          platform?: string
          rating?: number | null
          review_count?: number | null
          review_url?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      seo_redirects: {
        Row: {
          created_at: string
          from_path: string
          hits: number
          id: string
          is_active: boolean
          status_code: number
          to_path: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          from_path: string
          hits?: number
          id?: string
          is_active?: boolean
          status_code?: number
          to_path: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          from_path?: string
          hits?: number
          id?: string
          is_active?: boolean
          status_code?: number
          to_path?: string
          updated_at?: string
        }
        Relationships: []
      }
      seo_settings: {
        Row: {
          config: Json
          created_at: string
          id: string
          key: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          key: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
        }
        Relationships: []
      }
      shipping_settings: {
        Row: {
          courier_charge: number
          courier_enabled: boolean
          created_at: string
          free_courier_above: number | null
          id: string
          pickup_charge: number
          pickup_enabled: boolean
          updated_at: string
        }
        Insert: {
          courier_charge?: number
          courier_enabled?: boolean
          created_at?: string
          free_courier_above?: number | null
          id?: string
          pickup_charge?: number
          pickup_enabled?: boolean
          updated_at?: string
        }
        Update: {
          courier_charge?: number
          courier_enabled?: boolean
          created_at?: string
          free_courier_above?: number | null
          id?: string
          pickup_charge?: number
          pickup_enabled?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      sms_campaigns: {
        Row: {
          audience_filter: Json
          audience_type: string
          channel: string
          created_at: string
          created_by: string
          failed_count: number
          id: string
          link_text: string | null
          link_url: string | null
          media_type: string | null
          media_url: string | null
          message: string
          name: string
          recipient_count: number
          scheduled_at: string | null
          sent_at: string | null
          sent_count: number
          status: string
          updated_at: string
        }
        Insert: {
          audience_filter?: Json
          audience_type?: string
          channel?: string
          created_at?: string
          created_by: string
          failed_count?: number
          id?: string
          link_text?: string | null
          link_url?: string | null
          media_type?: string | null
          media_url?: string | null
          message?: string
          name?: string
          recipient_count?: number
          scheduled_at?: string | null
          sent_at?: string | null
          sent_count?: number
          status?: string
          updated_at?: string
        }
        Update: {
          audience_filter?: Json
          audience_type?: string
          channel?: string
          created_at?: string
          created_by?: string
          failed_count?: number
          id?: string
          link_text?: string | null
          link_url?: string | null
          media_type?: string | null
          media_url?: string | null
          message?: string
          name?: string
          recipient_count?: number
          scheduled_at?: string | null
          sent_at?: string | null
          sent_count?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      sms_settings: {
        Row: {
          api_key: string
          config: Json
          created_at: string
          id: string
          is_enabled: boolean
          order_updates_enabled: boolean
          otp_enabled: boolean
          provider: string
          sender_id: string
          template_id: string
          updated_at: string
          welcome_sms_enabled: boolean
        }
        Insert: {
          api_key?: string
          config?: Json
          created_at?: string
          id?: string
          is_enabled?: boolean
          order_updates_enabled?: boolean
          otp_enabled?: boolean
          provider?: string
          sender_id?: string
          template_id?: string
          updated_at?: string
          welcome_sms_enabled?: boolean
        }
        Update: {
          api_key?: string
          config?: Json
          created_at?: string
          id?: string
          is_enabled?: boolean
          order_updates_enabled?: boolean
          otp_enabled?: boolean
          provider?: string
          sender_id?: string
          template_id?: string
          updated_at?: string
          welcome_sms_enabled?: boolean
        }
        Relationships: []
      }
      sms_templates: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      social_media_links: {
        Row: {
          created_at: string
          icon: string
          id: string
          is_active: boolean
          platform: string
          sort_order: number
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          icon?: string
          id?: string
          is_active?: boolean
          platform?: string
          sort_order?: number
          updated_at?: string
          url?: string
        }
        Update: {
          created_at?: string
          icon?: string
          id?: string
          is_active?: boolean
          platform?: string
          sort_order?: number
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      system_feature_log: {
        Row: {
          created_at: string
          description: string
          feature_date: string
          id: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string
          feature_date?: string
          id?: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string
          feature_date?: string
          id?: string
          title?: string
        }
        Relationships: []
      }
      tax_settings: {
        Row: {
          created_at: string
          gst_number: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          gst_number?: string
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          gst_number?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
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
          image_url: string | null
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
          image_url?: string | null
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
          image_url?: string | null
          is_active?: boolean
          required_referrals?: number
          sort_order?: number
          title_name?: string
        }
        Relationships: []
      }
      user_addresses: {
        Row: {
          city: string
          created_at: string
          id: string
          is_default: boolean
          label: string
          line1: string
          line2: string | null
          name: string
          phone: string
          pincode: string
          state: string
          updated_at: string
          user_id: string
        }
        Insert: {
          city: string
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string
          line1: string
          line2?: string | null
          name: string
          phone: string
          pincode: string
          state: string
          updated_at?: string
          user_id: string
        }
        Update: {
          city?: string
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string
          line1?: string
          line2?: string | null
          name?: string
          phone?: string
          pincode?: string
          state?: string
          updated_at?: string
          user_id?: string
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
      wallet_transactions: {
        Row: {
          amount: number
          balance_type: string
          closing_balance: number
          created_at: string
          description: string
          id: string
          order_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount?: number
          balance_type?: string
          closing_balance?: number
          created_at?: string
          description?: string
          id?: string
          order_id?: string | null
          type?: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_type?: string
          closing_balance?: number
          created_at?: string
          description?: string
          id?: string
          order_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance: number
          commission_balance: number
          created_at: string
          id: string
          subscription_balance: number
          total_earned: number
          total_withdrawn: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          commission_balance?: number
          created_at?: string
          id?: string
          subscription_balance?: number
          total_earned?: number
          total_withdrawn?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          commission_balance?: number
          created_at?: string
          id?: string
          subscription_balance?: number
          total_earned?: number
          total_withdrawn?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_settings: {
        Row: {
          abandoned_cart_enabled: boolean
          api_key: string
          business_account_id: string
          config: Json
          created_at: string
          id: string
          is_enabled: boolean
          order_updates_enabled: boolean
          phone_number_id: string
          provider: string
          support_chat_enabled: boolean
          updated_at: string
          webhook_verify_token: string
          welcome_msg_enabled: boolean
        }
        Insert: {
          abandoned_cart_enabled?: boolean
          api_key?: string
          business_account_id?: string
          config?: Json
          created_at?: string
          id?: string
          is_enabled?: boolean
          order_updates_enabled?: boolean
          phone_number_id?: string
          provider?: string
          support_chat_enabled?: boolean
          updated_at?: string
          webhook_verify_token?: string
          welcome_msg_enabled?: boolean
        }
        Update: {
          abandoned_cart_enabled?: boolean
          api_key?: string
          business_account_id?: string
          config?: Json
          created_at?: string
          id?: string
          is_enabled?: boolean
          order_updates_enabled?: boolean
          phone_number_id?: string
          provider?: string
          support_chat_enabled?: boolean
          updated_at?: string
          webhook_verify_token?: string
          welcome_msg_enabled?: boolean
        }
        Relationships: []
      }
      why_choose_items: {
        Row: {
          created_at: string
          description: string
          icon: string
          id: string
          is_active: boolean
          sort_order: number
          title: string
        }
        Insert: {
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          title?: string
        }
        Update: {
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          title?: string
        }
        Relationships: []
      }
      why_choose_settings: {
        Row: {
          bg_color: string
          bg_image_url: string
          card_bg_color: string
          created_at: string
          desc_color: string
          desc_font_size: number
          display_style: string
          icon_color: string
          icon_size: number
          id: string
          is_active: boolean
          subtitle: string
          title: string
          title_color: string
          title_font_size: number
          updated_at: string
        }
        Insert: {
          bg_color?: string
          bg_image_url?: string
          card_bg_color?: string
          created_at?: string
          desc_color?: string
          desc_font_size?: number
          display_style?: string
          icon_color?: string
          icon_size?: number
          id?: string
          is_active?: boolean
          subtitle?: string
          title?: string
          title_color?: string
          title_font_size?: number
          updated_at?: string
        }
        Update: {
          bg_color?: string
          bg_image_url?: string
          card_bg_color?: string
          created_at?: string
          desc_color?: string
          desc_font_size?: number
          display_style?: string
          icon_color?: string
          icon_size?: number
          id?: string
          is_active?: boolean
          subtitle?: string
          title?: string
          title_color?: string
          title_font_size?: number
          updated_at?: string
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
      admin_cancel_order_and_refund: {
        Args: { _order_id: string }
        Returns: Json
      }
      admin_record_payout: {
        Args: {
          _admin_id: string
          _amount: number
          _note?: string
          _payment_date: string
          _payment_mode: string
          _transaction_ref: string
          _user_id: string
        }
        Returns: Json
      }
      admin_verify_pickup_code:
        | { Args: { _code: string; _order_id: string }; Returns: Json }
        | {
            Args: {
              _code: string
              _ip_address?: string
              _order_id: string
              _user_agent?: string
            }
            Returns: Json
          }
      admin_wallet_adjust:
        | {
            Args: {
              _amount: number
              _description: string
              _type: string
              _user_id: string
            }
            Returns: Json
          }
        | {
            Args: {
              _amount: number
              _balance_type?: string
              _description: string
              _type: string
              _user_id: string
            }
            Returns: Json
          }
      cancel_order_and_refund_wallet: {
        Args: { _order_id: string; _user_id: string }
        Returns: Json
      }
      deduct_wallet_balance: {
        Args: { _amount: number; _order_id?: string; _user_id: string }
        Returns: Json
      }
      get_active_downline_count: { Args: { _user_id: string }; Returns: number }
      get_admin_genealogy_tree: {
        Args: { _max_depth?: number; _root_profile_id?: string }
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
      get_derived_reprocess_runs: {
        Args: { _user_id?: string }
        Returns: {
          affected_users: number
          bucket_end: string
          bucket_start: string
          net_change: number
          row_count: number
          run_label: string
          total_credits: number
          total_debits: number
        }[]
      }
      get_direct_referrals: {
        Args: { _user_id: string }
        Returns: {
          avatar_url: string
          created_at: string
          direct_referral_count: number
          first_name: string
          full_name: string
          id: string
          last_name: string
          middle_name: string
          referral_code: string
          referred_by: string
          subscription_paid: boolean
          title: string
          user_id: string
        }[]
      }
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
      get_products_basic: {
        Args: { _ids: string[] }
        Returns: {
          active: boolean
          category: string
          id: string
          image_url: string
          name: string
        }[]
      }
      get_public_gst_number: { Args: never; Returns: string }
      get_public_products: {
        Args: never
        Returns: {
          active: boolean
          allow_backorder: boolean
          category: string
          created_at: string
          description: string
          distributor_price: number
          id: string
          image_url: string
          name: string
          rating: number
          retail_price: number
          seo_description: string
          seo_keywords: string
          seo_slug: string
          seo_title: string
          sort_order: number
          stock: number
        }[]
      }
      get_user_earnings_report: {
        Args: { _end_date?: string; _start_date?: string; _user_id: string }
        Returns: {
          amount: number
          commission_id: string
          commission_type: string
          created_at: string
          level: number
          order_amount: number
          order_id: string
          order_number: string
          rate: number
          source_referral_code: string
          source_user_id: string
          source_user_name: string
          status: string
        }[]
      }
      get_user_email_by_id: { Args: { _user_id: string }; Returns: string }
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
      list_public_coupons: {
        Args: never
        Returns: {
          code: string
          discount_type: string
          discount_value: number
          end_date: string
          id: string
          max_discount_amount: number
          min_order_amount: number
        }[]
      }
      validate_coupon: {
        Args: { _code: string; _order_amount: number }
        Returns: Json
      }
      validate_referral_code: { Args: { _code: string }; Returns: boolean }
      validate_referral_with_subscription: {
        Args: { _code: string }
        Returns: Json
      }
      validate_withdrawal: {
        Args: { _amount: number; _user_id: string }
        Returns: Json
      }
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
