import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export type Db = SupabaseClient<Database>;

export type {
  Json,
  Tables,
  TablesInsert,
  TablesUpdate,
  TaskPriority,
  TaskStatus,
  GoalType,
  GoalStatus,
  MilestoneStatus,
  GoalCheckFrequency,
  ActivityType,
  WorkoutStatus,
  WorkoutIntensity,
  WeeklyPriorityStatus,
  AiActionStatus,
  MealStatus,
} from "@/lib/supabase/database.types";
