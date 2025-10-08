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
      asset_hierarchy: {
        Row: {
          approval_date: string | null
          assembly_manufacturer: string | null
          assembly_name: string | null
          asset_number: string | null
          created_at: string | null
          description: string | null
          id: string
          level: number | null
          name: string
          parent_id: string | null
          path: string
          rebuild_item: string | null
          storage_path: string | null
          system: string | null
          total_cost: number | null
          updated_at: string | null
        }
        Insert: {
          approval_date?: string | null
          assembly_manufacturer?: string | null
          assembly_name?: string | null
          asset_number?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          level?: number | null
          name: string
          parent_id?: string | null
          path: string
          rebuild_item?: string | null
          storage_path?: string | null
          system?: string | null
          total_cost?: number | null
          updated_at?: string | null
        }
        Update: {
          approval_date?: string | null
          assembly_manufacturer?: string | null
          assembly_name?: string | null
          asset_number?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          level?: number | null
          name?: string
          parent_id?: string | null
          path?: string
          rebuild_item?: string | null
          storage_path?: string | null
          system?: string | null
          total_cost?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_hierarchy_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "asset_hierarchy"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_sheets: {
        Row: {
          asset_id: string
          created_at: string
          id: string
          sheet_index: number
          sheet_name: string
        }
        Insert: {
          asset_id: string
          created_at?: string
          id?: string
          sheet_index: number
          sheet_name: string
        }
        Update: {
          asset_id?: string
          created_at?: string
          id?: string
          sheet_index?: number
          sheet_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_sheets_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "asset_hierarchy"
            referencedColumns: ["id"]
          },
        ]
      }
      bom_items: {
        Row: {
          asset_id: string | null
          cost: number | null
          created_at: string | null
          description: string | null
          details: string | null
          id: string
          item_code: string | null
          item_no: string | null
          manufacturer: string | null
          part_number: string | null
          sheet_id: string | null
          sys_qty: number | null
          uom: string | null
          updated_at: string | null
        }
        Insert: {
          asset_id?: string | null
          cost?: number | null
          created_at?: string | null
          description?: string | null
          details?: string | null
          id?: string
          item_code?: string | null
          item_no?: string | null
          manufacturer?: string | null
          part_number?: string | null
          sheet_id?: string | null
          sys_qty?: number | null
          uom?: string | null
          updated_at?: string | null
        }
        Update: {
          asset_id?: string | null
          cost?: number | null
          created_at?: string | null
          description?: string | null
          details?: string | null
          id?: string
          item_code?: string | null
          item_no?: string | null
          manufacturer?: string | null
          part_number?: string | null
          sheet_id?: string | null
          sys_qty?: number | null
          uom?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bom_items_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "asset_hierarchy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bom_items_sheet_id_fkey"
            columns: ["sheet_id"]
            isOneToOne: false
            referencedRelation: "asset_sheets"
            referencedColumns: ["id"]
          },
        ]
      }
      sheet_images: {
        Row: {
          created_at: string
          id: string
          image_data: string
          image_index: number
          sheet_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_data: string
          image_index: number
          sheet_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_data?: string
          image_index?: number
          sheet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sheet_images_sheet_id_fkey"
            columns: ["sheet_id"]
            isOneToOne: false
            referencedRelation: "asset_sheets"
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
