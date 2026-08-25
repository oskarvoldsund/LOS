create type public.ai_message_role as enum ('user', 'assistant', 'system');
create type public.ai_action_status as enum ('proposed', 'approved', 'rejected', 'executed', 'failed');

create table public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text,
  context_scope text not null default 'global',
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);

create index ai_conversations_user_id_idx on public.ai_conversations (user_id);

alter table public.ai_conversations enable row level security;

create policy "ai_conversations_select_own" on public.ai_conversations
  for select using (user_id = auth.uid());
create policy "ai_conversations_insert_own" on public.ai_conversations
  for insert with check (user_id = auth.uid());
create policy "ai_conversations_update_own" on public.ai_conversations
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "ai_conversations_delete_own" on public.ai_conversations
  for delete using (user_id = auth.uid());

create table public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  conversation_id uuid not null references public.ai_conversations (id) on delete cascade,
  role public.ai_message_role not null,
  content text not null default '',
  tool_calls jsonb,
  model text,
  input_tokens integer,
  output_tokens integer,
  latency_ms integer,
  created_at timestamptz not null default now()
);

create index ai_messages_user_id_idx on public.ai_messages (user_id);
create index ai_messages_conversation_id_idx on public.ai_messages (conversation_id);

alter table public.ai_messages enable row level security;

create policy "ai_messages_select_own" on public.ai_messages
  for select using (user_id = auth.uid());
create policy "ai_messages_insert_own" on public.ai_messages
  for insert with check (user_id = auth.uid());
create policy "ai_messages_update_own" on public.ai_messages
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "ai_messages_delete_own" on public.ai_messages
  for delete using (user_id = auth.uid());

-- Deferred FK from preferences → ai_messages, now that ai_messages exists.
alter table public.preferences
  add constraint preferences_derived_from_ai_message_id_fkey
  foreign key (derived_from_ai_message_id) references public.ai_messages (id) on delete set null;

create table public.ai_actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  conversation_id uuid references public.ai_conversations (id) on delete set null,
  message_id uuid references public.ai_messages (id) on delete set null,
  action_type text not null,
  payload jsonb not null,
  explanation text not null,
  status public.ai_action_status not null default 'proposed',
  result jsonb,
  error text,
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  executed_at timestamptz
);

create index ai_actions_user_id_idx on public.ai_actions (user_id);
create index ai_actions_status_idx on public.ai_actions (user_id, status);
create index ai_actions_conversation_id_idx on public.ai_actions (conversation_id);

alter table public.ai_actions enable row level security;

create policy "ai_actions_select_own" on public.ai_actions
  for select using (user_id = auth.uid());
create policy "ai_actions_insert_own" on public.ai_actions
  for insert with check (user_id = auth.uid());
create policy "ai_actions_update_own" on public.ai_actions
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "ai_actions_delete_own" on public.ai_actions
  for delete using (user_id = auth.uid());
