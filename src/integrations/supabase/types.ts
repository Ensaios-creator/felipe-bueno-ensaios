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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      catalog_items: {
        Row: {
          active: boolean
          ai_description: string
          ambiance: string | null
          category: string
          code: string
          color: string | null
          created_at: string
          gender: string | null
          has_age_number: boolean
          has_cake: boolean
          id: string
          image_url: string | null
          name: string
          people_count: number | null
          position: number
          session_types: string[]
          style: string | null
          tags: string[]
          updated_at: string
          vibe: string | null
        }
        Insert: {
          active?: boolean
          ai_description?: string
          ambiance?: string | null
          category?: string
          code?: string
          color?: string | null
          created_at?: string
          gender?: string | null
          has_age_number?: boolean
          has_cake?: boolean
          id?: string
          image_url?: string | null
          name?: string
          people_count?: number | null
          position?: number
          session_types?: string[]
          style?: string | null
          tags?: string[]
          updated_at?: string
          vibe?: string | null
        }
        Update: {
          active?: boolean
          ai_description?: string
          ambiance?: string | null
          category?: string
          code?: string
          color?: string | null
          created_at?: string
          gender?: string | null
          has_age_number?: boolean
          has_cake?: boolean
          id?: string
          image_url?: string | null
          name?: string
          people_count?: number | null
          position?: number
          session_types?: string[]
          style?: string | null
          tags?: string[]
          updated_at?: string
          vibe?: string | null
        }
        Relationships: []
      }
      order_configs: {
        Row: {
          category_answers: Json
          color_palette: string | null
          confirmed: boolean
          created_at: string
          current_step: number
          framing: string | null
          hair: string | null
          lighting_mood: string | null
          makeup: string | null
          order_id: string
          outfit_mode: string | null
          session_subtype: string | null
          session_type: string | null
          special_notes: string
          updated_at: string
          visible_text_answer: string
        }
        Insert: {
          category_answers?: Json
          color_palette?: string | null
          confirmed?: boolean
          created_at?: string
          current_step?: number
          framing?: string | null
          hair?: string | null
          lighting_mood?: string | null
          makeup?: string | null
          order_id: string
          outfit_mode?: string | null
          session_subtype?: string | null
          session_type?: string | null
          special_notes?: string
          updated_at?: string
          visible_text_answer?: string
        }
        Update: {
          category_answers?: Json
          color_palette?: string | null
          confirmed?: boolean
          created_at?: string
          current_step?: number
          framing?: string | null
          hair?: string | null
          lighting_mood?: string | null
          makeup?: string | null
          order_id?: string
          outfit_mode?: string | null
          session_subtype?: string | null
          session_type?: string | null
          special_notes?: string
          updated_at?: string
          visible_text_answer?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_configs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          catalog_item_id: string
          created_at: string
          id: string
          order_id: string
          position: number
          role: string
        }
        Insert: {
          catalog_item_id: string
          created_at?: string
          id?: string
          order_id: string
          position?: number
          role: string
        }
        Update: {
          catalog_item_id?: string
          created_at?: string
          id?: string
          order_id?: string
          position?: number
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_catalog_item_id_fkey"
            columns: ["catalog_item_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_options: {
        Row: {
          created_at: string
          id: string
          label: string
          position: number
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          position?: number
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          position?: number
        }
        Relationships: []
      }
      orders: {
        Row: {
          client_name: string
          client_phone: string
          created_at: string
          due_date: string | null
          id: string
          identity_photos_received: boolean
          internal_notes: string
          order_number: number
          package_label: string | null
          photo_count: number
          priority: string
          public_token: string
          status: string
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          client_name: string
          client_phone?: string
          created_at?: string
          due_date?: string | null
          id?: string
          identity_photos_received?: boolean
          internal_notes?: string
          order_number?: number
          package_label?: string | null
          photo_count?: number
          priority?: string
          public_token?: string
          status?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          client_name?: string
          client_phone?: string
          created_at?: string
          due_date?: string | null
          id?: string
          identity_photos_received?: boolean
          internal_notes?: string
          order_number?: number
          package_label?: string | null
          photo_count?: number
          priority?: string
          public_token?: string
          status?: string
          submitted_at?: string | null
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
  public: {
    Enums: {},
  },
} as const
