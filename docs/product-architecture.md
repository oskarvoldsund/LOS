# Product Architecture — Life OS

## 1. Vision

A single private portal that shows what matters today, helps plan the week, and
gradually automates the repetitive planning and administrative overhead of a life —
tasks, calendar, goals, training, routines — with Claude acting as an intelligence
layer across all of it, not a chat window bolted onto the side.

The test for every feature, at every stage: **does this make my life simpler?**
If a feature adds more administration than it removes, it's cut or simplified.

## 2. Product principles

1. **One data model, not five apps.** Tasks, calendar events, goals, workouts,
   routines, and AI proposals are rows in a connected schema, not separate tools
   that happen to share a nav bar. A goal can point at milestones, which point at
   tasks and workouts, which show up on the calendar and in completion history.
2. **Quick capture is sacred.** Getting something out of your head and into the
   system must take one shortcut and one sentence. Organizing it can happen later.
   `Cmd+K` → type → `Enter` is the baseline interaction, not a fallback.
3. **Claude reasons over the model, it doesn't replace it.** Every piece of
   structured data (tasks, goals, workouts, calendar) is queryable and editable
   without Claude. Claude adds interpretation, planning, and pattern-spotting on
   top — it is a better lens on the same data, not a separate source of truth.
4. **Read is free, write is proposed.** Claude can look at anything relevant
   without asking. Claude changing anything material goes through a visible,
   inspectable proposal the user approves, edits, or rejects — the `AIAction`
   pattern (see technical-architecture.md §6).
5. **Calm over comprehensive.** The dashboard answers "what matters today" in a
   few lines, not a wall of widgets. Depth lives one click away in each module.
6. **Build for one user, design for more.** No enterprise multi-tenant
   machinery in v1, but every table carries `user_id` and RLS from day one so
   adding a second user later is a policy change, not a rewrite.
7. **Own your data.** Nothing here should become a walled garden. JSON/CSV
   export and Postgres backups are a first-class requirement, not a nice-to-have.

## 3. Information architecture

Primary navigation (always visible):

```
Today · Tasks · Calendar · Goals · Training · Diet
```

