create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  task_id uuid references public.tasks (id) on delete cascade,
  goal_id uuid references public.goals (id) on delete cascade,
  workout_id uuid references public.workouts (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint notes_single_parent check (
    (case when task_id is not null then 1 else 0 end
     + case when goal_id is not null then 1 else 0 end
     + case when workout_id is not null then 1 else 0 end) = 1
  )
);

create index notes_user_id_idx on public.notes (user_id);
create index notes_task_id_idx on public.notes (task_id);
create index notes_goal_id_idx on public.notes (goal_id);
create index notes_workout_id_idx on public.notes (workout_id);

alter table public.notes enable row level security;

create policy "notes_select_own" on public.notes
  for select using (user_id = auth.uid());
create policy "notes_insert_own" on public.notes
  for insert with check (user_id = auth.uid());
create policy "notes_update_own" on public.notes
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "notes_delete_own" on public.notes
  for delete using (user_id = auth.uid());

create type public.preference_source as enum ('user_stated', 'user_confirmed_inference');

create table public.preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  key text not null,
  value jsonb not null,
  source public.preference_source not null default 'user_stated',
  confidence numeric(4, 3) check (confidence between 0 and 1),
  derived_from_ai_message_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, key)
);

create trigger preferences_set_updated_at
  before update on public.preferences
  for each row execute function public.set_updated_at();

create index preferences_user_id_idx on public.preferences (user_id);

alter table public.preferences enable row level security;

create policy "preferences_select_own" on public.preferences
  for select using (user_id = auth.uid());
create policy "preferences_insert_own" on public.preferences
  for insert with check (user_id = auth.uid());
create policy "preferences_update_own" on public.preferences
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "preferences_delete_own" on public.preferences
  for delete using (user_id = auth.uid());
