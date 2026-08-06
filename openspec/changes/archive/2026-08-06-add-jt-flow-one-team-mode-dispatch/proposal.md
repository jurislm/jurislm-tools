## Why

`jt-flow-one`'s internal agent dispatch is always anonymous: once a helper
agent is spawned in the background, the caller can only wait for its
completion notification — no live check-in or mid-run redirection. Claude
Code's experimental Agent Teams feature (named agents + `SendMessage`)
removes that limitation where available, but `jt-flow-one` must keep running
unmodified on Codex, which has no peer-to-peer equivalent.

**Post-merge finding**: `jt-flow-one` has no dispatch point this actually
applies to today. Both of its existing multi-agent dispatch points are
routed through the `Workflow` tool, which is only callable from the
top-level session — a spawned agent cannot call it (verified empirically
after the original merge). Team mode is also only ever recorded as
available when `jt-flow-one` is *not* a nested/delegated run, which means
whenever it would be available, `jt-flow-one` already is the top-level
session — already addressable directly, with no wrapper needed. See What
Changes below for what this change ended up actually delivering: detection
only, retained as groundwork, no current behavior change.

Closes #192.

## What Changes

- Add a one-time detection step (near the existing pre-flight checks) that
  determines whether team-mode dispatch is usable this run: unavailable if
  this invocation is a `jt-flow-all`-delegated nested run (Agent Teams has no
  nested teams); otherwise available only if
  `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` **and** the
  `SendMessage`/`TaskCreate`/`TaskList` tool schemas load successfully.
- **Originally shipped, then corrected**: the first version of this change
  had both of `jt-flow-one`'s 2+ parallel-angle dispatch points (the
  three-tool research trio and Step 5 code review) spawn a named wrapper
  agent to call `Workflow` internally when team mode was available. This
  shipped, merged, and released as v1.36.0 before a second-round CodeRabbit
  CLI review (on the follow-up archival PR) prompted verification that
  proved it infeasible — see Why above and `design.md`'s corresponding
  Decision for the full reasoning.
- **What actually ships**: both dispatch points call the `Workflow` tool
  directly, from the current session, regardless of the recorded team-mode
  outcome — unchanged from before this change existed. The detection logic
  itself is retained as groundwork for a future dispatch point that would
  not need `Workflow` access.

Note: brainstorming had also assumed a second dispatch category —
single-purpose one-off agents (e.g. a debugging escalation, a read-only
consult) that would be named directly. Implementation found no such call
site in `jt-flow-one/SKILL.md`: every existing multi-agent dispatch point
already falls under the 2+-angle → `Workflow` tool rule.

## Capabilities

### New Capabilities
- `jt-flow-one-team-mode-dispatch`: detection order, the dual env+tool
  condition, and confirmation that the Workflow-tool-mandated pattern is
  unaffected by (and does not need) that detection today.

### Modified Capabilities
(none — this does not change the requirements of `jt-flow-authorization`,
`jt-flow-queue-delegation`, or `jt-flow-review-orchestration`; it adds an
orthogonal dispatch-mechanism layer alongside them)

## Impact

Affects the `jt-flow` plugin only (`jt-flow-one` Skill; `jt-flow-all`
untouched). Files: `plugins/jt-flow/skills/jt-flow-one/SKILL.md`,
`plugins/jt-flow/README.md`, repository `CLAUDE.md`, a new
`scripts/*.test.mjs` validation test. No MCP server, dependency, or
version-managed manifest changes.

## Non-goals

- Changing `jt-flow-all`'s own dispatch/coordination mechanism.
- Changing the global `~/.claude/CLAUDE.md` multi-agent dispatch policy — the
  Workflow-tool mandate for 2+ parallel-angle + verify stays in force,
  unconditionally, for both of `jt-flow-one`'s dispatch points.
- Codex-specific instructions — Codex's default subagent delegation already
  handles "spawn an agent to do X" without a dedicated branch.
