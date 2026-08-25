-- Free-text daily diary entries. Standalone (not the generic `notes` table —
-- notes_single_parent requires exactly one of task_id/goal_id/workout_id,
-- and a diary entry has none of those parents).

create table public.diary_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  entry_date date not null default current_date,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger diary_entries_set_updated_at
  before update on public.diary_entries
  for each row execute function public.set_updated_at();

create index diary_entries_user_id_idx on public.diary_entries (user_id);
create index diary_entries_entry_date_idx on public.diary_entries (user_id, entry_date desc);

alter table public.diary_entries enable row level security;

create policy "diary_entries_select_own" on public.diary_entries
  for select using (user_id = auth.uid());
create policy "diary_entries_insert_own" on public.diary_entries
  for insert with check (user_id = auth.uid());
create policy "diary_entries_update_own" on public.diary_entries
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "diary_entries_delete_own" on public.diary_entries
  for delete using (user_id = auth.uid());
