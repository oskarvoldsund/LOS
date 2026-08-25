-- Goals must exist before tasks (tasks reference goals + milestones).

create type public.goal_type as enum ('life', 'annual', 'quarterly', 'monthly');
create type public.goal_status as enum ('active', 'achieved', 'abandoned', 'paused');
create type public.milestone_status as enum ('pending', 'in_progress', 'done');

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text,
  why_it_matters text,
  goal_type public.goal_type not null default 'monthly',
  parent_goal_id uuid references public.goals (id) on delete set null,
  timeframe_start date,
  timeframe_end date,
  target_date date,
  status public.goal_status not null default 'active',
  progress_override numeric(5, 2) check (progress_override between 0 and 100),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create trigger goals_set_updated_at
  before update on public.goals
  for each row execute function public.set_updated_at();

create index goals_user_id_idx on public.goals (user_id);
create index goals_parent_goal_id_idx on public.goals (parent_goal_id);

alter table public.goals enable row level security;

create policy "goals_select_own" on public.goals
  for select using (user_id = auth.uid());
create policy "goals_insert_own" on public.goals
  for insert with check (user_id = auth.uid());
create policy "goals_update_own" on public.goals
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "goals_delete_own" on public.goals
  for delete using (user_id = auth.uid());

create table public.goal_milestones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  goal_id uuid not null references public.goals (id) on delete cascade,
  title text not null,
  target_date date,
  status public.milestone_status not null default 'pending',
  sort_order integer not null default 0,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger goal_milestones_set_updated_at
  before update on public.goal_milestones
  for each row execute function public.set_updated_at();

create index goal_milestones_user_id_idx on public.goal_milestones (user_id);
create index goal_milestones_goal_id_idx on public.goal_milestones (goal_id);

alter table public.goal_milestones enable row level security;

create policy "goal_milestones_select_own" on public.goal_milestones
  for select using (user_id = auth.uid());
create policy "goal_milestones_insert_own" on public.goal_milestones
  for insert with check (user_id = auth.uid());
create policy "goal_milestones_update_own" on public.goal_milestones
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "goal_milestones_delete_own" on public.goal_milestones
  for delete using (user_id = auth.uid());
