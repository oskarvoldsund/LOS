create type public.calendar_provider as enum ('mock', 'google', 'outlook', 'apple');
create type public.calendar_event_source as enum ('external', 'task_block', 'workout_block', 'manual');
create type public.calendar_event_status as enum ('confirmed', 'tentative', 'cancelled');

create table public.calendar_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  provider public.calendar_provider not null default 'mock',
  display_name text not null,
  external_account_id text,
  access_token_ciphertext text,
  refresh_token_ciphertext text,
  sync_enabled boolean not null default false,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger calendar_accounts_set_updated_at
  before update on public.calendar_accounts
  for each row execute function public.set_updated_at();

create index calendar_accounts_user_id_idx on public.calendar_accounts (user_id);

alter table public.calendar_accounts enable row level security;

create policy "calendar_accounts_select_own" on public.calendar_accounts
  for select using (user_id = auth.uid());
create policy "calendar_accounts_insert_own" on public.calendar_accounts
  for insert with check (user_id = auth.uid());
create policy "calendar_accounts_update_own" on public.calendar_accounts
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "calendar_accounts_delete_own" on public.calendar_accounts
  for delete using (user_id = auth.uid());

create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  calendar_account_id uuid references public.calendar_accounts (id) on delete set null,
  title text not null,
  description text,
  location text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  all_day boolean not null default false,
  source_type public.calendar_event_source not null default 'manual',
  external_event_id text,
  status public.calendar_event_status not null default 'confirmed',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint calendar_events_time_order check (ends_at >= starts_at)
);

create trigger calendar_events_set_updated_at
  before update on public.calendar_events
  for each row execute function public.set_updated_at();

create index calendar_events_user_id_idx on public.calendar_events (user_id);
create index calendar_events_starts_at_idx on public.calendar_events (user_id, starts_at);

alter table public.calendar_events enable row level security;

create policy "calendar_events_select_own" on public.calendar_events
  for select using (user_id = auth.uid());
create policy "calendar_events_insert_own" on public.calendar_events
  for insert with check (user_id = auth.uid());
create policy "calendar_events_update_own" on public.calendar_events
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "calendar_events_delete_own" on public.calendar_events
  for delete using (user_id = auth.uid());
