create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  color text not null default 'slate',
  icon text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

create index categories_user_id_idx on public.categories (user_id);

alter table public.categories enable row level security;

create policy "categories_select_own" on public.categories
  for select using (user_id = auth.uid());
create policy "categories_insert_own" on public.categories
  for insert with check (user_id = auth.uid());
create policy "categories_update_own" on public.categories
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "categories_delete_own" on public.categories
  for delete using (user_id = auth.uid());

-- Seeds the default category set for a newly created user.
create or replace function public.seed_default_categories(p_user_id uuid)
returns void
language sql
as $$
  insert into public.categories (user_id, name, color, sort_order)
  values
    (p_user_id, 'Work', 'blue', 1),
    (p_user_id, 'Personal', 'violet', 2),
    (p_user_id, 'Finance', 'emerald', 3),
    (p_user_id, 'Training', 'orange', 4),
    (p_user_id, 'Family', 'pink', 5),
    (p_user_id, 'Travel', 'cyan', 6),
    (p_user_id, 'Home', 'amber', 7),
    (p_user_id, 'Learning', 'indigo', 8)
  on conflict (user_id, name) do nothing;
$$;

-- Auto-seed categories the moment a new auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  perform public.seed_default_categories(new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
