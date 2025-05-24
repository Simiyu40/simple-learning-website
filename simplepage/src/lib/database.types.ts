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
      papers: {
        Row: {
          id: string
          title: string
          file_path: string
          uploaded_at: string
          paper_type: string | null
          status: 'pending' | 'processing' | 'completed' | 'failed'
          file_size: number | null
          file_type: string | null
          public_url: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          title: string
          file_path: string
          uploaded_at?: string
          paper_type?: string | null
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          file_size?: number | null
          file_type?: string | null
          public_url?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          title?: string
          file_path?: string
          uploaded_at?: string
          paper_type?: string | null
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          file_size?: number | null
          file_type?: string | null
          public_url?: string | null
          user_id?: string | null
        }
      }
      solutions: {
        Row: {
          id: string
          paper_id: string
          question_id: string
          file_path: string
          uploaded_at: string
          status: 'pending' | 'processing' | 'completed' | 'failed'
          file_size: number | null
          file_type: string | null
          public_url: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          paper_id: string
          question_id: string
          file_path: string
          uploaded_at?: string
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          file_size?: number | null
          file_type?: string | null
          public_url?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          paper_id?: string
          question_id?: string
          file_path?: string
          uploaded_at?: string
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          file_size?: number | null
          file_type?: string | null
          public_url?: string | null
          user_id?: string | null
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