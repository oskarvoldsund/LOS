create type public.weekly_priority_status as enum ('pending', 'done');

create table public.weekly_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  week_start_date date not null,
  reviewed_at timestamptz,
  review_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, week_start_date)
);

create trigger weekly_plans_set_updated_at
  before update on public.weekly_plans
  for each row execute function public.set_updated_at();

create index weekly_plans_user_id_idx on public.weekly_plans (user_id);

alter table public.weekly_plans enable row level security;

create policy "weekly_plans_select_own" on public.weekly_plans
  for select using (user_id = auth.uid());
create policy "weekly_plans_insert_own" on public.weekly_plans
  for insert with check (user_id = auth.uid());
create policy "weekly_plans_update_own" on public.weekly_plans
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "weekly_plans_delete_own" on public.weekly_plans
  for delete using (user_id = auth.uid());

create table public.weekly_priorities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  weekly_plan_id uuid not null references public.weekly_plans (id) on delete cascade,
  title text not null,
  task_id uuid references public.tasks (id) on delete set null,
  goal_id uuid references public.goals (id) on delete set null,
  sort_order smallint not null default 1 check (sort_order between 1 and 3),
  status public.weekly_priority_status not null default 'pending',
  created_at timestamptz not null default now(),
  unique (weekly_plan_id, sort_order)
);

create index weekly_priorities_user_id_idx on public.weekly_priorities (user_id);
create index weekly_priorities_plan_id_idx on public.weekly_priorities (weekly_plan_id);

alter table public.weekly_priorities enable row level security;

create policy "weekly_priorities_select_own" on public.weekly_priorities
  for select using (user_id = auth.uid());
create policy "weekly_priorities_insert_own" on public.weekly_priorities
  for insert with check (user_id = auth.uid());
create policy "weekly_priorities_update_own" on public.weekly_priorities
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "weekly_priorities_delete_own" on public.weekly_priorities
  for delete using (user_id = auth.uid());
