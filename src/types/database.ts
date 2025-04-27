export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          company_name: string
          contact_person: string | null
          phone_number: string | null
          address: string | null
          role: 'admin' | 'subcontractor'
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id: string
          company_name: string
          contact_person?: string | null
          phone_number?: string | null
          address?: string | null
          role?: 'admin' | 'subcontractor'
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          company_name?: string
          contact_person?: string | null
          phone_number?: string | null
          address?: string | null
          role?: 'admin' | 'subcontractor'
          created_at?: string
          updated_at?: string | null
        }
      }
      jobs: {
        Row: {
          id: string
          subcontractor_id: string
          job_type: string
          location: string
          start_date: string
          end_date: string
          status: 'pending' | 'in-progress' | 'completed'
          unit: number
          unit_price: number
          total: number
          notes: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          subcontractor_id: string
          job_type: string
          location: string
          start_date: string
          end_date: string
          status?: 'pending' | 'in-progress' | 'completed'
          unit: number
          unit_price: number
          total?: number
          notes?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          subcontractor_id?: string
          job_type?: string
          location?: string
          start_date?: string
          end_date?: string
          status?: 'pending' | 'in-progress' | 'completed'
          unit?: number
          unit_price?: number
          total?: number
          notes?: string | null
          created_at?: string
          updated_at?: string | null
        }
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
  }
}