(The standalone Weekly Planner that originally sat here was removed after
the MVP — not used in practice. Its "3 priorities" mechanism is superseded
by Goals' check-in cadence — see §5.3 and §5.6.)

Secondary navigation (grouped under a "More" or settings-adjacent area):

```
Review · Routines · Settings
```

Claude is not a nav item — it's a persistent side panel reachable from anywhere
via a keyboard shortcut (`Cmd+J`) and a small trigger in the top bar, plus a
dedicated `/ask` view for longer sessions. It is contextual: it knows which
page/module you're currently looking at and scopes its default context to it.

Global, always available regardless of page:

- **Quick Add** (`Cmd+K`) — capture a task/workout/note in one line.
- **Claude panel** (`Cmd+J`) — ask, plan, review, propose.

## 4. Core domain model (conceptual)

```
Goal (life / annual / quarterly / monthly)
  ├─ GoalMilestone
  │    ├─ Task            (execution)
  │    ├─ Routine          (recurring habit that serves the goal)
  │    └─ Workout           (training that serves the goal)
  └─ GoalCheckin* (if check_frequency ≠ none — one per completed period)

CalendarEvent (from CalendarAccount, or a Task/Workout materialized as a block)

Meal (per day — weekly diet plan, dinner-focused)

Task ── optional → Goal, GoalMilestone, Category, CalendarEvent (time-blocked)
Workout ── optional → Goal, GoalMilestone, CalendarEvent
Routine ── generates recurring Task instances or its own completion log

AIConversation
  └─ AIMessage*
       └─ AIAction*  (proposed → approved/rejected → executed/failed)

Preference (user-confirmed, separate from raw AI inference — see §7)
```

(`WeeklyPlan`/`WeeklyPriority` still exist in the schema — Review's narrative
is cached on `WeeklyPlan.review_summary` — but the standalone Weekly Planner
UI that used to sit on this diagram was removed; see §5.6.)

Every leaf object (Task, Workout, Routine occurrence) carries enough history
(`completed_at`, `status`, `postponed_count`-derivable via updated_at trail) that
the Weekly Review and Claude's pattern-spotting can be built on real completion
data instead of self-report.

## 5. Module specs

### 5.1 Today (home dashboard)

Answers "what matters today" in one screen, nothing below the fold on a laptop:

- Date + a one-line greeting.
- Today's calendar (compact list, not a full grid).
- Priority tasks for today (explicitly prioritized or due today).
- Overdue tasks (collapsed by default if more than 3).
- Today's planned workout, if any.
- Goal check-ins not yet done this period (daily/weekly/monthly cadenced
  goals — see §5.3), with an inline checkbox — this is the "what have I
  forgotten?" surface.
- One goal's progress (rotates or user-pinned), not all goals.
- A short Claude-generated daily overview — **manually triggered** in v1
  ("Generate today's overview"), not run on every page load (cost control,
  §29 of the brief). Cached per day once generated.

Explicitly *not* on this page: settings, analytics charts, full task lists,
full calendar grid. Those live one click away.

### 5.2 Tasks + Inbox

A task is deliberately over-specified in the schema (title, description,
category, project/context, priority, status, due date + optional time,
estimated duration, recurrence, goal link, tags, notes, timestamps) but
under-specified in the UI — creating one only requires a title. Everything
else is optional and can be filled in later or never.

**Inbox** is a zero-friction capture view: anything created via Quick Add
without an explicit category/date lands here until triaged. It is the same
`tasks` table with `status = 'inbox'`, not a separate object.

Views: Inbox · Today · This Week · Upcoming · Completed · By Category · By Goal.
Categories are user-configurable (seeded with Work/Personal/Finance/Training/
Family/Travel/Home/Learning) — a `categories` table per user, not an enum.

### 5.3 Goals

Hierarchical: Life → Annual → Quarterly → Monthly, each optionally parented to
the level above (`parent_goal_id`), with `GoalMilestone` rows underneath.
A goal carries *why it matters*, not just *what* — that field is what lets
Claude later reason about whether weekly activity actually serves the stated
intent (the running-a-half-marathon example in the brief). Progress is a
computed value (linked-item completion ratio) with an optional manual override,
never a number typed in a vacuum.

**Check-in cadence.** Independent of the milestone model, a goal can carry a
`check_frequency` of daily/weekly/monthly, turning it into a "habit-style"
goal: a checkbox for the current period appears on the goal card, the goal
detail page, and — if not yet done — as a reminder on Today. Each completed
period is one `GoalCheckin` row; streak (current + longest) and a completion
rate over a recent window are computed from that history, not stored
redundantly. A goal's Stats page (`/goals/[id]/stats`) shows both plus a
simple heatmap of recent periods. This intentionally reuses the shape of
Routines (§5.7) rather than duplicating it wholesale: Routines stay for
lightweight habits with no goal attached; a cadenced Goal is for a habit that
*is* the goal (or serves one) and benefits from `why_it_matters` and, later,
Claude reasoning about it alongside milestones and linked tasks/workouts.

### 5.4 Training

Two surfaces over one `workouts` table distinguished by `status`
(`planned` vs `completed`) and `scheduled_date` vs `completed_at`:

- **Training Plan** — what's scheduled, this week and ahead.
- **Training Log** — history, with planned-vs-completed and simple stats
  (sessions/week, streak, volume by activity type).

Structured `WorkoutExercise` rows for strength (exercise, sets, reps, weight);
scalar fields on `Workout` for cardio (distance, duration, intensity/effort).
The schema anticipates Strava/Garmin/Apple Health as a future `source`
column and external-id field on `Workout` — no integration is built in v1.

### 5.5 Calendar

Unified day/week/month views over a `calendar_events` table. In v1 the only
populated source is a `mock` `CalendarAccount` (seed data) plus events
materialized from time-blocked Tasks and scheduled Workouts. The read/write
path goes through a `CalendarProvider` adapter interface from day one
(technical-architecture.md §4) so Google/Outlook/Apple providers are additive,
not a rewrite. Time-blocking (dragging a Task into a free slot) is a v1.x
feature once the base calendar is solid — the data model supports it
(`Task.calendar_event_id`) even before the UI does.

### 5.6 Diet

A weekly meal plan, dinner-focused in v1: a 7-day grid, one or more `Meal`
rows per day (title, optional description, manually entered nutrition —
calories/protein/carbs/fat), with a planned → completed status mirroring
Training's plan/log pattern. Weekly and per-day nutrition totals are computed
in plain code (§29 cost principle), not by calling Claude to add numbers.

No recipe or ingredient database in v1 — meals are freeform. AI-assisted meal
suggestions (based on stated preferences and nutrition targets) are explicitly
future work: the schema and service layer (`lib/services/diet.ts`) are
structured the same way Training's were before workouts got a `source`
column, so adding suggestions later means adding a field and a Claude tool,
not a rewrite.

**Removed:** the standalone Weekly Planner ("3 priorities for the week" +
"Plan my week") shipped in the original MVP but wasn't used, and was removed.
Weekly-cadence planning now happens through Goals' check-in cadence (§5.3)
instead of a separate priorities mechanism. The Weekly Review (§5.8) is
unaffected — it always computed its stats directly from tasks/training/goals,
not from the Weekly Planner's tables.

### 5.7 Routines

Deliberately lightweight — not a habit-tracker with streaks, charts, and
badges. A routine has a title, recurrence (days of week or interval),
optional reminder, and a completion history. Marking one done today is a
single tap from Today or Routines. No gamification.

### 5.8 Review (Weekly Review)

A generated report, not a form: completed vs planned tasks, training
planned-vs-completed, calendar load, per-goal activity, routines kept,
tasks postponed repeatedly (≥2 weeks). Claude adds the narrative
interpretation on top of numbers computed in plain code (§29 cost
principle — don't call the model to count rows).

### 5.9 Settings

Categories, calendar accounts (mock in v1), AI usage/logging visibility,
data export (JSON/CSV), account.

## 6. Key user flows

**Capture (must be < 5 seconds):**
`Cmd+K` → "Pay electricity bill Friday" → `Enter` → task created in Inbox with
a parsed due date, everything else default. No modal chain.

**Morning:**
Open app → Today dashboard already shows the day → optionally tap "Generate
today's overview" for Claude's one-paragraph read on the day.

**Daily habit check-in:**
Open Today → see any goal not yet checked in this period → tick it
inline. Streak updates immediately; the full history lives on the goal's
Stats page.

**Meal planning:**
Open Diet → pick a day in the current week → "Add meal" with a name and
(optionally) macros → repeat for the week. Weekly and per-day nutrition
totals update automatically, computed in code.

**Mid-week question:**
`Cmd+J` from anywhere → "When can I train three times this week?" → Claude
reads calendar + training plan + preferences → answers, optionally proposes
workout blocks → user approves or edits before anything is written.

**Reflection:**
End of week → `/review` → Claude's read on the week → "What should we change
next week?" feeds directly into how goals, training, and tasks get set up
going forward.

## 7. AI-inference vs. fact boundary

Two categories of data, kept structurally separate (technical-architecture.md
§7, data-model.md `preferences` table):

- **Fact** — what happened. Task completions, workout logs, calendar events.
  Never written by Claude without a corresponding user action (completing a
  task, approving a proposed event).
- **Inference** — what Claude notices or infers ("you seem to prefer weekend
  training"). Surfaced as a suggestion in the UI. Only promoted to a stored
  `Preference` (with a `source` of `user_confirmed` and a confidence value)
  when the user explicitly confirms it. Unconfirmed inferences are never
  silently treated as fact in later reasoning.

## 8. MVP boundary

**In v1 (see technical-architecture.md and the implementation plan for build
order):** auth, app shell, Today dashboard, Tasks + Inbox, Goals (milestones
+ check-in cadence with streaks/stats), Training plan/log, Calendar (mock
provider), Diet (weekly meal plan + manual nutrition), Quick Add, Claude
assistant with read tools + `create_task`/`create_calendar_block`-class write
tools behind approval.

**Explicitly deferred (designed for, not built):** Strava/Garmin/Apple Health,
real calendar providers (Google/Outlook/Apple), the automation engine
(trigger+condition+action), MCP server exposure, multiple AI providers,
advanced notifications, fully autonomous (non-approved) AI actions, finance
and travel modules, sophisticated analytics/charting, AI-assisted meal
suggestions and a recipe/ingredient database for Diet (§5.6), Claude tools
for Diet.

**Removed after the MVP build (not used in practice):** the standalone
Weekly Planner page (§5.6) — its "3 priorities" mechanism is superseded by
Goals' check-in cadence (§5.3).

Each deferred item has a concrete extension point already in the schema or
architecture (adapter interfaces, `AutomationRule` table shape sketched in
data-model.md, service-layer functions reusable as MCP tools) so adding it
later is additive.
