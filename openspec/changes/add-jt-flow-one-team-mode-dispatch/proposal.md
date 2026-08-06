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
- When available: both of `jt-flow-one`'s existing 2+ parallel-angle
  dispatch points — the three-tool research trio (already instructed to use
  the `Workflow` tool "而非手動散派" once 2+ angles are involved) and the
  Step 5 code-review dispatch (routed to the `Workflow` tool by the global
  policy's own judgment criteria) — each independently spawn their own named
  wrapper agent (`model: sonnet`) that itself calls the `Workflow` tool per
  the existing rule, instead of the current session calling `Workflow`
  directly. Not several manually-spawned named agents replacing the
  `Workflow` call.
- When unavailable (Codex, unflagged Claude Code, or a nested run):
  dispatch is unchanged.

Note: brainstorming assumed a second dispatch category — single-purpose
one-off agents (e.g. a debugging escalation, a read-only consult) that
would be named directly rather than wrapped. Implementation found no such
call site in `jt-flow-one/SKILL.md`: every existing multi-agent dispatch
point already falls under the 2+-angle → `Workflow` tool rule, so there is
only one behavior to add, applied at two existing call sites.

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
