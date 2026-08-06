## Why

`jt-flow-one`'s internal agent dispatch is always anonymous: once a helper
agent is spawned in the background, the caller can only wait for its
completion notification — no live check-in or mid-run redirection. Claude
Code's experimental Agent Teams feature (named agents + `SendMessage`)
removes that limitation where available, but `jt-flow-one` must keep running
unmodified on Codex, which has no peer-to-peer equivalent.

Closes #192.

## What Changes

- Add a one-time detection step (near the existing pre-flight checks) that
  determines whether team-mode dispatch is usable this run: unavailable if
  this invocation is a `jt-flow-all`-delegated nested run (Agent Teams has no
  nested teams); otherwise available only if
  `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` **and** the
  `SendMessage`/`TaskCreate`/`TaskList` tool schemas load successfully.
- When available: single-purpose dispatches (the three-tool research trio,
  `systematic-debugging` escalation, the read-only Opus consult) spawn with
  an explicit name, addressable via `SendMessage` mid-run.
- When available: the existing Workflow-tool-mandated 2+ parallel-angle +
  adversarial-verify pattern (e.g. code review) spawns **one** named wrapper
  agent that itself calls the `Workflow` tool per the existing rule — not
  several manually-spawned named agents replacing it.
- When unavailable (Codex, unflagged Claude Code, or a nested run):
  dispatch is unchanged.

## Capabilities

### New Capabilities
- `jt-flow-one-team-mode-dispatch`: detection order, the dual env+tool
  condition, the "wrap, don't replace" rule for the Workflow-tool-mandated
  pattern, and the no-op fallback path.

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
  Workflow-tool mandate for 2+ parallel-angle + verify stays in force inside
  the wrapper.
- Codex-specific instructions — Codex's default subagent delegation already
  handles "spawn an agent to do X" without a dedicated branch.
