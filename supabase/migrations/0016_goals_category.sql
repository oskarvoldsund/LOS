-- Lets a goal reuse the same user-configurable Categories system Tasks
-- already use (e.g. "Training", "Personal") instead of a separate,
-- goal-only category concept. No RLS change needed — goals RLS is already
-- scoped by user_id, and this FK just references a categories row the same
-- user owns (same trust model as tasks.category_id).

alter table public.goals
  add column category_id uuid references public.categories (id) on delete set null;

create index goals_category_id_idx on public.goals (category_id);
