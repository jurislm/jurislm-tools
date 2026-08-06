# JT Flow One Team-Mode Dispatch Design

> **Superseded detail**: this document predates implementation. Every
> mention below of a "single-purpose dispatch" category (`systematic-
> debugging` escalation, a read-only Opus consult) was found, while writing
> `tasks.md`, to have no corresponding call site in
> `plugins/jt-flow/skills/jt-flow-one/SKILL.md` — those are only invoked
> in-session, never dispatched as a separate agent.
>
> **Second superseded detail, found after merge**: this document's
> "wrap the `Workflow` tool call in a named agent" mechanism (below and in
> the first `design.md`) shipped, merged, and released as v1.36.0 before
> verification proved it infeasible — a spawned agent has no access to the
> `Workflow` tool at all (confirmed by dispatching a probe agent and
> checking its tool list). Because team mode is only ever recorded as
> available when `jt-flow-one` is *not* nested/delegated, availability
> implies `jt-flow-one` already is the top-level session with direct
> `Workflow` access and native addressability — the wrapper was both
> infeasible and, even if it worked, unnecessary. The corrected design has
> **no behavior change** for either of `jt-flow-one`'s two dispatch points;
> detection is retained only as groundwork for a future dispatch point that
> would not need `Workflow` access. See
> `openspec/changes/archive/2026-08-06-add-jt-flow-one-team-mode-dispatch/design.md`
> (or the synced living spec at
> `openspec/specs/jt-flow-one-team-mode-dispatch/spec.md`) for the fully
> corrected, authoritative version.

## Goal

Give `jt-flow-one` a portable way to make its own internal agent dispatch
addressable and interruptible in real time ("team mode") on hosts where that
capability exists, while leaving today's dispatch mechanism — and the
existing multi-angle-review Workflow-tool mandate — completely intact
everywhere else, including on Codex, where no peer-to-peer equivalent exists.

Scope: `jt-flow-one` only. `jt-flow-all`'s own queue-coordination dispatch is
out of scope.

## Background / Research

