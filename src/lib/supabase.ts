import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if environment variables are properly configured
const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const hasValidSupabaseConfig = supabaseUrl && 
  supabaseAnonKey && 
  isValidUrl(supabaseUrl) && 
  !supabaseUrl.includes('your_supabase_project_url') &&
  !supabaseAnonKey.includes('your_supabase_anon_key');

let supabase;

if (!hasValidSupabaseConfig) {
  console.warn('Supabase not configured properly. Running in demo mode.');
  // Create a dummy client that won't be used
  const dummyUrl = 'https://dummy.supabase.co';
  const dummyKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1bW15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTI4MDAsImV4cCI6MTk2MDc2ODgwMH0.dummy';
  
  supabase = createClient(dummyUrl, dummyKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  });
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  });
}

export { supabase };
// Database types
export interface Database {
  public: {
    Tables: {
      roles: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          level: number;
          is_active: boolean;
          menu_access: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          level?: number;
          is_active?: boolean;
          menu_access?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          level?: number;
          is_active?: boolean;
          menu_access?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          email: string;
          password_hash: string;
          name: string;
          role_id: string;
          is_active: boolean;
          jurisdiction: string | null;
          zone: string | null;
          region: string | null;
          district: string | null;
          employee_id: string | null;
          phone_number: string | null;
          profile_image: string | null;
          parent_id: string | null;
          last_login: string | null;
          password_changed_at: string;
          failed_login_attempts: number;
          locked_until: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          password_hash: string;
          name: string;
          role_id: string;
          is_active?: boolean;
          jurisdiction?: string | null;
          zone?: string | null;
          region?: string | null;
          district?: string | null;
          employee_id?: string | null;
          phone_number?: string | null;
          profile_image?: string | null;
          parent_id?: string | null;
          last_login?: string | null;
          password_changed_at?: string;
          failed_login_attempts?: number;
          locked_until?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          password_hash?: string;
          name?: string;
          role_id?: string;
          is_active?: boolean;
          jurisdiction?: string | null;
          zone?: string | null;
          region?: string | null;
          district?: string | null;
          employee_id?: string | null;
          phone_number?: string | null;
          profile_image?: string | null;
          parent_id?: string | null;
          last_login?: string | null;
          password_changed_at?: string;
          failed_login_attempts?: number;
          locked_until?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      surveys: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          target_date: string;
          duration: number;
          total_questions: number;
          passing_score: number;
          max_attempts: number;
          is_active: boolean;
          assigned_zones: string[] | null;
          assigned_regions: string[] | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          target_date: string;
          duration?: number;
          total_questions?: number;
          passing_score?: number;
          max_attempts?: number;
          is_active?: boolean;
          assigned_zones?: string[] | null;
          assigned_regions?: string[] | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          target_date?: string;
          duration?: number;
          total_questions?: number;
          passing_score?: number;
          max_attempts?: number;
          is_active?: boolean;
          assigned_zones?: string[] | null;
          assigned_regions?: string[] | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      test_sessions: {
        Row: {
          id: string;
          user_id: string;
          survey_id: string;
          start_time: string;
          end_time: string | null;
          time_remaining: number;
          current_question_index: number;
          session_status: string;
          attempt_number: number;
          score: number | null;
          is_passed: boolean | null;
          completed_at: string | null;
          pause_time: string | null;
          resume_time: string | null;
          total_pause_duration: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          survey_id: string;
          start_time?: string;
          end_time?: string | null;
          time_remaining: number;
          current_question_index?: number;
          session_status?: string;
          attempt_number?: number;
          score?: number | null;
          is_passed?: boolean | null;
          completed_at?: string | null;
          pause_time?: string | null;
          resume_time?: string | null;
          total_pause_duration?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          survey_id?: string;
          start_time?: string;
          end_time?: string | null;
          time_remaining?: number;
          current_question_index?: number;
          session_status?: string;
          attempt_number?: number;
          score?: number | null;
          is_passed?: boolean | null;
          completed_at?: string | null;
          pause_time?: string | null;
          resume_time?: string | null;
          total_pause_duration?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      test_results: {
        Row: {
          id: string;
          user_id: string;
          survey_id: string;
          session_id: string;
          score: number;
          total_questions: number;
          correct_answers: number;
          is_passed: boolean;
          time_spent: number;
          attempt_number: number;
          grade: string | null;
          completed_at: string;
          certificate_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          survey_id: string;
          session_id: string;
          score: number;
          total_questions: number;
          correct_answers: number;
          is_passed: boolean;
          time_spent: number;
          attempt_number: number;
          grade?: string | null;
          completed_at?: string;
          certificate_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          survey_id?: string;
          session_id?: string;
          score?: number;
          total_questions?: number;
          correct_answers?: number;
          is_passed?: boolean;
          time_spent?: number;
          attempt_number?: number;
          grade?: string | null;
          completed_at?: string;
          certificate_id?: string | null;
          created_at?: string;
        };
      };
      certificates: {
        Row: {
          id: string;
          user_id: string;
          survey_id: string;
          result_id: string;
          certificate_number: string;
          issued_at: string;
          valid_until: string | null;
          download_count: number;
          certificate_status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          survey_id: string;
          result_id: string;
          certificate_number: string;
          issued_at?: string;
          valid_until?: string | null;
          download_count?: number;
          certificate_status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          survey_id?: string;
          result_id?: string;
          certificate_number?: string;
          issued_at?: string;
          valid_until?: string | null;
          download_count?: number;
          certificate_status?: string;
          created_at?: string;
        };
      };
      system_settings: {
        Row: {
          id: string;
          category: string;
          setting_key: string;
          setting_value: string;
          description: string | null;
          setting_type: string;
          is_editable: boolean;
          options: string[] | null;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          id?: string;
          category: string;
          setting_key: string;
          setting_value: string;
          description?: string | null;
          setting_type?: string;
          is_editable?: boolean;
          options?: string[] | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          id?: string;
          category?: string;
          setting_key?: string;
          setting_value?: string;
          description?: string | null;
          setting_type?: string;
          is_editable?: boolean;
          options?: string[] | null;
          updated_at?: string;
          updated_by?: string | null;
        };
      };
    };
  };
}