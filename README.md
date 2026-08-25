# Life OS

A personal Life Operating System — one portal for tasks, calendar, goals,
training, and weekly planning, with Claude as an intelligence layer across
all of it. See `docs/` for the full design:

- [`docs/product-architecture.md`](docs/product-architecture.md) — principles, information architecture, MVP boundary
- [`docs/technical-architecture.md`](docs/technical-architecture.md) — stack, service layer, security
- [`docs/data-model.md`](docs/data-model.md) — schema and migrations
- [`docs/claude-integration.md`](docs/claude-integration.md) — Anthropic integration architecture and why (answers "can I use my Claude.ai subscription?")

## Stack

Next.js (App Router) · TypeScript (strict) · Tailwind CSS + shadcn/ui ·
Supabase (Postgres + Auth, RLS everywhere) · Anthropic TypeScript SDK ·
Vercel.

## Setup

### 1. Supabase project

Create a project at [supabase.com](https://supabase.com), then apply the
migrations in `supabase/migrations/` in order. With the Supabase CLI:

```bash
supabase login
supabase link --project-ref <your-project-ref>
supabase db push
```

(Or paste each file in `supabase/migrations/` into the SQL editor in order,
0001 → 0011, if you'd rather not install the CLI.)

Once linked, regenerate the TypeScript types from the real schema (the
checked-in `src/lib/supabase/database.types.ts` is hand-written to match the
migrations and should be kept in sync, or replaced by this):

```bash
supabase gen types typescript --linked > src/lib/supabase/database.types.ts
```

### 2. Environment variables

```bash
cp .env.example .env.local
```

Fill in:

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase dashboard → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard → Project Settings → API (server-only; not used by the MVP today, reserved for future privileged jobs) |
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) → API Keys — see `docs/claude-integration.md` for why this must be an API key rather than your Claude.ai subscription |

Never commit `.env.local`. Never reference `SUPABASE_SERVICE_ROLE_KEY` or
`ANTHROPIC_API_KEY` from any file that ships to the browser.

### 3. Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), create an account, and
you're in.

## Scripts

```bash
npm run dev      # start the dev server
npm run build    # production build (also runs the TypeScript check)
npm run lint     # eslint
```

## Project layout

```
src/app/(app)/*        authenticated pages (Today, Tasks, Calendar, Goals, Training, Diet, Review, Routines, Settings)
src/app/api/assistant   Claude chat endpoint (tool use + approval flow)
src/app/api/export      JSON data export
src/components/         UI, grouped by module; src/components/ui is shadcn primitives
src/lib/services/       the domain/service layer — one implementation per operation, reused by
                         Server Actions and Claude's tools (see technical-architecture.md §3)
src/lib/ai/             AIProvider abstraction, Anthropic implementation, tool definitions
src/lib/actions/        Server Actions (thin wrappers around lib/services)
src/lib/supabase/       Supabase client factories + hand-maintained database types
supabase/migrations/    SQL migrations, applied in order
```

## Data export

Settings → Your data. Business data (tasks/goals/training/calendar) and AI
conversation history export as separate JSON bundles — see
`docs/technical-architecture.md` §10.
