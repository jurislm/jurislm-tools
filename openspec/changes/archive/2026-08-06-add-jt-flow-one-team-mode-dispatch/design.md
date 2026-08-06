## Context

`jt-flow-one`'s internal agent dispatch is always anonymous today. Its two
existing multi-agent dispatch points both already fall under the same
2+-parallel-angle rule: the three-tool research trio's own text says to use
the `Workflow` tool "而非手動散派" once 2+ angles are involved (Context7 +
Exa + Firecrawl = 3), and the Step 5 code-review dispatch is routed to the
`Workflow` tool by the same global judgment criteria applied elsewhere.
There is no separate single-purpose, non-parallel dispatch call site in the
current text (checked via `grep` for `opus`, `諾詢`, `諮詢`, `求援`,
`systematic-debugging` — the only matches are in-session skill invocations,
not agent dispatch). Claude Code ships an
experimental Agent Teams feature (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`):
named, addressable agents plus `SendMessage` for direct mid-run messaging.
`jt-flow-one` must also keep running unmodified on Codex and on Claude Code
sessions without the flag. Research (full evidence trail in
`docs/superpowers/specs/2026-08-06-jt-flow-one-team-mode-dispatch-design.md`)
confirmed Codex's native multi-agent mechanism is hub-and-spoke ("Subagent
workflow") with no peer-to-peer messaging or shared task list, and that
community claims of a shipped Codex "team mode" do not hold up: an unmerged
PR, an open feature request, and a personal fork, none of which are the
shipped product.

## Goals / Non-Goals

**Goals:**
- Detect team-mode availability once per run, correctly and portably, as
  groundwork `jt-flow-one` can act on — today or in a future dispatch point.
- Preserve the existing global `~/.claude/CLAUDE.md` rule that 2+
  parallel-angle + adversarial-verify dispatch must go through the
  `Workflow` tool, unconditionally.

**Non-Goals:**
- Changing `jt-flow-all`'s dispatch/coordination mechanism.
- Editing the global `~/.claude/CLAUDE.md` policy file.
- Writing Codex-specific branch instructions.
- A capability probe more elaborate than one env-var + tool-schema check per
  run.

## Decisions

### Detection order: nested check before capability check

Agent Teams has no nested-team support — a teammate cannot itself spawn
teammates. A `jt-flow-one` run delegated by `jt-flow-all` carries the Queue
execution contract's delegated fields (change identifier, proposal path,
issue identifier, target repository, approved scope, durable proposal GO
evidence); their presence is checked first and, if present, short-circuits
detection to "unavailable" — the env/tool check below is skipped entirely
rather than evaluated and then overridden.

**Alternative considered**: check env/tool first, nested-status second.
Rejected — this would make the nested exclusion a second gate that could be
forgotten or bypassed if the capability check changes later; checking nested
status first makes it structurally impossible to reach the capability check
while nested.

### Dual condition for the capability check, not either alone

Both `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` and successful `ToolSearch`
resolution of `SendMessage`/`TaskCreate`/`TaskList` must hold before team
mode is used.

**Alternative considered**: env var alone. Rejected — the flag could be set
in an environment where these specific tool names are unavailable for an
unrelated reason, and a Bash-only check can't confirm the tools that
`SendMessage`-based addressing actually depends on.

**Alternative considered**: tool-schema check alone. Rejected — tool-schema
availability was only validated in one live session during this design's own
research; relying on it alone, without the documented feature flag as a
corroborating signal, is weaker evidence for a policy encoded into a
widely-installed marketplace skill.

### The Workflow-tool-mandated dispatch points are left unchanged; detection has no current effect on them

For each of the two 2+-angle dispatch points, behavior does not depend on
the recorded team-mode outcome: both always call the `Workflow` tool
directly, from the current session, exactly as before this change.

**Alternative considered (this change's own original design, shipped and
then corrected)**: spawn one named wrapper agent per call site, with
instructions to call `Workflow` internally. **Rejected after verification
found it infeasible**: dispatching a probe agent and inspecting its tool
list (both top-level and `ToolSearch`-deferred) confirmed the `Workflow`
tool is not exposed to spawned agents at all — only to the top-level
session. This was never actually possible, on any host, at any point; the
original design shipped, was reviewed twice, merged, and released (v1.36.0)
without this assumption ever being tested. A second-round CodeRabbit CLI
review on the follow-up archival PR caught it.

Beyond infeasibility, the wrapper would have been unnecessary even if it
worked: team mode is only ever recorded as available when `jt-flow-one` is
*not* a nested, delegated run — meaning whenever the wrapper's precondition
would hold, `jt-flow-one` already **is** the top-level session, already has
direct `Workflow` access, and is already the thing a caller can address
directly (send it a new message) without any wrapper. The nested-exclusion
rule (this design's own first decision) and the "wrapper needed" premise are
mutually exclusive by construction — the one case where a wrapper could add
value (a delegated, nested `jt-flow-one`) is exactly the case team mode is
defined as unavailable.

**Alternative considered**: replace the `Workflow` tool call with several
manually-spawned named agents, one per angle. Still rejected, independent of
the above — this is the exact anti-pattern the global `~/.claude/CLAUDE.md`
rule exists to prevent (it loses schema validation, dedup-before-verify, and
budget tracking), and reproducing it here would contradict a standing,
evidence-based correction already recorded for this workflow.

**Correction found during implementation** (unrelated to the wrapper
infeasibility above, found earlier in the same implementation pass):
brainstorming had assumed a second, separate behavior for "single-purpose"
one-off dispatch (naming the agent directly, no `Workflow` call to
preserve). Re-reading `jt-flow-one/SKILL.md` while writing the task list
found no call site matching that description — both existing dispatch
points are 2+-angle and already Workflow-tool-governed. There is currently
no dispatch point where team-mode detection changes anything; the detection
logic (nested check, dual condition) is retained as groundwork for a future
dispatch point that would not need `Workflow` access, expressed once in a
shared new section rather than by editing either call site's own existing
paragraph.

## Risks / Trade-offs

- [Risk] The detection logic currently has no dispatch point to apply to, so
  it ships as inert groundwork rather than user-visible behavior — it could
  bit-rot (silently stop matching reality) before any future dispatch point
  ever exercises it. → [Mitigation] the validation test suite asserts the
  detection wording directly against `SKILL.md`, independent of whether
  anything currently branches on it, so drift in the detection text itself
  is still caught even with no behavioral consumer yet.
- [Risk] The `SendMessage`/`TaskCreate`/`TaskList` detection has only been
  exercised on one Claude Code session with the flag enabled; it has not
  been observed on Codex or on a flag-off Claude Code session. →
  [Mitigation] the fallback path (unnamed dispatch) is identical to today's
  behavior, so a false negative only forgoes future groundwork, not current
  behavior. A false positive requires same-named tools with different
  semantics to exist on some future host — `ToolSearch` only confirms the
  tool schemas resolve, not that they carry Agent Teams' actual
  addressing/messaging semantics; this is a real, currently-unmitigated risk
  worth noting for whoever eventually builds the dispatch point that
  consumes this detection.
- [Risk] Detecting "nested under `jt-flow-all`" by checking for the Queue
  execution contract's delegated fields depends on `jt-flow-all` continuing
  to pass those fields; if a future `jt-flow-all` change omits one, a nested
  run could be misdetected as top-level. → [Mitigation] out of scope for
  this change to harden further; flagged here since `jt-flow-all`'s own
  SKILL.md is the authoritative source for what fields it always passes.
  Lower stakes than originally recorded: since detection currently drives no
  behavior, a misdetection here has no live consequence until a future
  dispatch point actually consumes it.
