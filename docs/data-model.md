# Data Model — Life OS

Postgres via Supabase. Every table (except lookup/system ones) has `id uuid
default gen_random_uuid()`, `user_id uuid references auth.users not null`,
`created_at timestamptz default now()`, `updated_at timestamptz default now()`
(kept current by a shared trigger), and a Row Level Security policy scoping
all operations to `user_id = auth.uid()`. Soft deletion is used only where it
adds real value (`tasks`, `goals` — so a Claude-proposed delete/complete is
reversible without a snapshot system); everything else hard-deletes.

## Entity overview

```
categories
tasks ───────────────┬──▶ categories
                      ├──▶ goals / goal_milestones
                      └──▶ calendar_events (time-blocked)

goals ──parent_goal_id──▶ goals (self-referential hierarchy)
goal_milestones ──▶ goals
goal_checkins ──▶ goals (habit-style cadence tracking — see below)

calendar_accounts
calendar_events ──▶ calendar_accounts (nullable — null = app-internal block)

workouts ──▶ goals / goal_milestones / calendar_events
workout_exercises ──▶ workouts

meals (weekly meal plan, dinner-focused MVP)

routines
routine_completions ──▶ routines

weekly_plans (one per user per ISO week) — schema kept, not surfaced in the UI (see §`weekly_plans`)
weekly_priorities ──▶ weekly_plans, optionally ──▶ tasks / goals

notes ──▶ (polymorphic: task_id / goal_id / workout_id, at most one set)

preferences

ai_conversations
ai_messages ──▶ ai_conversations
ai_actions ──▶ ai_conversations, ai_messages

automation_rules   (schema only — not executed in v1, see technical-architecture §8/product-architecture §8)
```

## Table-by-table

### `categories`
User-configurable task categories (seeded: Work, Personal, Finance, Training,
Family, Travel, Home, Learning).
`id, user_id, name, color, icon, sort_order, created_at`

### `tasks`
`id, user_id, title (not null), description, category_id → categories,
project (text, freeform "context"), priority (enum: low/medium/high/urgent),
status (enum: inbox/todo/in_progress/completed/cancelled), due_date (date),
due_time (time), estimated_minutes (int), recurrence (text, RFC-5545-ish
rule or null), goal_id → goals, milestone_id → goal_milestones,
calendar_event_id → calendar_events (nullable, set when time-blocked),
tags (text[]), notes (text), completed_at (timestamptz),
deleted_at (timestamptz, soft delete)`

Only `title` is required — everything else is nullable so Quick Add can
insert a single-field row. `status = 'inbox'` is the default; anything with
no explicit due date/category stays there until triaged.

### `goals`
`id, user_id, title, description, why_it_matters (text), goal_type (enum:
life/annual/quarterly/monthly), parent_goal_id → goals, timeframe_start,
timeframe_end, target_date, status (enum: active/achieved/abandoned/paused),
progress_override (numeric 0-100, nullable — manual override of the computed
value), check_frequency (enum: none/daily/weekly/monthly, default 'none'),
notes, deleted_at`

Progress shown in the UI is `progress_override` if set, else computed from
linked milestone/task/workout completion ratio — never stored redundantly.

`check_frequency` turns a goal into a "habit-style" goal: when it's not
`'none'`, the UI shows a checkbox for the current period (today / this week /
this month) instead of — or alongside — milestone-based progress. This is
independent of `goal_type` (a life goal can still be milestone-only; a
monthly goal can be milestone-only, cadence-only, or both).

### `goal_milestones`
`id, user_id, goal_id → goals (not null), title, target_date,
status (enum: pending/in_progress/done), sort_order, completed_at`

### `goal_checkins`
`id, user_id, goal_id → goals (not null), period_date (date — normalized
period key: the calendar date for 'daily', the ISO Monday of the week for
'weekly', the 1st of the month for 'monthly'), completed_at` — unique on
`(goal_id, period_date)`.

One row per completed period. Streaks, completion rate, and the "not done
yet" reminder on Today are all derived from this table plus
`goals.check_frequency` — see `lib/services/goal-checkins.ts`. Structurally
the same pattern as `routine_completions`, scoped to goals instead of
routines, because goals can carry a "why it matters" and link into the
milestone/progress model that routines deliberately don't.

### `calendar_accounts`
`id, user_id, provider (enum: mock/google/outlook/apple), display_name,
external_account_id (text, null for mock), access_token_ciphertext,
refresh_token_ciphertext, sync_enabled (bool), last_synced_at`

Token columns exist for future real-provider OAuth; unused and left null by
the mock provider. Never selected into any client-facing query — server-only.

### `calendar_events`
`id, user_id, calendar_account_id → calendar_accounts (nullable = internal),
title, description, location, starts_at (timestamptz, not null),
ends_at (timestamptz, not null), all_day (bool), source_type (enum:
external/task_block/workout_block/manual), external_event_id (text, null),
status (enum: confirmed/tentative/cancelled)`

Tasks and workouts don't duplicate their data into `calendar_events` — a
time-blocked task creates one row here and stores its id back on
`tasks.calendar_event_id` (and symmetrically for workouts), so the calendar
view is a single query over one table regardless of origin.

