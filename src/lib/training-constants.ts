import type { ActivityType, WorkoutIntensity } from "@/lib/types";

export const ACTIVITY_TYPES: ActivityType[] = [
  "strength",
  "running",
  "cycling",
  "walking",
  "football",
  "mobility",
  "skierg",
  "other",
];

export const INTENSITY_LEVELS: WorkoutIntensity[] = ["low", "medium", "high"];

/** Activity types where distance is a meaningful field. */
export const DISTANCE_ACTIVITIES: ActivityType[] = ["running", "cycling", "walking"];
