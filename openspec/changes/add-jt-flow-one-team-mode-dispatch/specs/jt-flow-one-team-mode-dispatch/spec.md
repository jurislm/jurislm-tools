## ADDED Requirements

### Requirement: Team-mode availability is detected once per run before any dispatch

`jt-flow-one` SHALL determine team-mode availability exactly once, before the
first dispatch point in a run, and SHALL reuse that recorded outcome for
every subsequent dispatch point in the same run without re-checking.

#### Scenario: Detection happens before Step 0's research dispatch

- **WHEN** `jt-flow-one` begins a run and reaches the pre-flight checks
- **THEN** it records a team-mode availability outcome before spawning any
  Step 0 research agent, and every later dispatch point in the same run
  reads that recorded outcome instead of re-evaluating it

### Requirement: A jt-flow-all-delegated run never attempts team-mode dispatch

`jt-flow-one` SHALL check whether the current invocation carries
`jt-flow-all`'s Queue execution contract delegated fields (change
identifier, proposal path, issue identifier, target repository, approved
scope, durable proposal GO evidence) before evaluating any other condition.
If those fields are present, `jt-flow-one` MUST record team mode as
unavailable and MUST NOT evaluate the environment-variable or tool-schema
condition.

#### Scenario: Delegated run skips the capability check entirely

- **WHEN** `jt-flow-one` is invoked with `jt-flow-all`'s Queue execution
  contract delegated fields present, in an environment where
  `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` and the
  `SendMessage`/`TaskCreate`/`TaskList` tool schemas would otherwise resolve
- **THEN** `jt-flow-one` records team mode as unavailable for the run and
  does not check the environment variable or the tool schemas

### Requirement: The capability check requires both the feature flag and the addressing tools

When not delegated, `jt-flow-one` SHALL record team mode as available only
if `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` resolves to `1` **and** the
`SendMessage`, `TaskCreate`, and `TaskList` tool schemas all load
successfully. Either condition failing MUST record team mode as
unavailable.

#### Scenario: Flag set but addressing tools unavailable

- **WHEN** `jt-flow-one` is not delegated, `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`
  resolves to `1`, and any of `SendMessage`, `TaskCreate`, or `TaskList`
  fails to load
- **THEN** `jt-flow-one` records team mode as unavailable for the run

#### Scenario: Addressing tools available but flag unset

- **WHEN** `jt-flow-one` is not delegated, `SendMessage`, `TaskCreate`, and
  `TaskList` all load successfully, and `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`
  does not resolve to `1`
- **THEN** `jt-flow-one` records team mode as unavailable for the run

#### Scenario: Both conditions hold

- **WHEN** `jt-flow-one` is not delegated, `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`
  resolves to `1`, and `SendMessage`, `TaskCreate`, and `TaskList` all load
  successfully
- **THEN** `jt-flow-one` records team mode as available for the run

### Requirement: Single-purpose dispatch is named and addressable when team mode is available

When team mode is recorded as available, `jt-flow-one` SHALL spawn each
single-purpose dispatch (the three-tool research trio, `systematic-debugging`
escalation, the read-only Opus consult) with an explicit name, and MAY send
it follow-up instructions via `SendMessage` before it completes. Existing
model-tier rules (sonnet by default, the read-only Opus-consult exception)
remain unchanged by this requirement.

#### Scenario: Named research dispatch

- **WHEN** team mode is available and `jt-flow-one` dispatches the
  three-tool research trio
- **THEN** each research agent is spawned with an explicit name and remains
  addressable via `SendMessage` until it completes

### Requirement: The Workflow-tool-mandated pattern is wrapped, not replaced, when team mode is available

When team mode is recorded as available and a dispatch point is governed by
the global multi-agent policy's 2+ parallel-angle + adversarial-verify rule
(e.g. code review), `jt-flow-one` SHALL spawn exactly one named wrapper
agent with a tool allowlist that includes the `Workflow` tool, and instruct
that wrapper to carry out the review by calling the `Workflow` tool per the
existing rule. `jt-flow-one` MUST NOT replace that `Workflow` tool call with
multiple manually-spawned named agents.

#### Scenario: Code review dispatch wraps the Workflow tool call

- **WHEN** team mode is available and `jt-flow-one` reaches a dispatch point
  governed by the 2+ parallel-angle + adversarial-verify rule
- **THEN** `jt-flow-one` spawns one named wrapper agent with `Workflow` tool
  access, and that wrapper — not `jt-flow-one` itself — issues the
  `Workflow` tool call

#### Scenario: Manual multi-agent replacement is prohibited

- **WHEN** team mode is available and `jt-flow-one` reaches a dispatch point
  governed by the 2+ parallel-angle + adversarial-verify rule
- **THEN** `jt-flow-one` does not spawn multiple manually-named agents, one
  per angle, in place of the `Workflow` tool call

### Requirement: Dispatch is unchanged when team mode is unavailable

When team mode is recorded as unavailable, `jt-flow-one` SHALL dispatch
every single-purpose task anonymously and SHALL call the `Workflow` tool
directly for the 2+ parallel-angle + adversarial-verify pattern, exactly as
it did before this capability existed.

#### Scenario: Codex host

- **WHEN** `jt-flow-one` runs on a host without `SendMessage`/`TaskCreate`/`TaskList`
  tool support
- **THEN** all dispatch — single-purpose and the Workflow-tool-mandated
  pattern — proceeds anonymously, unchanged from prior behavior

#### Scenario: Unflagged Claude Code

- **WHEN** `jt-flow-one` runs on Claude Code without
  `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`
- **THEN** all dispatch proceeds anonymously, unchanged from prior behavior
