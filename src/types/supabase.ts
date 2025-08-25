export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)";
  };
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      caches: {
        Row: {
          cache_key: string;
          cache_value: string | null;
          created_at: string;
          id: number;
        };
        Insert: {
          cache_key: string;
          cache_value?: string | null;
          created_at?: string;
          id?: number;
        };
        Update: {
          cache_key?: string;
          cache_value?: string | null;
          created_at?: string;
          id?: number;
        };
        Relationships: [];
      };
      fish_catches: {
        Row: {
          confidence: number | null;
          created_at: string | null;
          id: string;
          image_url: string | null;
          length_cm: number | null;
          scientific_name: string | null;
          species: string | null;
          user_id: string | null;
        };
        Insert: {
          confidence?: number | null;
          created_at?: string | null;
          id?: string;
          image_url?: string | null;
          length_cm?: number | null;
          scientific_name?: string | null;
          species?: string | null;
          user_id?: string | null;
        };
        Update: {
          confidence?: number | null;
          created_at?: string | null;
          id?: string;
          image_url?: string | null;
          length_cm?: number | null;
          scientific_name?: string | null;
          species?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "fish_catches_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      fishes: {
        Row: {
          added_by: string | null;
          all_round_gear: Json | null;
          created_at: string;
          current_season_status: string | null;
          danger_type: string | null;
          description: string | null;
          difficulty: string | null;
          fishing_location: string | null;
          fishing_methods: Json | null;
          fishing_regulations: Json | null;
          fishing_seasons: Json | null;
          habitat: string | null;
          id: string;
          image: string | null;
          is_detailed: boolean | null;
          is_toxic: boolean | null;
          local_name: string | null;
          metadata: Json | null;
          name: string;
          official_season_dates: string | null;
          probability_score: number | null;
          scientific_name: string;
          season: string | null;
          slug: string;
          updated_at: string | null;
        };
        Insert: {
          added_by?: string | null;
          all_round_gear?: Json | null;
          created_at?: string;
          current_season_status?: string | null;
          danger_type?: string | null;
          description?: string | null;
          difficulty?: string | null;
          fishing_location?: string | null;
          fishing_methods?: Json | null;
          fishing_regulations?: Json | null;
          fishing_seasons?: Json | null;
          habitat?: string | null;
          id?: string;
          image?: string | null;
          is_detailed?: boolean | null;
          is_toxic?: boolean | null;
          local_name?: string | null;
          metadata?: Json | null;
          name: string;
          official_season_dates?: string | null;
          probability_score?: number | null;
          scientific_name: string;
          season?: string | null;
          slug: string;
          updated_at?: string | null;
        };
        Update: {
          added_by?: string | null;
          all_round_gear?: Json | null;
          created_at?: string;
          current_season_status?: string | null;
          danger_type?: string | null;
          description?: string | null;
          difficulty?: string | null;
          fishing_location?: string | null;
          fishing_methods?: Json | null;
          fishing_regulations?: Json | null;
          fishing_seasons?: Json | null;
          habitat?: string | null;
          id?: string;
          image?: string | null;
          is_detailed?: boolean | null;
          is_toxic?: boolean | null;
          local_name?: string | null;
          metadata?: Json | null;
          name?: string;
          official_season_dates?: string | null;
          probability_score?: number | null;
          scientific_name?: string;
          season?: string | null;
          slug?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "fishes_added_by_fkey";
            columns: ["added_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          bio: string | null;
          created_at: string | null;
          favorite_fish_species: string[] | null;
          fishing_experience: string | null;
          full_name: string | null;
          gallery_photos: Json[] | null;
          gear_items: Json | null;
          has_seen_onboarding_flow: boolean | null;
          id: string;
          location: string | null;
          location_coordinates: Json | null;
          preferred_language: string | null;
          preferred_units: string | null;
          updated_at: string | null;
          username: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string | null;
          favorite_fish_species?: string[] | null;
          fishing_experience?: string | null;
          full_name?: string | null;
          gallery_photos?: Json[] | null;
          gear_items?: Json | null;
          has_seen_onboarding_flow?: boolean | null;
          id: string;
          location?: string | null;
          location_coordinates?: Json | null;
          preferred_language?: string | null;
          preferred_units?: string | null;
          updated_at?: string | null;
          username?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string | null;
          favorite_fish_species?: string[] | null;
          fishing_experience?: string | null;
          full_name?: string | null;
          gallery_photos?: Json[] | null;
          gear_items?: Json | null;
          has_seen_onboarding_flow?: boolean | null;
          id?: string;
          location?: string | null;
          location_coordinates?: Json | null;
          preferred_language?: string | null;
          preferred_units?: string | null;
          updated_at?: string | null;
          username?: string | null;
        };
        Relationships: [];
      };
      search_agent_messages: {
        Row: {
          content: string | null;
          created_at: string;
          id: string;
          image: string | null;
          metadata: Json | null;
          session_id: string;
          updated_at: string | null;
          user_role: Database["public"]["Enums"]["seach_agent_role"] | null;
        };
        Insert: {
          content?: string | null;
          created_at?: string;
          id?: string;
          image?: string | null;
          metadata?: Json | null;
          session_id?: string;
          updated_at?: string | null;
          user_role?: Database["public"]["Enums"]["seach_agent_role"] | null;
        };
        Update: {
          content?: string | null;
          created_at?: string;
          id?: string;
          image?: string | null;
          metadata?: Json | null;
          session_id?: string;
          updated_at?: string | null;
          user_role?: Database["public"]["Enums"]["seach_agent_role"] | null;
        };
        Relationships: [
          {
            foreignKeyName: "search_agent_messages_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "search_agent_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      search_agent_sessions: {
        Row: {
          created_at: string;
          id: string;
          title: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          title: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          title?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "search_agent_sessions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      seach_agent_role: "user" | "assistant";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      seach_agent_role: ["user", "assistant"],
    },
  },
} as const;
