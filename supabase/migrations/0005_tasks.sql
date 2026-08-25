create type public.task_priority as enum ('low', 'medium', 'high', 'urgent');
create type public.task_status as enum ('inbox', 'todo', 'in_progress', 'completed', 'cancelled');

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text,
  category_id uuid references public.categories (id) on delete set null,
  project text,
  priority public.task_priority not null default 'medium',
  status public.task_status not null default 'inbox',
  due_date date,
  due_time time,
  estimated_minutes integer,
  recurrence text,
  goal_id uuid references public.goals (id) on delete set null,
  milestone_id uuid references public.goal_milestones (id) on delete set null,
  calendar_event_id uuid references public.calendar_events (id) on delete set null,
  tags text[] not null default '{}',
  notes text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

create index tasks_user_id_idx on public.tasks (user_id);
create index tasks_status_idx on public.tasks (user_id, status);
create index tasks_due_date_idx on public.tasks (user_id, due_date);
create index tasks_goal_id_idx on public.tasks (goal_id);

alter table public.tasks enable row level security;

create policy "tasks_select_own" on public.tasks
  for select using (user_id = auth.uid());
create policy "tasks_insert_own" on public.tasks
  for insert with check (user_id = auth.uid());
create policy "tasks_update_own" on public.tasks
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "tasks_delete_own" on public.tasks
  for delete using (user_id = auth.uid());
