-- Weekly meal planning (dinner-focused MVP). One row per meal; nutrition is
-- manually entered for now. AI suggestions and a recipe/ingredient database
-- are deliberately deferred — see docs/product-architecture.md.

create type public.meal_status as enum ('planned', 'completed');

create table public.meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  meal_date date not null,
  title text not null,
  description text,
  status public.meal_status not null default 'planned',
  calories integer,
  protein_g numeric(5, 1),
  carbs_g numeric(5, 1),
  fat_g numeric(5, 1),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger meals_set_updated_at
  before update on public.meals
  for each row execute function public.set_updated_at();

create index meals_user_id_idx on public.meals (user_id);
create index meals_meal_date_idx on public.meals (user_id, meal_date);

alter table public.meals enable row level security;

create policy "meals_select_own" on public.meals
  for select using (user_id = auth.uid());
create policy "meals_insert_own" on public.meals
  for insert with check (user_id = auth.uid());
create policy "meals_update_own" on public.meals
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "meals_delete_own" on public.meals
  for delete using (user_id = auth.uid());
