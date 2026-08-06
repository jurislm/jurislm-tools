# JT Flow One Team Mode Dispatch

## Purpose

Define how `jt-flow-one` detects Claude Code's experimental Agent Teams
capability exactly once per run and how its two existing
Workflow-tool-mandated dispatch points (the three-tool research trio and the
Step 5 code-review dispatch) use that capability — wrapping the existing
`Workflow` tool call in a named agent when available, and leaving dispatch
unchanged on hosts or invocations where team mode is unavailable (Codex,
unflagged Claude Code, or a `jt-flow-all`-delegated nested run).

## Requirements

### Requirement: Team-mode availability is detected once per run before any dispatch

`jt-flow-one` SHALL determine team-mode availability exactly once, before the
first dispatch point in a run, and SHALL reuse that recorded outcome for
every subsequent dispatch point in the same run without re-checking.

#### Scenario: Detection happens before the three-tool research dispatch

- **WHEN** `jt-flow-one` begins a run and reaches the pre-flight checks
- **THEN** it records a team-mode availability outcome before spawning any
  three-tool research agent, and every later dispatch point in the same run
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

### Requirement: The Workflow-tool-mandated pattern is wrapped, not replaced, when team mode is available

`jt-flow-one` has exactly two existing dispatch points governed by the
global multi-agent policy's 2+ parallel-angle rule: the three-tool research
trio (Context7/Exa/Firecrawl) and the Step 5 code-review dispatch. When
team mode is recorded as available, each of the two SHALL independently
spawn its own named wrapper agent (`model: sonnet`, tool allowlist
including the `Workflow` tool), and instruct that wrapper to carry out the
dispatch by calling the `Workflow` tool per the existing rule. `jt-flow-one`
MUST NOT replace either `Workflow` tool call with multiple manually-spawned
named agents. This requirement is expressed once, in a shared section,
rather than by editing each call site's own existing paragraph.

#### Scenario: Three-tool research dispatch wraps the Workflow tool call

- **WHEN** team mode is available and `jt-flow-one` reaches the three-tool
  research dispatch point
- **THEN** `jt-flow-one` spawns one named wrapper agent with `Workflow` tool
  access, and that wrapper — not `jt-flow-one` itself — issues the
  `Workflow` tool call for the research fan-out

#### Scenario: Code review dispatch wraps the Workflow tool call

- **WHEN** team mode is available and `jt-flow-one` reaches the Step 5
  code-review dispatch point
- **THEN** `jt-flow-one` spawns one named wrapper agent with `Workflow` tool
  access, and that wrapper — not `jt-flow-one` itself — issues the
  `Workflow` tool call for the review

#### Scenario: Manual multi-agent replacement is prohibited

- **WHEN** team mode is available and `jt-flow-one` reaches either the
  three-tool research or the Step 5 code-review dispatch point
- **THEN** `jt-flow-one` does not spawn multiple manually-named agents, one
  per angle, in place of the `Workflow` tool call

### Requirement: Dispatch is unchanged when team mode is unavailable

When team mode is recorded as unavailable, `jt-flow-one` SHALL call the
`Workflow` tool directly, from the current session, for both the
three-tool research dispatch and the Step 5 code-review dispatch — exactly
as it did before this capability existed.

#### Scenario: Codex host

- **WHEN** `jt-flow-one` runs on a host without `SendMessage`/`TaskCreate`/`TaskList`
  tool support
- **THEN** both dispatch points call the `Workflow` tool directly, unchanged
  from prior behavior

#### Scenario: Unflagged Claude Code

- **WHEN** `jt-flow-one` runs on Claude Code without
  `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`
- **THEN** both dispatch points call the `Workflow` tool directly, unchanged
  from prior behavior
