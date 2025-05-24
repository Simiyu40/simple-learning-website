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
          created_at: string
          file_type: string
          file_size?: number
          status?: string
          paper_type?: string
        }
        Insert: {
          id?: string
          title: string
          file_path: string
          created_at?: string
          file_type: string
          file_size?: number
          status?: string
          paper_type?: string
        }
        Update: {
          id?: string
          title?: string
          file_path?: string
          created_at?: string
          file_type?: string
          file_size?: number
          status?: string
          paper_type?: string
        }
      }
      solutions: {
        Row: {
          id: string
          paper_id: string
          question_id: string
          file_path: string
          created_at: string
          file_type: string
        }
        Insert: {
          id?: string
          paper_id: string
          question_id: string
          file_path: string
          created_at?: string
          file_type: string
        }
        Update: {
          id?: string
          paper_id?: string
          question_id?: string
          file_path?: string
          created_at?: string
          file_type?: string
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