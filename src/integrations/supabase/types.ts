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
      announcements: {
        Row: {
          bg_color: string
          created_at: string
          ends_at: string | null
          id: string
          is_active: boolean
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
      bank_details: {
        Row: {
          account_holder_name: string
          account_number: string
          bank_name: string
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
      banners: {
        Row: {
          alt_text: string
          created_at: string
          desktop_image_url: string
          destination_link: string
          id: string
          is_active: boolean
          link_target: string
          mobile_image_url: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          alt_text?: string
          created_at?: string
          desktop_image_url?: string
          destination_link?: string
          id?: string
          is_active?: boolean
          link_target?: string
          mobile_image_url?: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          alt_text?: string
          created_at?: string
          desktop_image_url?: string
          destination_link?: string
          id?: string
          is_active?: boolean
          link_target?: string
          mobile_image_url?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      brand_settings: {
        Row: {
          address: string | null
          brand_color: string | null
          brand_name: string
          button_color: string | null
          created_at: string
          email: string | null
          favicon_url: string | null
          font_body: string | null
          font_heading: string | null
          footer_logo_url: string | null
          gst_number: string | null
          id: string
          logo_url: string | null
          og_image_url: string | null
          phone: string | null
          tagline: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          brand_color?: string | null
          brand_name?: string
          button_color?: string | null
          created_at?: string
          email?: string | null
          favicon_url?: string | null
          font_body?: string | null
          font_heading?: string | null
          footer_logo_url?: string | null
          gst_number?: string | null
          id?: string
          logo_url?: string | null
          og_image_url?: string | null
          phone?: string | null
          tagline?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          brand_color?: string | null
          brand_name?: string
          button_color?: string | null
          created_at?: string
          email?: string | null
          favicon_url?: string | null
          font_body?: string | null
          font_heading?: string | null
          footer_logo_url?: string | null
          gst_number?: string | null
          id?: string
          logo_url?: string | null
          og_image_url?: string | null
          phone?: string | null
          tagline?: string | null
          updated_at?: string
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
          id: string
          is_first_order: boolean | null
          is_repurchase: boolean
          order_number: string | null
          payment_method: string | null
          price_type_used: string | null
          razorpay_amount: number
          shipping_address: Json | null
          shipping_method: string | null
          status: string
          total_amount: number
          updated_at: string
          user_id: string
          wallet_amount_used: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_first_order?: boolean | null
          is_repurchase?: boolean
          order_number?: string | null
          payment_method?: string | null
          price_type_used?: string | null
          razorpay_amount?: number
          shipping_address?: Json | null
          shipping_method?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
          user_id: string
          wallet_amount_used?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_first_order?: boolean | null
          is_repurchase?: boolean
          order_number?: string | null
          payment_method?: string | null
          price_type_used?: string | null
          razorpay_amount?: number
          shipping_address?: Json | null
          shipping_method?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string
          wallet_amount_used?: number
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
          seo_slug?: string | null
          seo_title?: string | null
          sort_order?: number
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
          membership_activated_at: string | null
          membership_source: string | null
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
          membership_activated_at?: string | null
          membership_source?: string | null
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
          membership_activated_at?: string | null
          membership_source?: string | null
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
        Args: { _amount: number; _user_id: string }
        Returns: Json
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
