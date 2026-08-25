# Claude Integration Architecture — Life OS

This document is the output of Phase 5 of the build process: it evaluates the
current, officially supported Anthropic integration surfaces and states what
this app uses and why. It supersedes any assumption made before this research
pass — in particular, the assumption that a Claude.ai / Claude Pro
subscription can simply be reused by a web app.

## 0. The question the brief asked directly

> **Can this application use my existing Claude subscription directly, or
> must application usage use Anthropic API billing?**

**It must use Anthropic API billing. There is no officially supported way to
have a personal Claude.ai / Claude Pro (or Max) subscription authenticate or
pay for requests made by a custom third-party web application.**

What *does* exist, and why it doesn't apply here:

- **`ant auth login` / OAuth profiles** — a login flow for developer tooling
  (the `ant` CLI, Claude Code, the Claude Agent SDK) that stores a short-lived
  OAuth token instead of a static API key. It still bills against your
  **Anthropic API / Console workspace**, not against a claude.ai chat
  subscription's included usage. It's a convenience for *you, the developer,
  running tools on your own machine* — it is not a mechanism for a deployed
  web application to authenticate its own users or serve production traffic.
  Using it from a server that other people's (or even just "future browser
  session's") requests hit is also outside its intended use and would tie
  billing to your personal developer credentials.
- **Claude Code's subscription entitlement** — Claude Pro/Max subscriptions
  include usage specifically *inside Claude Code* (the CLI/IDE product), not
  a general-purpose API allowance you can redirect into your own backend.
- **Claude Agent SDK** — is Claude Code's harness packaged as a library. It's
  a different product from what this app needs (see §2) and, like Claude
  Code, is not the sanctioned way to spend a claude.ai subscription's
  included usage from inside a separate application.

