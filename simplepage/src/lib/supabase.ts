import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Paper {
  id: string;
  title: string;
  file_path: string;
  file_type: string;
  file_size: number;
  created_at: string;
  updated_at: string;
  user_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  paper_type?: 'exam' | 'assignment' | 'notes' | 'other';
}

export interface Solution {
  id: string;
  paper_id: string;
  question_id: string;
  file_path: string;
  file_type: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  content: string;
}