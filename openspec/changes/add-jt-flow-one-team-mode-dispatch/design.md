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
- Let `jt-flow-one` make its dispatched agents addressable and interruptible
  on hosts that support it, with zero behavior change on hosts that don't.
- Preserve the existing global `~/.claude/CLAUDE.md` rule that 2+
  parallel-angle + adversarial-verify dispatch must go through the
  `Workflow` tool.

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

### Wrap the Workflow-tool-mandated pattern in one named agent; don't replace it

For the 2+ parallel-angle + adversarial-verify pattern, spawn one named agent
whose own instructions are to call the `Workflow` tool exactly as the
existing rule requires. The wrapper must use a tool allowlist that includes
`Workflow` (e.g. `general-purpose`).

**Alternative considered**: replace the `Workflow` tool call with several
manually-spawned named agents, one per angle. Rejected — this is the exact
anti-pattern the global `~/.claude/CLAUDE.md` rule exists to prevent (it
loses schema validation, dedup-before-verify, and budget tracking), and
reproducing it here would contradict a standing, evidence-based correction
already recorded for this workflow.

**Alternative considered**: leave the Workflow-tool-mandated pattern's
dispatch fully unchanged (no wrapper at all) even when team mode is
available. Simpler, but rejected per explicit confirmation during
brainstorming that every dispatch point should gain the addressable wrapper
when available, provided the `Workflow` tool call inside it stays intact.

**Correction found during implementation**: brainstorming had assumed a
second, separate behavior for "single-purpose" one-off dispatch (naming the
agent directly, no wrapper needed, since there's no `Workflow` call to
preserve). Re-reading `jt-flow-one/SKILL.md` while writing the task list
found no call site matching that description — both existing dispatch
points are 2+-angle and already Workflow-tool-governed. The single "wrap,
don't replace" rule is therefore this change's only behavior, applied at
its two existing call sites (the three-tool research trio, and Step 5 code
review) via one shared new section rather than editing each call site's own
paragraph — this avoids touching either paragraph's existing, already
carefully-worded text.

## Risks / Trade-offs

- [Risk] The wrapper agent could be spawned with a restricted-tool subagent
  type that lacks `Workflow` tool access, silently collapsing back into
  unstructured manual dispatch — for either the three-tool research trio or
  Step 5 code review. → [Mitigation] SKILL.md wording explicitly requires an
  unrestricted tool allowlist (e.g. `general-purpose`) for this specific
  wrapper; the new spec's scenario for this decision names the requirement
  directly so the validation test can assert the wording is present.
- [Risk] The `SendMessage`/`TaskCreate`/`TaskList` detection has only been
  exercised on one Claude Code session with the flag enabled; it has not
  been observed on Codex or on a flag-off Claude Code session. →
  [Mitigation] the fallback path (unnamed dispatch) is identical to today's
  behavior, so a false negative only forgoes the addressability upside — it
  does not break dispatch. A false positive is not possible without the
  tools genuinely resolving via `ToolSearch`.
- [Risk] Detecting "nested under `jt-flow-all`" by checking for the Queue
  execution contract's delegated fields depends on `jt-flow-all` continuing
  to pass those fields; if a future `jt-flow-all` change omits one, a nested
  run could be misdetected as top-level and attempt team-mode dispatch in
  violation of the no-nested-teams constraint. → [Mitigation] out of scope
  for this change to harden further; flagged here since `jt-flow-all`'s own
  SKILL.md is the authoritative source for what fields it always passes.