**Conclusion:** this app calls the **Claude API (Messages API)** directly,
authenticated with a standard `ANTHROPIC_API_KEY`, billed per Anthropic API
pricing. That key lives server-side only (Route Handlers / Server Actions),
exactly as the brief requires ("never expose an Anthropic API key in
browser/client JavaScript").

## 1. Surfaces evaluated

| Surface | What it is | Verdict for this app |
|---|---|---|
| **A. Messages API** (`POST /v1/messages`) | The base request/response endpoint every other surface sits on top of. | **Used.** Everything below is built on it. |
| **B. Anthropic TypeScript SDK** (`@anthropic-ai/sdk`) | Official client: typed requests, streaming, retries, the Tool Runner helper. | **Used.** No reason to hand-roll HTTP against a documented, versioned SDK. |
| **C. Claude Agent SDK** (`@anthropic-ai/claude-agent-sdk`) | Claude Code's own harness (built-in file/bash/grep tools, subagents, permissions) packaged as a library, for building coding/filesystem agents on your own infra. | **Not used.** This app's Claude needs (reason over tasks/goals/calendar/training, propose scoped writes) are a normal tool-use agent over *our own* domain tools — not a filesystem/bash coding agent. Reaching for the Agent SDK here would mean fighting its built-in tools instead of using our service layer. Revisit only if a future feature genuinely needs a general-purpose coding/file agent. |
| **D. Tool use / function calling** | Claude calls tools you define; you execute them and return results. | **Used — this is the core mechanism.** See §4. |
| **E. Model Context Protocol (MCP)** | A protocol for exposing tools/resources to *any* MCP-capable client (Claude Desktop, Claude.ai connectors, other agents), and/or consuming external MCP servers. | **Evaluated, not built in v1 — architecture prepared for it.** See §6. |
| **F. Streaming** | Server-sent events for incremental responses. | **Used** for the chat panel; not needed for background/manual-trigger generations (daily overview, weekly review) where a single awaited response is simpler and the UI shows a spinner. |
| **G. Conversation/session persistence** | Where conversation history lives. | **Used** — `ai_conversations`/`ai_messages` tables (data-model.md), not the SDK's stateless nature alone. The API itself is stateless; persistence is our responsibility. |
| **H. Authentication & secret management** | How the app authenticates to Anthropic. | **`ANTHROPIC_API_KEY` as a server-only env var.** See §0 and §7. |
| **I. Cost** | Expected spend shape. | See §8. |
| **J. Claude OAuth/subscription auth for this app** | Whether claude.ai subscription auth is a valid path here. | **No — see §0.** |

## 2. Why not the Claude Agent SDK or Managed Agents

Both are legitimate Anthropic products; neither fits this app's shape:

- **Claude Agent SDK** ships a full coding-agent harness (Read/Write/Edit/
  Bash/Glob/Grep, subagents, permission system) intended for building
  developer/coding agents on your own infrastructure. Life OS's Claude needs
  are the opposite shape: a small, fixed set of *domain* tools
  (`get_tasks`, `create_task`, `get_calendar_events`, …) over structured
  data, not filesystem or shell access. Using it would mean disabling most
  of what it provides and bolting our own tools on anyway — plain Messages
  API + tool use is simpler and is what those custom tools would reduce to.
- **Managed Agents** (Anthropic-hosted agent loop + per-session sandbox) is
  built for long-running, autonomous, sandboxed work — the opposite of this
  app's approval-gated, synchronous, "propose then I click approve" model.
  It also adds infrastructure (agents, environments, sessions, vaults) this
  personal app doesn't need. If a future version wants a genuinely
  autonomous overnight planning agent, Managed Agents is worth revisiting —
  not for v1.

The right-sized answer here is **tier 2 from Anthropic's own guidance**:
*"Custom agent with your own tools → Claude API + tool use."* That's exactly
what §4 implements.

## 3. Models and configuration

- **Default model:** `claude-sonnet-5` — near-Opus quality on the planning/
  reasoning/agentic work this app needs (interpreting a week, proposing
  priorities, spotting patterns) at roughly a third of Opus pricing. This is
  a personal app paying for its own usage; Sonnet is the deliberate
  cost/quality balance point for that.
- **Escalation:** `claude-opus-5` available as a per-call override
  (`lib/ai/provider.ts` `model` param, surfaced later as a Settings toggle)
  for the heaviest reasoning if Sonnet's output isn't good enough on a given
  request — not wired to a UI control in v1, just supported by the
  abstraction so it's a config change, not a rewrite.
- **Thinking:** `{ type: "adaptive" }` on every call — Claude decides when
  extra reasoning is worth it; no fixed token budget to hand-tune.
- **Effort:** `output_config.effort = "medium"` as the default for
  interactive chat (fast, cost-aware), `"high"` for the Weekly Plan
  proposal and Weekly Review narrative specifically (worth the extra
  latency for a once-a-week, higher-stakes generation).
- **Streaming:** on for the chat panel (`client.messages.stream(...)`);
  off (single `create` call) for the manually-triggered daily overview and
  weekly review, which render as a finished block, not a typing effect.

## 4. Tool architecture

Claude never gets database access. It gets a fixed set of typed tools, each a
thin wrapper around one `lib/services/*.ts` function (technical-architecture
§3). Read tools and write tools are structurally different:

```ts
// lib/ai/tools/tasks.ts
export const getTasksTool = defineTool({
  name: "get_tasks",
  description: "Get the user's tasks, optionally filtered by status, due date range, or goal.",
  input: z.object({
    status: z.enum(["inbox", "todo", "in_progress", "completed", "cancelled"]).optional(),
    due_before: z.string().date().optional(),
    goal_id: z.string().uuid().optional(),
  }),
  kind: "read",
  handler: async (ctx, input) => getTasks(ctx.db, ctx.userId, input),
});

export const createTaskTool = defineTool({
  name: "create_task",
  description: "Propose creating a new task. Does not write the task directly — creates a pending AIAction for the user to approve.",
  input: z.object({
    title: z.string(),
    due_date: z.string().date().optional(),
    priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
    category_id: z.string().uuid().optional(),
    goal_id: z.string().uuid().optional(),
  }),
  kind: "write",
  handler: async (ctx, input) =>
    proposeAction(ctx.db, ctx.userId, {
      conversationId: ctx.conversationId,
      actionType: "create_task",
      payload: input,
      explanation: `Create task "${input.title}"${input.due_date ? ` due ${input.due_date}` : ""}.`,
    }),
});
```

`kind: "write"` is enforced by `defineTool`, not by convention: the tool
executor only ever calls `proposeAction(...)` for write-kind tools, which
inserts an `ai_actions` row (`status: 'proposed'`) and returns that row —
**it is structurally impossible for a write tool's handler to mutate
`tasks`/`goals`/`workouts`/etc. directly**, because those functions aren't in
scope inside a write-tool handler.

### v1 tool set

**Read (always available, freely called):**
`get_tasks`, `get_goal_progress`, `get_goals`, `get_calendar_events`,
`find_free_calendar_slots`, `get_training_history`, `get_training_plan`,
`get_weekly_context`, `get_routines`.

**Write (propose → approve → execute):**
`create_task`, `create_calendar_block`. These two are deliberately the "one
or two safe write tools with approval" the MVP scope in the brief calls for.
`update_task`, `complete_task`, `create_goal`, `update_goal`,
`create_workout`, `update_workout`, `set_weekly_priorities` follow the exact
same `proposeAction` pattern and are trivial additions post-MVP — the
mechanism doesn't change, only the roster grows.

### Approval execution

A second, narrow path — not a tool Claude calls — turns an approved
`ai_actions` row into a real write:

```ts
// lib/services/ai-actions.ts
export async function executeAction(db, userId, actionId: string) {
  const action = await getAction(db, userId, actionId); // must be status='approved'
  switch (action.action_type) {
    case "create_task":
      return createTask(db, userId, action.payload); // the *real* service fn
    case "create_calendar_block":
      return createCalendarBlock(db, userId, action.payload);
    // ...
  }
}
```

This function is called from a Server Action triggered by the user clicking
**Approve** in the UI — never automatically, never from inside the tool loop.

### Agentic loop

The SDK's **Tool Runner** (`client.beta.messages.toolRunner(...)`) drives the
read/write-propose loop — it is the documented, supported way to run a
custom-tool agent without hand-writing the `while (stop_reason === "tool_use")`
loop, and its per-turn hooks are enough for this app's needs (inspecting each
tool call, no need to intercept mid-flight beyond what "write tools only
propose" already guarantees structurally). A hand-rolled manual loop is not
needed unless a future requirement doesn't fit the Tool Runner's hooks.

## 5. Context construction (contextual retrieval, not "send everything")

`lib/ai/context-builder.ts` builds the system/context content per request
from a small, request-specific set of service calls — never a dump of the
whole schema. Two inputs shape it:

1. **Page scope** — the assistant panel knows which module it was opened
   from (`ai_conversations.context_scope`) and only offers that module's
   tools plus a small "global" set (today's date, `get_weekly_context`)
   unless the user's message clearly needs more (the Tool Runner still lets
   Claude call any tool in its list — scope is enforced by *which tools are
   in the list*, not by trusting Claude to self-restrict).
2. **Request shape** — "plan my training next week" resolves to training
   history + current plan + free calendar windows + confirmed training
   preferences; it does not pull unrelated tasks or notes. This mirrors the
   brief's own example precisely and is implemented as a small dispatch table
   from intent-shaped requests to the read tools that get pre-fetched into
   context vs. left for Claude to call on demand.

This is also the privacy boundary from the brief's §27 — minimum necessary
context per request, by construction, not by hoping Claude ignores what it
doesn't need.

## 6. MCP — two-way integration evaluation

**Evaluated. Not built in v1. Architecture is ready for it.**

The brief's own framing —
`LIFE OS ↕ MCP ↕ CLAUDE`, reachable both from Claude embedded in the app and
from Claude.ai/Claude Desktop directly — is exactly the shape MCP is for, and
it's exactly why §3 of technical-architecture.md insists every domain
operation lives in one service function: an MCP server for this app would be
a thin `@modelcontextprotocol/sdk` server whose tool handlers call the same
`lib/services/*.ts` functions the in-app Claude tools call. No business logic
gets written twice.

**Why not v1:** the brief is explicit — "do not implement insecure external
access simply because it is possible... first design the authentication and
permission model." An MCP server on this app means deciding, before writing
a line of server code:

- **Transport & exposure** — Streamable HTTP is the only viable transport for
  something Claude.ai/Claude Desktop can reach remotely (not local
  stdio) — which means a new authenticated public endpoint, not a detail to
  bolt on later.
- **Auth** — the MCP server would need its own token issuance (a personal
  access token scoped to this one user, generated in Settings, distinct from
  the Supabase session cookie the web app uses) — not reusing browser
  session auth, since the MCP client is Claude.ai/Desktop, not a browser.
- **Permission model** — whether an MCP-connected Claude gets the same
  read-freely/write-proposes-an-`ai_action` split as the in-app assistant
  (it should — same tables, same policy, no separate write path), and
  whether *any* write tools are exposed over MCP at all in a first pass, or
  read-only to start.
- **Blast radius** — a leaked personal access token is a different threat
  model than a leaked browser session (longer-lived, used from an
  unattended client) and needs its own revocation UI before it ships.

None of that is hard, but none of it is free either, and the MVP scope in the
brief (§30) doesn't call for it. The concrete extension point once it's
prioritized: `lib/mcp/server.ts`, one tool file per domain reusing
`lib/services/*.ts` and the same `proposeAction`/`executeAction` split as
§4, a `personal_access_tokens` table (schema not yet added — deliberately,
since it's unused until this ships), and a scoped-token auth middleware
alongside the existing Supabase-session middleware.

## 7. Secrets & security

- `ANTHROPIC_API_KEY` — server env var, read only inside `lib/ai/*` and the
  `app/api/assistant` route handler. Never passed to a Client Component,
  never included in any `NEXT_PUBLIC_*` variable.
- `SUPABASE_SERVICE_ROLE_KEY` — not used by the Claude integration at all;
  every service-layer call the assistant makes goes through the same
  RLS-scoped, session-bound Supabase client a normal Server Action would use
  (technical-architecture §9), so Claude is bound by the same row-level
  security as the user it's acting for — structurally, not by convention.
  Claude cannot see or write another user's data even if a tool call
  contained a bug, because Postgres enforces it.
- Tool arguments coming back from Claude are untrusted input and validated
  with the same `zod` schema used to define the tool (§4) before ever
  reaching a service function — an untrusted `goal_id` still has to pass RLS
  *and* schema validation.
- AI conversation logging (`ai_messages`) is off by default per user
  (Settings toggle) since it's personal data at rest; when on, it never logs
  the Anthropic API key or Supabase credentials, only conversation content,
  tool calls/arguments, and usage metadata (technical-architecture §11).

## 8. Cost

- Every deterministic operation (today's date, sorting, filtering, weekly
  arithmetic) runs in plain TypeScript — Claude is never called to do work
  code already does correctly and for free (brief §29).
- Claude is invoked for: interactive chat (`Cmd+J`), the manually-triggered
  daily overview, "plan my week"/"plan my training" style requests, and the
  weekly review narrative. None of these run on a timer or on every page
  load in v1 — all are user-triggered.
- Default model is Sonnet, not Opus (§3) — the single biggest cost lever,
  chosen deliberately over defaulting to the strongest model everywhere.
- Prompt caching is applied to the stable parts of the system prompt (tool
  definitions, instructions) via `cache_control`, since those bytes repeat
  identically across a user's requests within a session.
- Token usage per call is logged (`ai_messages.input_tokens`/
  `output_tokens`) so a Settings → AI Usage view is a query away later
  without new instrumentation.

## 9. Summary decision table

| Question from the brief | Answer |
|---|---|
| Messages API vs. TS SDK vs. Agent SDK vs. tool use vs. MCP | Messages API + TS SDK + tool use, in v1. Agent SDK not used (§2). MCP designed for, not built (§6). |
| Streaming | Yes, for the interactive assistant panel; not for manual-trigger single-shot generations. |
| Conversation/session persistence | App-owned tables (`ai_conversations`/`ai_messages`), not SDK/session state. |
| Auth & secrets | Server-only `ANTHROPIC_API_KEY`; RLS-scoped Supabase client for every tool call. |
| API cost | Sonnet default, user-triggered calls only, deterministic work stays in code, usage logged. |
| Reuse claude.ai/Pro subscription? | **No — not officially supported for this architecture.** Use API billing (§0). |
