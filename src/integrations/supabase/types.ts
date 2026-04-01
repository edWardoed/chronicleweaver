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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      adventure_access: {
        Row: {
          adventure_id: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["adventure_role"]
          user_id: string
        }
        Insert: {
          adventure_id: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["adventure_role"]
          user_id: string
        }
        Update: {
          adventure_id?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["adventure_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "adventure_access_adventure_id_fkey"
            columns: ["adventure_id"]
            isOneToOne: false
            referencedRelation: "adventures"
            referencedColumns: ["id"]
          },
        ]
      }
      adventures: {
        Row: {
          cover_image_url: string | null
          created_at: string
          description: string | null
          id: string
          location_types: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          location_types?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          location_types?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      characters: {
        Row: {
          adventure_id: string
          alignment: string | null
          armor_class: number | null
          attitude: string | null
          avatar_url: string | null
          background: string | null
          bonds: string | null
          cha_score: number | null
          class: string | null
          con_score: number | null
          created_at: string
          created_by: string | null
          current_hp: number | null
          death_save_failures: number | null
          death_save_successes: number | null
          dex_score: number | null
          dm_notes_visible: boolean
          equipment: Json | null
          experience_points: number | null
          features_traits: string | null
          flaws: string | null
          hit_dice: string | null
          id: string
          ideals: string | null
          initiative_override: number | null
          int_score: number | null
          level: number | null
          max_hp: number | null
          name: string
          notes: string | null
          personality_traits: string | null
          physical_description: string | null
          proficiencies_languages: string | null
          race: string | null
          role_occupation: string | null
          saving_throw_proficiencies: string[] | null
          skill_half_proficiencies: string[] | null
          skill_proficiencies: string[] | null
          speed: number | null
          spell_slots: Json | null
          spellcasting_ability: string | null
          spells: Json | null
          story_role: string | null
          str_score: number | null
          subclass: string | null
          temp_hp: number | null
          type: string | null
          updated_at: string
          voice_mannerisms: string | null
          wis_score: number | null
        }
        Insert: {
          adventure_id: string
          alignment?: string | null
          armor_class?: number | null
          attitude?: string | null
          avatar_url?: string | null
          background?: string | null
          bonds?: string | null
          cha_score?: number | null
          class?: string | null
          con_score?: number | null
          created_at?: string
          created_by?: string | null
          current_hp?: number | null
          death_save_failures?: number | null
          death_save_successes?: number | null
          dex_score?: number | null
          dm_notes_visible?: boolean
          equipment?: Json | null
          experience_points?: number | null
          features_traits?: string | null
          flaws?: string | null
          hit_dice?: string | null
          id?: string
          ideals?: string | null
          initiative_override?: number | null
          int_score?: number | null
          level?: number | null
          max_hp?: number | null
          name: string
          notes?: string | null
          personality_traits?: string | null
          physical_description?: string | null
          proficiencies_languages?: string | null
          race?: string | null
          role_occupation?: string | null
          saving_throw_proficiencies?: string[] | null
          skill_half_proficiencies?: string[] | null
          skill_proficiencies?: string[] | null
          speed?: number | null
          spell_slots?: Json | null
          spellcasting_ability?: string | null
          spells?: Json | null
          story_role?: string | null
          str_score?: number | null
          subclass?: string | null
          temp_hp?: number | null
          type?: string | null
          updated_at?: string
          voice_mannerisms?: string | null
          wis_score?: number | null
        }
        Update: {
          adventure_id?: string
          alignment?: string | null
          armor_class?: number | null
          attitude?: string | null
          avatar_url?: string | null
          background?: string | null
          bonds?: string | null
          cha_score?: number | null
          class?: string | null
          con_score?: number | null
          created_at?: string
          created_by?: string | null
          current_hp?: number | null
          death_save_failures?: number | null
          death_save_successes?: number | null
          dex_score?: number | null
          dm_notes_visible?: boolean
          equipment?: Json | null
          experience_points?: number | null
          features_traits?: string | null
          flaws?: string | null
          hit_dice?: string | null
          id?: string
          ideals?: string | null
          initiative_override?: number | null
          int_score?: number | null
          level?: number | null
          max_hp?: number | null
          name?: string
          notes?: string | null
          personality_traits?: string | null
          physical_description?: string | null
          proficiencies_languages?: string | null
          race?: string | null
          role_occupation?: string | null
          saving_throw_proficiencies?: string[] | null
          skill_half_proficiencies?: string[] | null
          skill_proficiencies?: string[] | null
          speed?: number | null
          spell_slots?: Json | null
          spellcasting_ability?: string | null
          spells?: Json | null
          story_role?: string | null
          str_score?: number | null
          subclass?: string | null
          temp_hp?: number | null
          type?: string | null
          updated_at?: string
          voice_mannerisms?: string | null
          wis_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "characters_adventure_id_fkey"
            columns: ["adventure_id"]
            isOneToOne: false
            referencedRelation: "adventures"
            referencedColumns: ["id"]
          },
        ]
      }
      entries: {
        Row: {
          adventure_id: string
          created_at: string
          id: string
          real_world_date: string | null
          session_date_end: string | null
          session_date_start: string | null
          session_number: number | null
          story_content: string | null
          title: string
          updated_at: string
        }
        Insert: {
          adventure_id: string
          created_at?: string
          id?: string
          real_world_date?: string | null
          session_date_end?: string | null
          session_date_start?: string | null
          session_number?: number | null
          story_content?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          adventure_id?: string
          created_at?: string
          id?: string
          real_world_date?: string | null
          session_date_end?: string | null
          session_date_start?: string | null
          session_number?: number | null
          story_content?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "entries_adventure_id_fkey"
            columns: ["adventure_id"]
            isOneToOne: false
            referencedRelation: "adventures"
            referencedColumns: ["id"]
          },
        ]
      }
      entry_characters: {
        Row: {
          character_id: string
          entry_id: string
          id: string
        }
        Insert: {
          character_id: string
          entry_id: string
          id?: string
        }
        Update: {
          character_id?: string
          entry_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entry_characters_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entry_characters_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entry_characters_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
        ]
      }
      entry_locations: {
        Row: {
          entry_id: string
          id: string
          location_id: string
        }
        Insert: {
          entry_id: string
          id?: string
          location_id: string
        }
        Update: {
          entry_id?: string
          id?: string
          location_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entry_locations_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entry_locations_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entry_locations_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          adventure_id: string
          created_at: string
          description: string | null
          dm_notes: string | null
          dm_notes_visible: boolean
          id: string
          image_url: string | null
          name: string
          notes: string | null
          type: string | null
          updated_at: string
        }
        Insert: {
          adventure_id: string
          created_at?: string
          description?: string | null
          dm_notes?: string | null
          dm_notes_visible?: boolean
          id?: string
          image_url?: string | null
          name: string
          notes?: string | null
          type?: string | null
          updated_at?: string
        }
        Update: {
          adventure_id?: string
          created_at?: string
          description?: string | null
          dm_notes?: string | null
          dm_notes_visible?: boolean
          id?: string
          image_url?: string | null
          name?: string
          notes?: string | null
          type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_adventure_id_fkey"
            columns: ["adventure_id"]
            isOneToOne: false
            referencedRelation: "adventures"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string
          email: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name: string
          email: string
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          email?: string
          id?: string
          updated_at?: string
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
    }
    Views: {
      characters_safe: {
        Row: {
          adventure_id: string | null
          alignment: string | null
          armor_class: number | null
          attitude: string | null
          avatar_url: string | null
          background: string | null
          bonds: string | null
          cha_score: number | null
          class: string | null
          con_score: number | null
          created_at: string | null
          created_by: string | null
          current_hp: number | null
          death_save_failures: number | null
          death_save_successes: number | null
          dex_score: number | null
          dm_notes_visible: boolean | null
          equipment: Json | null
          experience_points: number | null
          features_traits: string | null
          flaws: string | null
          hit_dice: string | null
          id: string | null
          ideals: string | null
          initiative_override: number | null
          int_score: number | null
          level: number | null
          max_hp: number | null
          name: string | null
          notes: string | null
          personality_traits: string | null
          physical_description: string | null
          proficiencies_languages: string | null
          race: string | null
          role_occupation: string | null
          saving_throw_proficiencies: string[] | null
          skill_half_proficiencies: string[] | null
          skill_proficiencies: string[] | null
          speed: number | null
          spell_slots: Json | null
          spellcasting_ability: string | null
          spells: Json | null
          story_role: string | null
          str_score: number | null
          subclass: string | null
          temp_hp: number | null
          type: string | null
          updated_at: string | null
          voice_mannerisms: string | null
          wis_score: number | null
        }
        Insert: {
          adventure_id?: string | null
          alignment?: string | null
          armor_class?: number | null
          attitude?: string | null
          avatar_url?: string | null
          background?: string | null
          bonds?: string | null
          cha_score?: number | null
          class?: string | null
          con_score?: number | null
          created_at?: string | null
          created_by?: string | null
          current_hp?: number | null
          death_save_failures?: number | null
          death_save_successes?: number | null
          dex_score?: number | null
          dm_notes_visible?: boolean | null
          equipment?: Json | null
          experience_points?: number | null
          features_traits?: string | null
          flaws?: string | null
          hit_dice?: string | null
          id?: string | null
          ideals?: string | null
          initiative_override?: number | null
          int_score?: number | null
          level?: number | null
          max_hp?: number | null
          name?: string | null
          notes?: never
          personality_traits?: string | null
          physical_description?: string | null
          proficiencies_languages?: string | null
          race?: string | null
          role_occupation?: string | null
          saving_throw_proficiencies?: string[] | null
          skill_half_proficiencies?: string[] | null
          skill_proficiencies?: string[] | null
          speed?: number | null
          spell_slots?: Json | null
          spellcasting_ability?: string | null
          spells?: Json | null
          story_role?: string | null
          str_score?: number | null
          subclass?: string | null
          temp_hp?: number | null
          type?: string | null
          updated_at?: string | null
          voice_mannerisms?: string | null
          wis_score?: number | null
        }
        Update: {
          adventure_id?: string | null
          alignment?: string | null
          armor_class?: number | null
          attitude?: string | null
          avatar_url?: string | null
          background?: string | null
          bonds?: string | null
          cha_score?: number | null
          class?: string | null
          con_score?: number | null
          created_at?: string | null
          created_by?: string | null
          current_hp?: number | null
          death_save_failures?: number | null
          death_save_successes?: number | null
          dex_score?: number | null
          dm_notes_visible?: boolean | null
          equipment?: Json | null
          experience_points?: number | null
          features_traits?: string | null
          flaws?: string | null
          hit_dice?: string | null
          id?: string | null
          ideals?: string | null
          initiative_override?: number | null
          int_score?: number | null
          level?: number | null
          max_hp?: number | null
          name?: string | null
          notes?: never
          personality_traits?: string | null
          physical_description?: string | null
          proficiencies_languages?: string | null
          race?: string | null
          role_occupation?: string | null
          saving_throw_proficiencies?: string[] | null
          skill_half_proficiencies?: string[] | null
          skill_proficiencies?: string[] | null
          speed?: number | null
          spell_slots?: Json | null
          spellcasting_ability?: string | null
          spells?: Json | null
          story_role?: string | null
          str_score?: number | null
          subclass?: string | null
          temp_hp?: number | null
          type?: string | null
          updated_at?: string | null
          voice_mannerisms?: string | null
          wis_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "characters_adventure_id_fkey"
            columns: ["adventure_id"]
            isOneToOne: false
            referencedRelation: "adventures"
            referencedColumns: ["id"]
          },
        ]
      }
      locations_safe: {
        Row: {
          adventure_id: string | null
          created_at: string | null
          description: string | null
          dm_notes: string | null
          dm_notes_visible: boolean | null
          id: string | null
          image_url: string | null
          name: string | null
          notes: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          adventure_id?: string | null
          created_at?: string | null
          description?: string | null
          dm_notes?: never
          dm_notes_visible?: boolean | null
          id?: string | null
          image_url?: string | null
          name?: string | null
          notes?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          adventure_id?: string | null
          created_at?: string | null
          description?: string | null
          dm_notes?: never
          dm_notes_visible?: boolean | null
          id?: string | null
          image_url?: string | null
          name?: string | null
          notes?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "locations_adventure_id_fkey"
            columns: ["adventure_id"]
            isOneToOne: false
            referencedRelation: "adventures"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_adventure_role: {
        Args: { _adventure_id: string; _user_id: string }
        Returns: string
      }
      has_adventure_access: {
        Args: { _adventure_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      user_has_pc_in_adventure: {
        Args: { _adventure_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      adventure_role: "dm" | "scribe" | "player"
      app_role: "admin" | "user"
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
      adventure_role: ["dm", "scribe", "player"],
      app_role: ["admin", "user"],
    },
  },
} as const
