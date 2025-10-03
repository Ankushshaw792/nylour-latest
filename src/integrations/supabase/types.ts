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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          actual_end_time: string | null
          actual_start_time: string | null
          booking_date: string
          booking_time: string
          created_at: string
          customer_id: string
          customer_notes: string | null
          duration: number
          estimated_service_time: number | null
          id: string
          is_walk_in: boolean | null
          notes: string | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          queue_position: number | null
          salon_id: string
          salon_notes: string | null
          service_id: string
          status: Database["public"]["Enums"]["booking_status"]
          total_price: number
          updated_at: string
        }
        Insert: {
          actual_end_time?: string | null
          actual_start_time?: string | null
          booking_date: string
          booking_time: string
          created_at?: string
          customer_id: string
          customer_notes?: string | null
          duration?: number
          estimated_service_time?: number | null
          id?: string
          is_walk_in?: boolean | null
          notes?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          queue_position?: number | null
          salon_id: string
          salon_notes?: string | null
          service_id: string
          status?: Database["public"]["Enums"]["booking_status"]
          total_price: number
          updated_at?: string
        }
        Update: {
          actual_end_time?: string | null
          actual_start_time?: string | null
          booking_date?: string
          booking_time?: string
          created_at?: string
          customer_id?: string
          customer_notes?: string | null
          duration?: number
          estimated_service_time?: number | null
          id?: string
          is_walk_in?: boolean | null
          notes?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          queue_position?: number | null
          salon_id?: string
          salon_notes?: string | null
          service_id?: string
          status?: Database["public"]["Enums"]["booking_status"]
          total_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          avatar_url: string | null
          created_at: string | null
          favorite_services: Json | null
          first_name: string | null
          gender: string | null
          id: string
          last_name: string | null
          notification_preferences: Json | null
          phone: string | null
          preferred_time: string | null
          total_spent: number | null
          total_visits: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string | null
          favorite_services?: Json | null
          first_name?: string | null
          gender?: string | null
          id?: string
          last_name?: string | null
          notification_preferences?: Json | null
          phone?: string | null
          preferred_time?: string | null
          total_spent?: number | null
          total_visits?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string | null
          favorite_services?: Json | null
          first_name?: string | null
          gender?: string | null
          id?: string
          last_name?: string | null
          notification_preferences?: Json | null
          phone?: string | null
          preferred_time?: string | null
          total_spent?: number | null
          total_visits?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          salon_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          salon_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          salon_id?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          related_id: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          related_id?: string | null
          title: string
          type?: Database["public"]["Enums"]["notification_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          related_id?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      queue_entries: {
        Row: {
          actual_wait_time: number | null
          completed_at: string | null
          customer_id: string
          estimated_wait_time: number | null
          expires_at: string | null
          id: string
          joined_at: string
          notification_sent: Json | null
          queue_number: number
          salon_id: string
          service_id: string
          started_at: string | null
          status: Database["public"]["Enums"]["queue_status"]
        }
        Insert: {
          actual_wait_time?: number | null
          completed_at?: string | null
          customer_id: string
          estimated_wait_time?: number | null
          expires_at?: string | null
          id?: string
          joined_at?: string
          notification_sent?: Json | null
          queue_number: number
          salon_id: string
          service_id: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["queue_status"]
        }
        Update: {
          actual_wait_time?: number | null
          completed_at?: string | null
          customer_id?: string
          estimated_wait_time?: number | null
          expires_at?: string | null
          id?: string
          joined_at?: string
          notification_sent?: Json | null
          queue_number?: number
          salon_id?: string
          service_id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["queue_status"]
        }
        Relationships: [
          {
            foreignKeyName: "queue_entries_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_entries_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      salon_hours: {
        Row: {
          close_time: string
          created_at: string
          day_of_week: number
          id: string
          is_closed: boolean
          open_time: string
          salon_id: string
        }
        Insert: {
          close_time: string
          created_at?: string
          day_of_week: number
          id?: string
          is_closed?: boolean
          open_time: string
          salon_id: string
        }
        Update: {
          close_time?: string
          created_at?: string
          day_of_week?: number
          id?: string
          is_closed?: boolean
          open_time?: string
          salon_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "salon_hours_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      salon_owners: {
        Row: {
          created_at: string | null
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      salon_services: {
        Row: {
          created_at: string
          duration: number
          id: string
          image_url: string | null
          is_active: boolean
          price: number
          salon_id: string
          service_id: string
        }
        Insert: {
          created_at?: string
          duration?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          price: number
          salon_id: string
          service_id: string
        }
        Update: {
          created_at?: string
          duration?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          price?: number
          salon_id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "salon_services_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salon_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      salons: {
        Row: {
          accepts_bookings: boolean | null
          address: string
          admin_approved: boolean | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          current_wait_time: number | null
          description: string | null
          email: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_online: boolean | null
          last_activity: string | null
          max_queue_size: number | null
          name: string
          owner_id: string
          phone: string
          status: Database["public"]["Enums"]["salon_status"]
          updated_at: string
        }
        Insert: {
          accepts_bookings?: boolean | null
          address: string
          admin_approved?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          current_wait_time?: number | null
          description?: string | null
          email?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_online?: boolean | null
          last_activity?: string | null
          max_queue_size?: number | null
          name: string
          owner_id: string
          phone: string
          status?: Database["public"]["Enums"]["salon_status"]
          updated_at?: string
        }
        Update: {
          accepts_bookings?: boolean | null
          address?: string
          admin_approved?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          current_wait_time?: number | null
          description?: string | null
          email?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_online?: boolean | null
          last_activity?: string | null
          max_queue_size?: number | null
          name?: string
          owner_id?: string
          phone?: string
          status?: Database["public"]["Enums"]["salon_status"]
          updated_at?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          created_at: string
          default_duration: number
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          default_duration?: number
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          default_duration?: number
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
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
          role?: Database["public"]["Enums"]["user_role"]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_dynamic_wait_time: {
        Args: { p_customer_id: string; p_salon_id: string }
        Returns: number
      }
      calculate_queue_position: {
        Args: { p_customer_id: string; p_salon_id: string }
        Returns: number
      }
      expire_old_queue_entries: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["user_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_salon_owner_of: {
        Args: { p_salon_id: string }
        Returns: boolean
      }
      notify_next_customer: {
        Args: { p_message?: string; p_salon_id: string }
        Returns: undefined
      }
      send_custom_notification: {
        Args: { p_message: string; p_salon_id: string; p_title?: string }
        Returns: undefined
      }
      send_proximity_notifications: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_queue_estimated_times: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_user_stats: {
        Args: { p_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      booking_status:
        | "pending"
        | "confirmed"
        | "completed"
        | "cancelled"
        | "rejected"
        | "in_progress"
      notification_type:
        | "booking_confirmation"
        | "booking_reminder"
        | "queue_update"
        | "payment_receipt"
        | "queue_ready"
        | "booking_cancelled"
        | "general"
      payment_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | "refunded"
        | "cancelled"
      queue_status: "waiting" | "in_progress" | "completed"
      salon_status: "pending" | "approved" | "suspended"
      user_role: "admin" | "salon_owner" | "customer"
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
      booking_status: [
        "pending",
        "confirmed",
        "completed",
        "cancelled",
        "rejected",
        "in_progress",
      ],
      notification_type: [
        "booking_confirmation",
        "booking_reminder",
        "queue_update",
        "payment_receipt",
        "queue_ready",
        "booking_cancelled",
        "general",
      ],
      payment_status: [
        "pending",
        "processing",
        "completed",
        "failed",
        "refunded",
        "cancelled",
      ],
      queue_status: ["waiting", "in_progress", "completed"],
      salon_status: ["pending", "approved", "suspended"],
      user_role: ["admin", "salon_owner", "customer"],
    },
  },
} as const
