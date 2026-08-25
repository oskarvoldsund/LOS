-- Schema only in v1 — no execution engine runs against this table yet.
-- See docs/product-architecture.md §8 and docs/technical-architecture.md §8.

create table public.automation_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  trigger_type text not null,
  trigger_config jsonb not null default '{}',
  condition jsonb,
  action_type text not null,
  action_config jsonb not null default '{}',
  enabled boolean not null default false,
  last_run_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger automation_rules_set_updated_at
  before update on public.automation_rules
  for each row execute function public.set_updated_at();

create index automation_rules_user_id_idx on public.automation_rules (user_id);

alter table public.automation_rules enable row level security;

create policy "automation_rules_select_own" on public.automation_rules
  for select using (user_id = auth.uid());
create policy "automation_rules_insert_own" on public.automation_rules
  for insert with check (user_id = auth.uid());
create policy "automation_rules_update_own" on public.automation_rules
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "automation_rules_delete_own" on public.automation_rules
  for delete using (user_id = auth.uid());