### `workouts`
`id, user_id, activity_type (enum: strength/running/cycling/walking/football/
mobility/other), status (enum: planned/completed/skipped),
scheduled_date (date), scheduled_time (time), completed_at (timestamptz),
duration_minutes (int), distance_km (numeric), intensity (enum: low/medium/
high), perceived_effort (int 1-10), notes, goal_id → goals,
milestone_id → goal_milestones, calendar_event_id → calendar_events,
source (enum: manual/strava/garmin/apple_health — only 'manual' used in v1),
external_id (text, null)`

### `workout_exercises`
`id, user_id, workout_id → workouts (not null), name, sort_order,
sets (int), reps (int), weight_kg (numeric), notes`

One row per exercise for strength workouts; unused for cardio-type workouts.

### `meals`
`id, user_id, meal_date (date, not null), title, description,
status (enum: planned/completed, default 'planned'), calories (int),
protein_g / carbs_g / fat_g (numeric), notes`

The weekly meal plan (dinner-focused MVP, per product decision): one row per
meal, nutrition entered manually. No recipe/ingredient tables yet — deferred
until AI-assisted suggestions are built, at which point `meals` gains a
`source`/`suggested_by` column the same way `workouts` did for external
training data, rather than a schema rewrite.

### `routines`
`id, user_id, title, recurrence_days (int[] 0-6, or interval_days (int)),
reminder_time (time), goal_id → goals (nullable), active (bool), notes`

### `routine_completions`
`id, user_id, routine_id → routines (not null), completed_date (date),
completed_at (timestamptz)` — unique on `(routine_id, completed_date)`.

### `weekly_plans` / `weekly_priorities` (schema kept, Plan UI removed)
`weekly_plans: id, user_id, week_start_date (date, ISO Monday), reviewed_at
(timestamptz), review_summary (text), created_at` — unique on
`(user_id, week_start_date)`.
`weekly_priorities: id, user_id, weekly_plan_id → weekly_plans (not null),
title, task_id → tasks (nullable), goal_id → goals (nullable),
sort_order (1-3), status (enum: pending/done)`

The standalone Weekly Planner page and its "3 priorities" UI were removed
(not used). The tables stay — `weekly_plans.review_summary` is still where
the Weekly Review's generated narrative is cached, and `isoWeekStart`/
`isoWeekEnd` (in `lib/services/weekly-plan.ts`) are reused by Calendar,
Review, and Training's weekly stats — but nothing writes a
`weekly_priorities` row today.

### `notes`
`id, user_id, body (text, not null), task_id → tasks, goal_id → goals,
workout_id → workouts` — a lightweight freeform note attachable to one
parent object at a time (enforced with a check constraint, not a rule); not
a general-purpose notes app.

### `preferences`
Confirmed user preferences, kept structurally separate from raw AI
inference (product-architecture §7):
`id, user_id, key (text, e.g. 'preferred_workout_time'), value (jsonb),
source (enum: user_stated/user_confirmed_inference), confidence (numeric
0-1, null for user_stated), derived_from_ai_message_id → ai_messages
(nullable), created_at`

An inference Claude surfaces mid-conversation is *never* written here
automatically — only a Server Action triggered by the user clicking
"confirm" inserts a row, with `source = 'user_confirmed_inference'`.

### `ai_conversations`
`id, user_id, title, context_scope (text, e.g. 'training' | 'global' —
which page/module it was opened from), created_at, last_message_at`

### `ai_messages`
`id, user_id, conversation_id → ai_conversations (not null),
role (enum: user/assistant/system), content (text), tool_calls (jsonb,
null), model (text), input_tokens (int), output_tokens (int),
latency_ms (int), created_at`

### `ai_actions`
`id, user_id, conversation_id → ai_conversations, message_id → ai_messages,
action_type (text, e.g. 'create_task' | 'create_calendar_block' |
'set_weekly_priorities'), payload (jsonb, not null — the proposed
arguments), explanation (text, not null — human-readable reason shown in
the UI), status (enum: proposed/approved/rejected/executed/failed,
default 'proposed'), result (jsonb, null — id(s) of what was created on
execution), error (text, null), created_at, approved_at, executed_at`

This is the entire write-approval mechanism (technical-architecture §6) —
one table, one status machine, reused by every write tool.

### `automation_rules` (schema present, engine not built in v1)
`id, user_id, name, trigger_type (text, e.g. 'schedule' | 'task_due_soon' |
'goal_inactive'), trigger_config (jsonb), condition (jsonb, nullable),
action_type (text), action_config (jsonb), enabled (bool), last_run_at`

Present so the automation examples in the brief (§16) — Sunday-evening
review prep, task-due-tomorrow reminders, goal-inactive-14-days surfacing —
have a home the moment they're built, without a schema migration blocking
that work.

## Migrations

SQL lives in `supabase/migrations/`, applied in order:

```
0001_extensions_and_helpers.sql   pgcrypto, updated_at trigger function
0002_categories.sql                also seeds default categories for a new user
0003_goals.sql
0004_calendar.sql
0005_tasks.sql
0006_training.sql
0007_routines.sql
0008_weekly_plan.sql
0009_notes_preferences.sql
0010_ai.sql
0011_automation_rules.sql
0012_goal_checkins.sql             check_frequency on goals + goal_checkins table
0013_diet.sql                      meals table
```

Every migration ends with `alter table ... enable row level security;` and
four policies (`select`/`insert`/`update`/`delete`) of the shape
`using (user_id = auth.uid())` / `with check (user_id = auth.uid())`. This is
enforced per-migration rather than as one giant policy file so each table's
access rule ships in the same commit as the table itself.
