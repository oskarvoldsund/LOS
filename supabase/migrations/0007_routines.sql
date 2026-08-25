create table public.routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  recurrence_days smallint[],
  interval_days integer,
  reminder_time time,
  goal_id uuid references public.goals (id) on delete set null,
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint routines_recurrence_shape check (
    (recurrence_days is not null and interval_days is null)
    or (recurrence_days is null and interval_days is not null)
  )
);

create trigger routines_set_updated_at
  before update on public.routines
  for each row execute function public.set_updated_at();

create index routines_user_id_idx on public.routines (user_id);

alter table public.routines enable row level security;

create policy "routines_select_own" on public.routines
  for select using (user_id = auth.uid());
create policy "routines_insert_own" on public.routines
  for insert with check (user_id = auth.uid());
create policy "routines_update_own" on public.routines
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "routines_delete_own" on public.routines
  for delete using (user_id = auth.uid());

create table public.routine_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  routine_id uuid not null references public.routines (id) on delete cascade,
  completed_date date not null,
  completed_at timestamptz not null default now(),
  unique (routine_id, completed_date)
);

create index routine_completions_user_id_idx on public.routine_completions (user_id);
create index routine_completions_routine_id_idx on public.routine_completions (routine_id);

alter table public.routine_completions enable row level security;

create policy "routine_completions_select_own" on public.routine_completions
  for select using (user_id = auth.uid());
create policy "routine_completions_insert_own" on public.routine_completions
  for insert with check (user_id = auth.uid());
create policy "routine_completions_update_own" on public.routine_completions
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "routine_completions_delete_own" on public.routine_completions
  for delete using (user_id = auth.uid());
