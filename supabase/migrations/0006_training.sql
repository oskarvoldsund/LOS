create type public.activity_type as enum
  ('strength', 'running', 'cycling', 'walking', 'football', 'mobility', 'other');
create type public.workout_status as enum ('planned', 'completed', 'skipped');
create type public.workout_intensity as enum ('low', 'medium', 'high');
create type public.workout_source as enum ('manual', 'strava', 'garmin', 'apple_health');

create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  activity_type public.activity_type not null,
  status public.workout_status not null default 'planned',
  scheduled_date date,
  scheduled_time time,
  completed_at timestamptz,
  duration_minutes integer,
  distance_km numeric(6, 2),
  intensity public.workout_intensity,
  perceived_effort smallint check (perceived_effort between 1 and 10),
  notes text,
  goal_id uuid references public.goals (id) on delete set null,
  milestone_id uuid references public.goal_milestones (id) on delete set null,
  calendar_event_id uuid references public.calendar_events (id) on delete set null,
  source public.workout_source not null default 'manual',
  external_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger workouts_set_updated_at
  before update on public.workouts
  for each row execute function public.set_updated_at();

create index workouts_user_id_idx on public.workouts (user_id);
create index workouts_scheduled_date_idx on public.workouts (user_id, scheduled_date);
create index workouts_status_idx on public.workouts (user_id, status);

alter table public.workouts enable row level security;

create policy "workouts_select_own" on public.workouts
  for select using (user_id = auth.uid());
create policy "workouts_insert_own" on public.workouts
  for insert with check (user_id = auth.uid());
create policy "workouts_update_own" on public.workouts
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "workouts_delete_own" on public.workouts
  for delete using (user_id = auth.uid());

create table public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  workout_id uuid not null references public.workouts (id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  sets integer,
  reps integer,
  weight_kg numeric(6, 2),
  notes text,
  created_at timestamptz not null default now()
);

create index workout_exercises_user_id_idx on public.workout_exercises (user_id);
create index workout_exercises_workout_id_idx on public.workout_exercises (workout_id);

alter table public.workout_exercises enable row level security;

create policy "workout_exercises_select_own" on public.workout_exercises
  for select using (user_id = auth.uid());
create policy "workout_exercises_insert_own" on public.workout_exercises
  for insert with check (user_id = auth.uid());
create policy "workout_exercises_update_own" on public.workout_exercises
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "workout_exercises_delete_own" on public.workout_exercises
  for delete using (user_id = auth.uid());
