## ADDED Requirements

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

### Requirement: The Workflow-tool-mandated dispatch points are unaffected by team-mode detection

`jt-flow-one` has exactly two existing dispatch points governed by the
global multi-agent policy's 2+ parallel-angle rule: the three-tool research
trio (Context7/Exa/Firecrawl) and the Step 5 code-review dispatch. Because
the `Workflow` tool is only callable from the top-level session, and team
mode is only ever recorded as available when `jt-flow-one` is not a nested,
delegated run (in which case it already is the top-level session), neither
dispatch point's behavior SHALL depend on the recorded team-mode outcome:
both SHALL call the `Workflow` tool directly, from the current session,
regardless of whether team mode is recorded as available or unavailable.
`jt-flow-one` MUST NOT spawn a wrapper agent to call `Workflow` on its
behalf, and MUST NOT replace either `Workflow` tool call with multiple
manually-spawned named agents.

#### Scenario: Three-tool research dispatch is identical whether team mode is available or not

- **WHEN** `jt-flow-one` reaches the three-tool research dispatch point,
  regardless of the recorded team-mode outcome
- **THEN** `jt-flow-one` calls the `Workflow` tool directly, from the
  current session

#### Scenario: Code review dispatch is identical whether team mode is available or not

- **WHEN** `jt-flow-one` reaches the Step 5 code-review dispatch point,
  regardless of the recorded team-mode outcome
- **THEN** `jt-flow-one` calls the `Workflow` tool directly, from the
  current session

#### Scenario: Wrapper-agent and manual multi-agent replacement are both prohibited

- **WHEN** `jt-flow-one` reaches either the three-tool research or the
  Step 5 code-review dispatch point, regardless of the recorded team-mode
  outcome
- **THEN** `jt-flow-one` does not spawn a wrapper agent to call `Workflow`
  on its behalf, and does not spawn multiple manually-named agents, one
  per angle, in place of the `Workflow` tool call
