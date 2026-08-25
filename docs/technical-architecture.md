# Technical Architecture — Life OS

## 1. Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js (App Router, latest stable) | Server Components by default, Server Actions for mutations |
| Language | TypeScript, `strict: true` | No `any` in domain/service code |
| Styling | Tailwind CSS v4 + shadcn/ui | Copied components in `src/components/ui`, not a black-box dependency |
| Database | Supabase (managed Postgres) | Row Level Security everywhere, SQL migrations checked in |
| Auth | Supabase Auth | Email/password + magic link; middleware-enforced sessions |
| AI | Anthropic TypeScript SDK (`@anthropic-ai/sdk`), Claude API | Server-only — see `docs/claude-integration.md` |
| Deployment | Vercel | Server Actions / Route Handlers hold every secret |

No ORM. Supabase's generated types (`supabase gen types typescript`) plus a
thin service layer give type safety without an extra abstraction layer over
SQL that a single-user app doesn't need.

## 2. Directory layout

```
src/
  app/
    (marketing)/                 # landing/login, unauthenticated
    (app)/                       # authenticated shell
      today/
      tasks/
      calendar/
      goals/
      training/
      plan/
      review/
      routines/
      settings/
      layout.tsx                 # shell: nav + Claude panel host
    api/
      assistant/route.ts         # Claude streaming endpoint (server-only)
      quick-add/route.ts         # deterministic capture parser
  components/
    ui/                          # shadcn primitives
    shell/                       # nav, command palette, assistant panel
    tasks/ goals/ training/ calendar/ plan/ review/ routines/
  lib/
    supabase/
      server.ts client.ts middleware.ts
      database.types.ts          # generated
    services/                    # domain/service layer — see §3
      tasks.ts goals.ts training.ts calendar.ts weekly-plan.ts routines.ts
      categories.ts preferences.ts ai-actions.ts context.ts
    ai/
      provider.ts                 # AIProvider abstraction — see §5
      anthropic-provider.ts
      tools/                      # tool schemas + handlers, one file per domain
      context-builder.ts          # contextual retrieval layer — see §7
    parsing/
      quick-add.ts                # deterministic NL parsing
    types.ts
supabase/
  migrations/*.sql
docs/
  product-architecture.md
  technical-architecture.md
  data-model.md
  claude-integration.md
```

## 3. The service layer — the one rule that keeps this from becoming three apps

**Every domain operation is implemented exactly once**, as a plain async
TypeScript function in `lib/services/*.ts`, taking a Supabase client and typed
arguments, returning typed data. Nothing about a service function knows it
might be called from a Server Action, a Claude tool, or (later) an MCP tool —
it just does the operation against Postgres under RLS.

```ts
// lib/services/tasks.ts
export async function getTasks(
  db: SupabaseClient<Database>,
  userId: string,
  filter: TaskFilter,
): Promise<Task[]> { ... }

export async function createTask(
  db: SupabaseClient<Database>,
  userId: string,
  input: CreateTaskInput,
): Promise<Task> { ... }
```

Three consumers, one implementation:

```
Server Action (app UI)  ──┐
Claude tool handler      ──┼──▶  lib/services/*.ts  ──▶  Supabase (RLS)
MCP tool handler (future) ──┘
```

This directly satisfies the brief's requirement (§18): "design the
application's internal domain/service layer so the SAME functions can
eventually be exposed as internal application APIs, Claude tools, and MCP
tools." A Claude tool handler and a future MCP tool handler are both just a
thin adapter — JSON Schema in, service function call, JSON out — never a
reimplementation.

## 4. Calendar provider abstraction

```ts
// lib/services/calendar-providers/types.ts
export interface CalendarProvider {
  id: string; // 'mock' | 'google' | 'outlook' | 'apple'
  listEvents(range: DateRange): Promise<CalendarEvent[]>;
  createEvent(input: CreateEventInput): Promise<CalendarEvent>;
  updateEvent(id: string, input: UpdateEventInput): Promise<CalendarEvent>;
  deleteEvent(id: string): Promise<void>;
}
```

v1 ships a `MockCalendarProvider` reading/writing the `calendar_events` table
directly (seeded with a few realistic events) plus events materialized from
time-blocked tasks and scheduled workouts. `calendar_accounts.provider`
already models `google`/`outlook`/`apple`/`mock` so adding a real provider is:
implement `CalendarProvider`, add an OAuth connect flow, register it in a
provider registry — no changes to any page, service caller, or Claude tool.

## 5. AI provider abstraction

```ts
// lib/ai/provider.ts
export interface AIProvider {
  generate(input: GenerateInput): Promise<GenerateResult>;
  stream(input: GenerateInput): AsyncIterable<StreamEvent>;
  executeWithTools(input: ToolLoopInput): Promise<ToolLoopResult>;
}
```

`AnthropicProvider` is the only implementation in v1. The point of the
interface is not multi-provider support today — it's that `lib/services`,
Server Actions, and route handlers depend on `AIProvider`, never on
`@anthropic-ai/sdk` directly, so swapping or adding a provider later touches
one file (`lib/ai/anthropic-provider.ts` + a new sibling), not every call
site.

