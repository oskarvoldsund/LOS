// Hand-authored to match supabase/migrations/*.sql. Regenerate with
// `supabase gen types typescript --linked > src/lib/supabase/database.types.ts`
// once the project is linked to a real Supabase project — until then this
// file is the source of truth and must be kept in sync with the migrations.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type TaskStatus = "inbox" | "todo" | "in_progress" | "completed" | "cancelled";
export type GoalType = "life" | "annual" | "quarterly" | "monthly";
export type GoalStatus = "active" | "achieved" | "abandoned" | "paused";
export type MilestoneStatus = "pending" | "in_progress" | "done";
export type GoalCheckFrequency = "none" | "daily" | "weekly" | "monthly";
export type MealStatus = "planned" | "completed";
export type CalendarProviderType = "mock" | "google" | "outlook" | "apple";
export type CalendarEventSource = "external" | "task_block" | "workout_block" | "manual";
export type CalendarEventStatus = "confirmed" | "tentative" | "cancelled";
export type ActivityType =
  | "strength"
  | "running"
  | "cycling"
  | "walking"
  | "football"
  | "mobility"
  | "skierg"
  | "other";
export type WorkoutStatus = "planned" | "completed" | "skipped";
export type WorkoutIntensity = "low" | "medium" | "high";
export type WorkoutSource = "manual" | "strava" | "garmin" | "apple_health";
export type WeeklyPriorityStatus = "pending" | "done";
export type PreferenceSource = "user_stated" | "user_confirmed_inference";
export type AiMessageRole = "user" | "assistant" | "system";
export type AiActionStatus = "proposed" | "approved" | "rejected" | "executed" | "failed";

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          color: string;
          icon: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["categories"]["Row"]> & {
          user_id: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["categories"]["Row"]>;
        Relationships: [];
      };
      goals: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          why_it_matters: string | null;
          goal_type: GoalType;
          parent_goal_id: string | null;
          timeframe_start: string | null;
          timeframe_end: string | null;
          target_date: string | null;
          status: GoalStatus;
          progress_override: number | null;
          check_frequency: GoalCheckFrequency;
          category_id: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["goals"]["Row"]> & {
          user_id: string;
          title: string;
        };
        Update: Partial<Database["public"]["Tables"]["goals"]["Row"]>;
        Relationships: [];
      };
      goal_checkins: {
        Row: {
          id: string;
          user_id: string;
          goal_id: string;
          period_date: string;
          completed_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["goal_checkins"]["Row"]> & {
          user_id: string;
          goal_id: string;
          period_date: string;
        };
        Update: Partial<Database["public"]["Tables"]["goal_checkins"]["Row"]>;
        Relationships: [];
      };
      goal_milestones: {
        Row: {
          id: string;
          user_id: string;
          goal_id: string;
          title: string;
          target_date: string | null;
          status: MilestoneStatus;
          sort_order: number;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["goal_milestones"]["Row"]> & {
          user_id: string;
          goal_id: string;
          title: string;
        };
        Update: Partial<Database["public"]["Tables"]["goal_milestones"]["Row"]>;
        Relationships: [];
      };
      calendar_accounts: {
        Row: {
          id: string;
          user_id: string;
          provider: CalendarProviderType;
          display_name: string;
          external_account_id: string | null;
          access_token_ciphertext: string | null;
          refresh_token_ciphertext: string | null;
          sync_enabled: boolean;
          last_synced_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["calendar_accounts"]["Row"]> & {
          user_id: string;
          display_name: string;
        };
        Update: Partial<Database["public"]["Tables"]["calendar_accounts"]["Row"]>;
        Relationships: [];
      };
      calendar_events: {
        Row: {
          id: string;
          user_id: string;
          calendar_account_id: string | null;
          title: string;
          description: string | null;
          location: string | null;
          starts_at: string;
          ends_at: string;
          all_day: boolean;
          source_type: CalendarEventSource;
          external_event_id: string | null;
          status: CalendarEventStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["calendar_events"]["Row"]> & {
          user_id: string;
          title: string;
          starts_at: string;
          ends_at: string;
        };
        Update: Partial<Database["public"]["Tables"]["calendar_events"]["Row"]>;
        Relationships: [];
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          category_id: string | null;
          project: string | null;
          priority: TaskPriority;
          status: TaskStatus;
          due_date: string | null;
          due_time: string | null;
          estimated_minutes: number | null;
          recurrence: string | null;
          goal_id: string | null;
          milestone_id: string | null;
          calendar_event_id: string | null;
          tags: string[];
          notes: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["tasks"]["Row"]> & {
          user_id: string;
          title: string;
        };
        Update: Partial<Database["public"]["Tables"]["tasks"]["Row"]>;
        Relationships: [];
      };
      workouts: {
        Row: {
          id: string;
          user_id: string;
          activity_type: ActivityType;
          status: WorkoutStatus;
          scheduled_date: string | null;
          scheduled_time: string | null;
          completed_at: string | null;
          duration_minutes: number | null;
          distance_km: number | null;
          intensity: WorkoutIntensity | null;
          perceived_effort: number | null;
          notes: string | null;
          goal_id: string | null;
          milestone_id: string | null;
          calendar_event_id: string | null;
          source: WorkoutSource;
          external_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["workouts"]["Row"]> & {
          user_id: string;
          activity_type: ActivityType;
        };
        Update: Partial<Database["public"]["Tables"]["workouts"]["Row"]>;
        Relationships: [];
      };
      workout_exercises: {
        Row: {
          id: string;
          user_id: string;
          workout_id: string;
          name: string;
          sort_order: number;
          sets: number | null;
          reps: number | null;
          weight_kg: number | null;
          notes: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["workout_exercises"]["Row"]> & {
          user_id: string;
          workout_id: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["workout_exercises"]["Row"]>;
        Relationships: [];
      };
      meals: {
        Row: {
          id: string;
          user_id: string;
          meal_date: string;
          title: string;
          description: string | null;
          status: MealStatus;
          calories: number | null;
          protein_g: number | null;
          carbs_g: number | null;
          fat_g: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["meals"]["Row"]> & {
          user_id: string;
          meal_date: string;
          title: string;
        };
        Update: Partial<Database["public"]["Tables"]["meals"]["Row"]>;
        Relationships: [];
      };
      routines: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          recurrence_days: number[] | null;
          interval_days: number | null;
          reminder_time: string | null;
          goal_id: string | null;
          active: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["routines"]["Row"]> & {
          user_id: string;
          title: string;
        };
        Update: Partial<Database["public"]["Tables"]["routines"]["Row"]>;
        Relationships: [];
      };
      routine_completions: {
        Row: {
          id: string;
          user_id: string;
          routine_id: string;
          completed_date: string;
          completed_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["routine_completions"]["Row"]> & {
          user_id: string;
          routine_id: string;
          completed_date: string;
        };
        Update: Partial<Database["public"]["Tables"]["routine_completions"]["Row"]>;
        Relationships: [];
      };
      weekly_plans: {
        Row: {
          id: string;
          user_id: string;
          week_start_date: string;
          reviewed_at: string | null;
          review_summary: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["weekly_plans"]["Row"]> & {
          user_id: string;
          week_start_date: string;
        };
        Update: Partial<Database["public"]["Tables"]["weekly_plans"]["Row"]>;
        Relationships: [];
      };
      weekly_priorities: {
        Row: {
          id: string;
          user_id: string;
          weekly_plan_id: string;
          title: string;
          task_id: string | null;
          goal_id: string | null;
          sort_order: number;
          status: WeeklyPriorityStatus;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["weekly_priorities"]["Row"]> & {
          user_id: string;
          weekly_plan_id: string;
          title: string;
          sort_order: number;
        };
        Update: Partial<Database["public"]["Tables"]["weekly_priorities"]["Row"]>;
        Relationships: [];
      };
      notes: {
        Row: {
          id: string;
          user_id: string;
          body: string;
          task_id: string | null;
          goal_id: string | null;
          workout_id: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["notes"]["Row"]> & {
          user_id: string;
          body: string;
        };
        Update: Partial<Database["public"]["Tables"]["notes"]["Row"]>;
        Relationships: [];
      };
      diary_entries: {
        Row: {
          id: string;
          user_id: string;
          entry_date: string;
          body: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["diary_entries"]["Row"]> & {
          user_id: string;
          body: string;
        };
        Update: Partial<Database["public"]["Tables"]["diary_entries"]["Row"]>;
        Relationships: [];
      };
      preferences: {
        Row: {
          id: string;
          user_id: string;
          key: string;
          value: Json;
          source: PreferenceSource;
          confidence: number | null;
          derived_from_ai_message_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["preferences"]["Row"]> & {
          user_id: string;
          key: string;
          value: Json;
        };
        Update: Partial<Database["public"]["Tables"]["preferences"]["Row"]>;
        Relationships: [];
      };
      ai_conversations: {
        Row: {
          id: string;
          user_id: string;
          title: string | null;
          context_scope: string;
          created_at: string;
          last_message_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["ai_conversations"]["Row"]> & {
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["ai_conversations"]["Row"]>;
        Relationships: [];
      };
      ai_messages: {
        Row: {
          id: string;
          user_id: string;
          conversation_id: string;
          role: AiMessageRole;
          content: string;
          tool_calls: Json | null;
          model: string | null;
          input_tokens: number | null;
          output_tokens: number | null;
          latency_ms: number | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["ai_messages"]["Row"]> & {
          user_id: string;
          conversation_id: string;
          role: AiMessageRole;
        };
        Update: Partial<Database["public"]["Tables"]["ai_messages"]["Row"]>;
        Relationships: [];
      };
      ai_actions: {
        Row: {
          id: string;
          user_id: string;
          conversation_id: string | null;
          message_id: string | null;
          action_type: string;
          payload: Json;
          explanation: string;
          status: AiActionStatus;
          result: Json | null;
          error: string | null;
          created_at: string;
          approved_at: string | null;
          executed_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["ai_actions"]["Row"]> & {
          user_id: string;
          action_type: string;
          payload: Json;
          explanation: string;
        };
        Update: Partial<Database["public"]["Tables"]["ai_actions"]["Row"]>;
        Relationships: [];
      };
      automation_rules: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          trigger_type: string;
          trigger_config: Json;
          condition: Json | null;
          action_type: string;
          action_config: Json;
          enabled: boolean;
          last_run_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["automation_rules"]["Row"]> & {
          user_id: string;
          name: string;
          trigger_type: string;
          action_type: string;
        };
        Update: Partial<Database["public"]["Tables"]["automation_rules"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