- Claude Code Agent Teams (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`): named,
  addressable agents; `SendMessage` for direct mid-run messaging; a shared
  task list. Documented limitation: no nested teams — a teammate cannot
  itself spawn teammates.
- Codex's native multi-agent mechanism ("Subagent workflow",
  `developers.openai.com/codex/concepts/subagents`, fetched directly
  2026-08-06) is hub-and-spoke: the parent thread spawns subagents, waits for
  all, and consolidates results. `/agent` lets a user inspect or steer a
  subagent thread, but only by routing through the parent thread — there is
  no subagent-to-subagent messaging and no cross-agent shared task list.
- Community signals suggesting Codex has since added a native "team" concept
  were checked and do not hold up: GitHub PR `openai/codex#13155` ("persist
  native teams and add team task tools") is closed, unmerged (`mergedAt:
  null`). GitHub issue `openai/codex#21027` ("Shared workspace/message bus
  for Codex subagents") remains open as of 2026-08-06, explicitly stating no
  first-class shared inbox exists. A third source describing "native team
  mode" turned out to be a personal fork, not the shipped product.
  Conclusion: Codex has no Agent-Teams equivalent. Its existing Subagent
  workflow is already the closest analog and needs no `jt-flow-one` change —
  the same "spawn an agent to do X" instruction text already triggers
  Codex's native delegation on that host.

## Design

### Detection (once per run, before any dispatch)

Add a check near the existing "前置環境檢查" step, evaluated once and reused
for the rest of the run:

1. If this invocation carries `jt-flow-all`'s Queue execution contract fields
   (change identifier, proposal path, issue identifier, target repository,
   approved scope, durable proposal GO evidence) — i.e. `jt-flow-one` is
   running as a delegated owner — team mode is unavailable regardless of the
   checks below. Agent Teams has no nested-team support.
2. Otherwise, check both: `echo "$CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS"`
   returns `1`, **and** the `SendMessage`, `TaskCreate`, `TaskList` tool
   schemas load successfully (e.g. via `ToolSearch`). Both must hold. If
   either fails — including on Codex, which has none of these — team mode is
   unavailable.

Record the outcome once; do not re-check per dispatch call within the same
run.

### When team mode is available

`jt-flow-one` has exactly two existing dispatch points governed by the
global `~/.claude/CLAUDE.md` 2+ parallel-angle rule: the Context7/Exa/
Firecrawl research trio, and the Step 5 code-review dispatch (routed to the
`Workflow` tool via that same global rule, even though `SKILL.md` doesn't
spell "Workflow" out at that specific call site). There is no separate
single-purpose, non-parallel dispatch call site — `systematic-debugging`
and an Opus consult are only ever invoked in-session, never as a separate
spawned agent.

For both of the two real call sites: do **not** replace the `Workflow` tool
call with several manually-spawned named agents; that would reproduce the
exact anti-pattern the global rule was written to stop. Instead, each
independently spawns **one** named agent (`model: sonnet`) whose
instructions are to carry out that dispatch using the existing
Workflow-tool-mandated process; the `Workflow` tool call happens inside
that named agent, unchanged. The wrapper adds an addressable handle; it
does not touch what runs inside it. The wrapper must be spawned with a
tool allowlist that includes the `Workflow` tool (e.g. `general-purpose`
or an equivalent unrestricted type) — a wrapper that cannot call
`Workflow` itself would collapse back into the anti-pattern this design
exists to avoid.

No change to the global `~/.claude/CLAUDE.md` multi-agent dispatch policy is
needed — it continues to govern what happens inside each named wrapper
exactly as it does today.

### When team mode is unavailable

Dispatch is unchanged: both dispatch points call the `Workflow` tool
directly, from the current session, exactly as before this capability
existed. This is the path Codex always takes, and the path Claude Code
takes without the experimental flag or when nested under `jt-flow-all`.

## File Impact

- `plugins/jt-flow/skills/jt-flow-one/SKILL.md` — add one new shared
  section near "前置環境檢查" covering detection and naming both existing
  dispatch points (the three-tool research trio, Step 5's code-review
  dispatch) by reference, per the rules above, without editing either call
  site's own existing paragraph.
- `plugins/jt-flow/README.md` — mirror a short paragraph describing the
  detection rule and the two branches, matching the existing mirroring
  convention used for other `jt-flow-one` policy sections.
- `CLAUDE.md` (repository root) — mirror the same short paragraph in the
  OpenSpec/jt-flow section.
- `openspec/specs/` — new capability spec (e.g.
  `jt-flow-one-team-mode-dispatch`), since this doesn't belong to any of the
  three existing jt-flow specs (`jt-flow-authorization`,
  `jt-flow-queue-delegation`, `jt-flow-review-orchestration`). Requirements:
  detection order (nested check first), the dual env+tool condition, the
  "wrap, don't replace" rule for the Workflow-tool-mandated pattern, and the
  no-op unavailable path. Delivered as this change's delta spec under
  `openspec/changes/<change-name>/specs/jt-flow-one-team-mode-dispatch/spec.md`
  per this repository's convention of not touching the living spec until
  archive.
- `scripts/` — new test file (e.g. `jt-flow-team-mode-dispatch.test.mjs`),
  following the existing pattern of the three sibling test files, asserting:
  the nested-check-first ordering, the dual-condition wording, and that the
  Workflow-tool-mandated pattern's SKILL.md text still names the `Workflow`
  tool (i.e. the test fails if a future edit silently deletes the "wrap,
  don't replace" instruction).

## Non-goals

- Any change to `jt-flow-all`'s own dispatch or coordination mechanism.
- Any change to the global `~/.claude/CLAUDE.md` multi-agent dispatch
  policy.
- Building Codex-specific instructions — Codex's existing default
  subagent-delegation behavior already handles `jt-flow-one`'s "spawn an
  agent to do X" instructions without a dedicated branch.
- A capability probe more elaborate than the env-var + tool-schema check
  (e.g. no attempt to detect *which* Claude Code version, and no mid-run
  re-check — the environment does not change within one run).

## Risk Accepted

The detection check (`ToolSearch` for `SendMessage`/`TaskCreate`/`TaskList`)
has only been confirmed working on one session (Claude Code, flag on); it
has not been validated on a Codex host or on a non-experimental Claude Code
session. If a future host exposes tools under those same names for an
unrelated purpose, the check could misfire. This is accepted because the
fallback path (unnamed dispatch) is harmless even if mistakenly taken on a
team-mode-capable host — the only cost is losing the addressability upside,
not a functional break.
