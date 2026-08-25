-- Recurring check-ins for "habit-style" goals (daily/weekly/monthly), on top
-- of the existing milestone-based goal model. A goal with
-- check_frequency = 'none' behaves exactly as before; setting a frequency
-- turns on a checkbox + streak/completion tracking for that goal.

create type public.goal_check_frequency as enum ('none', 'daily', 'weekly', 'monthly');

alter table public.goals
  add column check_frequency public.goal_check_frequency not null default 'none';

create table public.goal_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  goal_id uuid not null references public.goals (id) on delete cascade,
  -- Normalized period key: for 'daily' the calendar date; for 'weekly' the
  -- ISO Monday of that week; for 'monthly' the 1st of that month. One row
  -- per goal per period.
  period_date date not null,
  completed_at timestamptz not null default now(),
  unique (goal_id, period_date)
);

create index goal_checkins_user_id_idx on public.goal_checkins (user_id);
create index goal_checkins_goal_id_idx on public.goal_checkins (goal_id, period_date desc);

alter table public.goal_checkins enable row level security;

create policy "goal_checkins_select_own" on public.goal_checkins
  for select using (user_id = auth.uid());
create policy "goal_checkins_insert_own" on public.goal_checkins
  for insert with check (user_id = auth.uid());
create policy "goal_checkins_update_own" on public.goal_checkins
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "goal_checkins_delete_own" on public.goal_checkins
  for delete using (user_id = auth.uid());
