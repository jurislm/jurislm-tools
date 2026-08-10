# jt-flow-authorization Specification

## Purpose
Define the authorization checkpoints, bounded post-GO exceptions, review
consent disclosure, and durable approval handoff shared by `jt-flow-one` and
delegated `jt-flow-all` items.
## Requirements
### Requirement: Explicit invocation authorizes proposal preparation

An explicit `jt-flow-one` invocation SHALL authorize repository-scoped
discovery, tracking-issue creation or update, and OpenSpec artifact creation or
update without additional normal-path approval. It SHALL NOT authorize
implementation before proposal GO.

#### Scenario: No existing issue or proposal matches

- **WHEN** the user explicitly invokes `jt-flow-one`
- **AND** repository evidence shows no matching issue or proposal
- **THEN** the workflow creates the tracking issue and OpenSpec artifacts
  without asking for separate creation approval
- **AND** pauses at the proposal GO gate before implementation

### Requirement: Proposal GO authorizes end-to-end delivery

Proposal GO SHALL authorize implementation, commit, push, PR creation,
authorized review requests, finding disposition, merge, deployment verification,
issue closure, and OpenSpec archive for the approved scope. Before merge, every
accepted finding MUST be fixed and verified, and every rejected finding MUST
retain a concrete reason. The workflow MUST NOT request another normal-path
authorization for those actions.

#### Scenario: Approved proposal reaches merge

- **WHEN** the user has given proposal GO
- **AND** implementation, review, CI, and mergeability gates pass
- **THEN** the workflow merges and continues through deployment verification
  and archive without another authorization prompt

### Requirement: Intent-routed review consent shares the proposal checkpoint

When an intent-routed `jt-flow-one` run or `jt-flow-all` queue item lacks
explicit CodeRabbit consent evidence after disclosure, the workflow SHALL
include the existing App and CLI disclosure in the proposal summary. Naming
`jt-flow-all` alone MUST NOT count as consent. A proposal GO after that
disclosure SHALL record both proposal approval and CodeRabbit consent. The
workflow MUST NOT defer this predictable consent into another normal checkpoint
after proposal GO.

#### Scenario: Intent routing reaches proposal review

- **WHEN** `jt-flow-one` was selected from general delivery intent
- **AND** no CodeRabbit consent has been recorded for this workflow
- **THEN** the proposal summary includes the App and CLI disclosure
- **AND** the user's proposal GO records consent for the disclosed review
  channels

#### Scenario: Explicit queue invocation lacks review consent evidence

- **WHEN** the user explicitly invokes `jt-flow-all`
- **AND** neither current context nor a durable approval record proves consent
  after the CodeRabbit disclosure
- **THEN** the queue passes `requires-disclosure` to `jt-flow-one`
- **AND** the current item's proposal GO remains the only consent checkpoint

### Requirement: Post-GO pauses use bounded exceptions

After proposal GO, the workflow SHALL pause only when evidence cannot resolve a
target or behavior ambiguity, the implementation requires a material scope or
architecture change, a new external dependency, or new production risk, a secret
or sensitive payload is detected, required credentials or permissions or
platform approval are missing, an unapproved irreversible production mutation
is required, or rollback has database, schema, data-loss, or unclear-target
risk.

#### Scenario: Implementation detail changes within approved scope

- **WHEN** an implementation detail or reviewer finding changes code without
  materially changing approved scope, architecture, dependencies, or
  production risk
- **THEN** the workflow updates required artifacts and verification evidence
  and continues without another user GO

#### Scenario: Architecture materially changes

- **WHEN** implementation requires replacing an approved architecture or adding
  a new external dependency
- **THEN** the workflow updates the affected artifacts, validates them, and
  pauses for a new GO

### Requirement: Delegated items use the same checkpoint contract

A `jt-flow-all` delegated item SHALL retain its proposal GO gate and SHALL
continue automatically to a terminal result after that GO. An active proposal
with an already recorded explicit GO MUST NOT require another GO solely because
it is delegated. On receipt, the workflow SHALL persist proposal GO evidence
under the change verification logs, binding the change identifier, proposal
path, repository, issue, approved scope, and consent state. Queue handoff MUST
pass those matching fields and the durable evidence reference.

#### Scenario: Approved active change enters a queue

- **WHEN** `jt-flow-all` delegates an active change whose proposal already has
  explicit user approval
- **THEN** `jt-flow-one` treats that approval as the item proposal GO
- **AND** proceeds under the bounded-exception contract

#### Scenario: Approved change resumes in another task context

- **WHEN** a queue item has a durable proposal GO record whose change,
  proposal path, repository, and approved scope match the current item
- **THEN** `jt-flow-all` passes the record and matching fields to `jt-flow-one`
- **AND** the workflow reuses the approval without relying on conversational
  memory or requesting another GO
