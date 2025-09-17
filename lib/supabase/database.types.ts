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
          email: string | null
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      subjects: {
        Row: {
          id: string
          user_id: string
          name: string
          display_name: string
          professor: string
          color: string
          current_topic: string
          last_studied: string | null
          total_hours: number
          average_grade: number
          exam_grades: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          display_name: string
          professor?: string
          color: string
          current_topic?: string
          last_studied?: string | null
          total_hours?: number
          average_grade?: number
          exam_grades?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          display_name?: string
          professor?: string
          color?: string
          current_topic?: string
          last_studied?: string | null
          total_hours?: number
          average_grade?: number
          exam_grades?: Json
          created_at?: string
          updated_at?: string
        }
      }
      topics: {
        Row: {
          id: string
          user_id: string
          subject_id: string
          subject_name: string
          name: string
          description: string | null
          status: 'not_started' | 'in_progress' | 'completed'
          priority: 'low' | 'medium' | 'high'
          difficulty: number
          estimated_hours: number
          actual_hours: number
          marked_for_exam: boolean
          exam_ids: string[]
          notes: string | null
          resources: string[]
          completed_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          subject_id: string
          subject_name: string
          name: string
          description?: string | null
          status?: 'not_started' | 'in_progress' | 'completed'
          priority?: 'low' | 'medium' | 'high'
          difficulty?: number
          estimated_hours?: number
          actual_hours?: number
          marked_for_exam?: boolean
          exam_ids?: string[]
          notes?: string | null
          resources?: string[]
          completed_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          subject_id?: string
          subject_name?: string
          name?: string
          description?: string | null
          status?: 'not_started' | 'in_progress' | 'completed'
          priority?: 'low' | 'medium' | 'high'
          difficulty?: number
          estimated_hours?: number
          actual_hours?: number
          marked_for_exam?: boolean
          exam_ids?: string[]
          notes?: string | null
          resources?: string[]
          completed_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      exams: {
        Row: {
          id: string
          user_id: string
          subject_id: string | null
          subject: string
          date: string
          type: string
          difficulty: number | null
          topics: string[]
          notes: string | null
          grade: number | null
          status: 'scheduled' | 'completed' | 'cancelled'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          subject_id?: string | null
          subject: string
          date: string
          type: string
          difficulty?: number | null
          topics?: string[]
          notes?: string | null
          grade?: number | null
          status?: 'scheduled' | 'completed' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          subject_id?: string | null
          subject?: string
          date?: string
          type?: string
          difficulty?: number | null
          topics?: string[]
          notes?: string | null
          grade?: number | null
          status?: 'scheduled' | 'completed' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
      }
      homework: {
        Row: {
          id: string
          user_id: string
          subject_id: string | null
          subject: string
          title: string
          description: string | null
          due_date: string
          priority: 'low' | 'medium' | 'high'
          status: 'pending' | 'in_progress' | 'completed'
          estimated_hours: number
          actual_hours: number
          attachments: string[]
          notes: string | null
          completed_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          subject_id?: string | null
          subject: string
          title: string
          description?: string | null
          due_date: string
          priority?: 'low' | 'medium' | 'high'
          status?: 'pending' | 'in_progress' | 'completed'
          estimated_hours?: number
          actual_hours?: number
          attachments?: string[]
          notes?: string | null
          completed_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          subject_id?: string | null
          subject?: string
          title?: string
          description?: string | null
          due_date?: string
          priority?: 'low' | 'medium' | 'high'
          status?: 'pending' | 'in_progress' | 'completed'
          estimated_hours?: number
          actual_hours?: number
          attachments?: string[]
          notes?: string | null
          completed_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      weekly_plans: {
        Row: {
          id: string
          user_id: string
          week_start_date: string
          goals: string[]
          priorities: Json
          schedule: Json
          notes: string | null
          review: string | null
          completion_rate: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          week_start_date: string
          goals?: string[]
          priorities?: Json
          schedule?: Json
          notes?: string | null
          review?: string | null
          completion_rate?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          week_start_date?: string
          goals?: string[]
          priorities?: Json
          schedule?: Json
          notes?: string | null
          review?: string | null
          completion_rate?: number
          created_at?: string
          updated_at?: string
        }
      }
      pomodoro_sessions: {
        Row: {
          id: string
          user_id: string
          subject_id: string | null
          topic_id: string | null
          subject: string
          topic: string | null
          date: string
          start_time: string
          end_time: string
          duration: number
          type: 'focus' | 'break'
          completed: boolean
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          subject_id?: string | null
          topic_id?: string | null
          subject: string
          topic?: string | null
          date: string
          start_time: string
          end_time: string
          duration: number
          type?: 'focus' | 'break'
          completed?: boolean
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          subject_id?: string | null
          topic_id?: string | null
          subject?: string
          topic?: string | null
          date?: string
          start_time?: string
          end_time?: string
          duration?: number
          type?: 'focus' | 'break'
          completed?: boolean
          notes?: string | null
          created_at?: string
        }
      }
      study_stats: {
        Row: {
          id: string
          user_id: string
          date: string
          subject_id: string | null
          subject: string | null
          hours_studied: number
          topics_completed: number
          pomodoros_completed: number
          efficiency_score: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          subject_id?: string | null
          subject?: string | null
          hours_studied?: number
          topics_completed?: number
          pomodoros_completed?: number
          efficiency_score?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          subject_id?: string | null
          subject?: string | null
          hours_studied?: number
          topics_completed?: number
          pomodoros_completed?: number
          efficiency_score?: number
          created_at?: string
          updated_at?: string
        }
      }
      preferences: {
        Row: {
          id: string
          user_id: string
          theme: string
          pomodoro_duration: number
          break_duration: number
          long_break_duration: number
          daily_study_goal: number
          notifications_enabled: boolean
          sound_enabled: boolean
          auto_start_breaks: boolean
          auto_start_pomodoros: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          theme?: string
          pomodoro_duration?: number
          break_duration?: number
          long_break_duration?: number
          daily_study_goal?: number
          notifications_enabled?: boolean
          sound_enabled?: boolean
          auto_start_breaks?: boolean
          auto_start_pomodoros?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          theme?: string
          pomodoro_duration?: number
          break_duration?: number
          long_break_duration?: number
          daily_study_goal?: number
          notifications_enabled?: boolean
          sound_enabled?: boolean
          auto_start_breaks?: boolean
          auto_start_pomodoros?: boolean
          created_at?: string
          updated_at?: string
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