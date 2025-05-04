export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      files: {
        Row: {
          content_type: string
          file_name: string
          id: string
          job_id: string
          storage_path: string
          uploaded_at: string
        }
        Insert: {
          content_type: string
          file_name: string
          id?: string
          job_id: string
          storage_path: string
          uploaded_at?: string
        }
        Update: {
          content_type?: string
          file_name?: string
          id?: string
          job_id?: string
          storage_path?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "files_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_settings: {
        Row: {
          created_at: string | null
          id: number
          setting_key: string
          setting_value: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          setting_key: string
          setting_value: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          setting_key?: string
          setting_value?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      invoices: {
        Row: {
          created_at: string | null // Corrected based on schema
          id: string
          invoice_date: string // Corrected based on schema
          job_id: string
          status: string // Corrected based on schema
          subcontractor_id: string // Corrected based on schema
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          invoice_date?: string // Corrected based on schema
          job_id: string
          status?: string // Corrected based on schema
          subcontractor_id: string // Corrected based on schema
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          invoice_date?: string // Corrected based on schema
          job_id?: string
          status?: string // Corrected based on schema
          subcontractor_id?: string // Corrected based on schema
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          { // Added relationship to profiles based on migration
            foreignKeyName: "invoices_subcontractor_id_fkey"
            columns: ["subcontractor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          created_at: string
          end_date: string | null // Corrected based on schema
          id: string
          job_type: string
          line_items: Json | null
          location: string
          notes: string | null
          start_date: string | null // Corrected based on schema
          status: Database["public"]["Enums"]["job_status"] | null // Corrected based on schema
          subcontractor_id: string
          total: number | null
          unit: number | null // Corrected based on schema
          unit_price: number | null // Corrected based on schema
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          end_date?: string | null // Corrected based on schema
          id?: string
          job_type: string
          line_items?: Json | null
          location: string
          notes?: string | null
          start_date?: string | null // Corrected based on schema
          status?: Database["public"]["Enums"]["job_status"] | null // Corrected based on schema
          subcontractor_id: string
          total?: number | null
          unit?: number | null // Corrected based on schema
          unit_price?: number | null // Corrected based on schema
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          end_date?: string | null // Corrected based on schema
          id?: string
          job_type?: string
          line_items?: Json | null
          location?: string
          notes?: string | null
          start_date?: string | null // Corrected based on schema
          status?: Database["public"]["Enums"]["job_status"] | null // Corrected based on schema
          subcontractor_id?: string
          total?: number | null
          unit?: number | null // Corrected based on schema
          unit_price?: number | null // Corrected based on schema
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_subcontractor_id_fkey"
            columns: ["subcontractor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          recipient_id: string
          related_entity_id: string | null
          related_entity_type:
            | Database["public"]["Enums"]["notification_entity_type"]
            | null
          sender_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          recipient_id: string
          related_entity_id?: string | null
          related_entity_type?:
            | Database["public"]["Enums"]["notification_entity_type"]
            | null
          sender_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          recipient_id?: string
          related_entity_id?: string | null
          related_entity_type?:
            | Database["public"]["Enums"]["notification_entity_type"]
            | null
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          company_name: string | null // Corrected based on schema
          contact_person: string | null
          created_at: string
          full_name: string | null // Added based on usage
          id: string
          phone_number: string | null
          role: string
          updated_at: string | null // Corrected based on schema
        }
        Insert: {
          address?: string | null
          company_name?: string | null // Corrected based on schema
          contact_person?: string | null
          created_at?: string
          full_name?: string | null // Added based on usage
          id: string
          phone_number?: string | null
          role?: string
          updated_at?: string | null // Corrected based on schema
        }
        Update: {
          address?: string | null
          company_name?: string | null // Corrected based on schema
          contact_person?: string | null
          created_at?: string
          full_name?: string | null // Added based on usage
          id?: string
          phone_number?: string | null
          role?: string
          updated_at?: string | null // Corrected based on schema
        }
        Relationships: [
           { // Added relationship for user ID
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: {
          user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      invoice_status: "generated" | "sent" | "paid" // Corrected based on schema
      job_status: "pending" | "in-progress" | "completed"
      notification_entity_type: "job" | "invoice" | "system"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

// Removed Constants export as it's not standard in generated types and might cause issues
// export const Constants = { ... } as const