## 6. Claude tools and the approval flow

Full detail in `docs/claude-integration.md`. Summary of the mechanism this
architecture exists to support:

- **Read tools** call a service function and return data — no side effects,
  always allowed.
- **Write tools** do not mutate the database directly. They call a service
  function that inserts an `ai_actions` row with `status = 'proposed'` and a
  human-readable `explanation`. The UI renders proposed actions inline in the
  assistant panel (or wherever the conversation is happening) with
  Approve/Edit/Cancel. Only on approval does a second, narrowly-scoped
  execution step call the *real* mutating service function
  (`createTask`, `createCalendarBlock`, etc.) and mark the action
  `executed`/`failed`.

```
AIAction.status: proposed → approved → executed
                          ↘ rejected            ↘ failed
```

This is what makes Claude's write behavior inspectable rather than a black
box, and it's a generic pattern — any future write tool reuses the same
`ai_actions` table and the same UI component, it doesn't invent its own
confirmation flow.

## 7. Context construction (privacy + cost)

Claude never receives "the whole database." `lib/ai/context-builder.ts`
implements a contextual retrieval layer: given a user request (or the current
page), it calls a small, deliberately narrow set of service functions to
assemble only the relevant slice — e.g. "plan my training next week" pulls
training history + current plan + free calendar windows + confirmed training
preferences, not unrelated tasks, financial notes, or full historical
journal-style content. This is also where the read tools available to a given
conversation are scoped (e.g. the Training page's assistant context doesn't
expose goal-editing tools).

## 8. Cost control

- No model call for deterministic work: rendering today's date, sorting
  tasks, computing weekly stats — all plain TypeScript in the service layer.
- Claude is invoked for interpretation/planning only: daily overview (manual
  trigger, cached per day), weekly review narrative, "plan my week"-style
  requests, and interactive chat.
- Model selection is configurable per call site (`lib/ai/provider.ts`
  `model` param), defaulting to a cost-efficient model for short structured
  tasks and a stronger model for open-ended planning — see
  `claude-integration.md` §3 for the concrete choice and rationale.
- Every AI call is logged (`ai_conversations`/`ai_messages` + a lightweight
  usage record — tokens, latency, tool calls) so a Settings → AI Usage view
  is a query away when it's needed, without building it in v1.

## 9. Authentication & authorization

- Supabase Auth (email/password + magic link) issues the session; Next.js
  middleware (`lib/supabase/middleware.ts`) refreshes it on every request and
  redirects unauthenticated requests away from the `(app)` route group.
- **Row Level Security is on for every table from migration 0001.** Every
  table has a `user_id uuid references auth.users` column and a policy of the
  shape `user_id = auth.uid()` for select/insert/update/delete. This is what
  makes "personal app today, multi-user later" a non-event architecturally —
  the schema does not need to change to add a second user.
- Server Components and Server Actions use a request-scoped Supabase client
  bound to the user's session (cookies) — never the service-role key. The
  service-role key, if ever needed (e.g. a future cron job), stays in a
  server-only environment variable and is never imported into any file under
  `src/app` that also renders UI.

## 10. Data portability

- `lib/services/export.ts` — JSON export of all user-owned tables; CSV export
  for tasks/workouts/goals (the tabular ones). Reachable from Settings.
  Business data (tasks, goals, training, calendar) and AI conversation
  history export as separate bundles, so a user can keep the former and
  discard the latter.
- Supabase project backups (point-in-time recovery on paid tiers, or
  `pg_dump` on a schedule) cover disaster recovery; export covers "I want to
  leave."

## 11. Observability for AI (dev-time)

Every Claude call, when AI logging is enabled in Settings (off by default —
this is personal data), records: purpose/call-site, model, tools invoked and
their arguments (not raw tool *results* if they contain sensitive data — see
`claude-integration.md`), the resulting `ai_action`(s) if any, success/failure,
token usage, latency. Stored in `ai_messages`/a lightweight `ai_usage_log`,
queryable in dev via Supabase Studio; no dedicated UI in v1 beyond that.

## 12. Deployment

- Vercel project connected to the repo; `main` auto-deploys.
- Environment variables (documented in `README.md`): `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server-only,
  used only where explicitly needed), `ANTHROPIC_API_KEY` (server-only).
- Supabase migrations are applied via `supabase db push` (or CI) against the
  linked project — never hand-edited in the dashboard as the source of truth.

## 13. Security summary

- Anthropic API key and Supabase service-role key: server environment
  variables only, referenced only in files that never ship to the client
  bundle (Route Handlers, Server Actions, `lib/services`, `lib/ai`).
- RLS is the actual access-control boundary, not application-level checks
  alone — even a bug in a Server Action cannot leak cross-user data.
- Claude's write path is capability-limited by which tools a given
  conversation is given (§7) and gated by the approval flow (§6) — Claude is
  never handed a raw SQL/database credential, satisfying the brief's
  explicit requirement.
- Input validation with `zod` at every Server Action and tool-handler
  boundary — user text and model-produced tool arguments are both untrusted
  input.
