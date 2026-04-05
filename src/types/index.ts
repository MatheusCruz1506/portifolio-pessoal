// logar supabase (npx supabase login) e rodar update-types para atualizar os tipos

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
      profiles: {
        Row: {
          approved: boolean
          avatar_url: string | null
          created_at: string
          email: string | null
          id: string
          name: string | null
          province: string | null
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          approved?: boolean
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id: string
          name?: string | null
          province?: string | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          approved?: boolean
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          province?: string | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
      units: {
        Row: {
          address: string
          archived_at: string | null
          city: string
          country: string
          created_at: string
          description: string | null
          email: string | null
          id: string
          image_url?: string | null
          is_archived: boolean
          latitude: number
          longitude: number
          name: string
          phone: string | null
          province: string
          state: string | null
          status: Database["public"]["Enums"]["unit_status"] | null
          type: Database["public"]["Enums"]["unit_type"]
          website: string | null
          zip_code: string | null
        }
        Insert: {
          address: string
          archived_at?: string | null
          city: string
          country: string
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          image_url?: string | null
          is_archived?: boolean
          latitude: number
          longitude: number
          name: string
          phone?: string | null
          province: string
          state?: string | null
          status?: Database["public"]["Enums"]["unit_status"] | null
          type: Database["public"]["Enums"]["unit_type"]
          website?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string
          archived_at?: string | null
          city?: string
          country?: string
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          image_url?: string | null
          is_archived?: boolean
          latitude?: number
          longitude?: number
          name?: string
          phone?: string | null
          province?: string
          state?: string | null
          status?: Database["public"]["Enums"]["unit_status"] | null
          type?: Database["public"]["Enums"]["unit_type"]
          website?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      unit_history: {
        Row: {
          action: Database["public"]["Enums"]["unit_history_action"]
          actor_name: string | null
          actor_user_id: string | null
          created_at: string
          details: Json
          id: string
          province: string
          unit_id: string | null
          unit_name: string
        }
        Insert: {
          action: Database["public"]["Enums"]["unit_history_action"]
          actor_name?: string | null
          actor_user_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          province: string
          unit_id?: string | null
          unit_name: string
        }
        Update: {
          action?: Database["public"]["Enums"]["unit_history_action"]
          actor_name?: string | null
          actor_user_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          province?: string
          unit_id?: string | null
          unit_name?: string
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
      user_role: "admin" | "editor" | "reader"
      unit_history_action:
        | "created"
        | "updated"
        | "archived"
        | "restored"
        | "deleted"
        | "imported"
      unit_status: "Ativo" | "Em Construção" | "Inativo" | "Vendido"
      unit_type:
        | "Hospital"
        | "Centro Universitário"
        | "Paróquia"
        | "Casa de Repouso"
        | "Seminário"
        | "Missão"
        | "Outro"
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
      unit_history_action: [
        "created",
        "updated",
        "archived",
        "restored",
        "deleted",
        "imported",
      ],
      unit_status: ["Ativo", "Em Construção", "Inativo", "Vendido"],
      unit_type: [
        "Hospital",
        "Centro Universitário",
        "Paróquia",
        "Casa de Repouso",
        "Seminário",
        "Missão",
        "Outro",
      ],
    },
  },
} as const
