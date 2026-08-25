import type { ActivityType } from "@/lib/types";

const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

const ACTIVITY_KEYWORDS: Record<string, ActivityType> = {
  run: "running",
  running: "running",
  jog: "running",
  walk: "running",
  walking: "walking",
  cycle: "cycling",
  cycling: "cycling",
  bike: "cycling",
  ride: "cycling",
  lift: "strength",
  gym: "strength",
  strength: "strength",
  football: "football",
  soccer: "football",
  stretch: "mobility",
  mobility: "mobility",
};

export interface ParsedQuickAdd {
  kind: "task" | "workout";
  title: string;
  dueDate?: string; // ISO date, tasks
  scheduledDate?: string; // ISO date, workouts
  activityType?: ActivityType;
  distanceKm?: number;
}

/**
 * Deterministic, no-model parsing for the global Quick Add (Cmd+K).
 * Handles the brief's own examples verbatim: "Pay electricity bill Friday",
 * "Run 8 km Sunday", "Call Peter tomorrow". See docs/product-architecture.md
 * §6 and docs/claude-integration.md §8 (don't call Claude for deterministic
 * work).
 */
export function parseQuickAdd(raw: string, now = new Date()): ParsedQuickAdd {
  let text = raw.trim();

  const { date, remaining: afterDate } = extractDate(text, now);
  text = afterDate;

  const { distanceKm, remaining: afterDistance } = extractDistanceKm(text);
  text = afterDistance;

  const firstWord = text.split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, "") ?? "";
  const activityType = ACTIVITY_KEYWORDS[firstWord];

  const title = text.trim().replace(/\s+/g, " ") || raw.trim();

  if (activityType) {
    return {
      kind: "workout",
      title: capitalize(title),
      scheduledDate: date,
      activityType,
      distanceKm,
    };
  }

  return { kind: "task", title: capitalize(title), dueDate: date };
}

function extractDate(text: string, now: Date): { date?: string; remaining: string } {
  const lower = text.toLowerCase();

  if (/\btoday\b/.test(lower)) {
    return { date: toIsoDate(now), remaining: stripWord(text, "today") };
  }
  if (/\btomorrow\b/.test(lower)) {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    return { date: toIsoDate(d), remaining: stripWord(text, "tomorrow") };
  }

  for (const weekday of WEEKDAYS) {
    const pattern = new RegExp(`\\b(next\\s+)?${weekday}\\b`, "i");
    const match = lower.match(pattern);
    if (match) {
      const targetDay = WEEKDAYS.indexOf(weekday);
      const isNext = Boolean(match[1]);
      const d = nextWeekday(now, targetDay, isNext);
      return { date: toIsoDate(d), remaining: stripPattern(text, pattern) };
    }
  }

  return { remaining: text };
}

function extractDistanceKm(text: string): { distanceKm?: number; remaining: string } {
  const match = text.match(/(\d+(?:\.\d+)?)\s*km\b/i);
  if (!match) return { remaining: text };
  return {
    distanceKm: Number(match[1]),
    remaining: text.replace(match[0], "").replace(/\s+/g, " "),
  };
}

function nextWeekday(now: Date, targetDay: number, forceNextWeek: boolean): Date {
  const d = new Date(now);
  const currentDay = d.getDay();
  let delta = (targetDay - currentDay + 7) % 7;
  if (delta === 0 && !forceNextWeek) delta = 0; // "friday" said on Friday means today
  if (delta === 0 && forceNextWeek) delta = 7;
  if (forceNextWeek && delta > 0 && delta < 7) delta += 7 === delta ? 0 : 0;
  d.setDate(d.getDate() + delta);
  return d;
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function stripWord(text: string, word: string): string {
  return text.replace(new RegExp(`\\b${word}\\b`, "i"), "").replace(/\s+/g, " ").trim();
}

function stripPattern(text: string, pattern: RegExp): string {
  return text.replace(pattern, "").replace(/\s+/g, " ").trim();
}

function capitalize(s: string): string {
  return s.length ? s[0].toUpperCase() + s.slice(1) : s;
}
