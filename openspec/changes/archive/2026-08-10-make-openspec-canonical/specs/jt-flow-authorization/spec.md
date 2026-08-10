## MODIFIED Requirements

### Requirement: Explicit invocation authorizes OpenSpec preparation

An explicit `jt-flow-one` invocation SHALL authorize repository-scoped
discovery and OpenSpec artifact creation or update without additional
normal-path approval. A GitHub Issue MAY be used as external context, but the
workflow MUST NOT require or create one. It SHALL NOT authorize implementation
before proposal GO.

#### Scenario: No existing proposal matches

- **WHEN** the user explicitly invokes `jt-flow-one`
- **AND** repository evidence shows no matching OpenSpec change
- **THEN** the workflow creates the OpenSpec artifacts without asking for
  separate creation approval
- **AND** pauses at the proposal GO gate before implementation

#### Scenario: A request has an optional Issue link

- **WHEN** the request arrives through an existing GitHub Issue
- **THEN** the workflow MAY record that link in the proposal
- **AND** the Issue is not a prerequisite for proposal GO or implementation

### Requirement: Proposal GO authorizes end-to-end delivery

Proposal GO SHALL authorize implementation, commit, push, PR creation,
authorized review requests, finding disposition, merge, deployment
verification, and OpenSpec archive for the approved scope. Issue creation,
update, and closure are optional and MUST NOT be approval or completion gates.
Before merge, every accepted finding MUST be fixed and verified, and every
rejected finding MUST retain a concrete reason. The workflow MUST NOT request
another normal-path authorization for those actions.

#### Scenario: Approved proposal reaches merge

- **WHEN** the user has given proposal GO
- **AND** implementation, review, CI, and mergeability gates pass
- **THEN** the workflow merges and continues through deployment verification
  and archive without another authorization prompt or Issue prerequisite

### Requirement: Delegated items use the same checkpoint contract

A `jt-flow-all` delegated item SHALL retain its proposal GO gate and SHALL
continue automatically to a terminal result after that GO. An active proposal
with an already recorded explicit GO MUST NOT require another GO solely because
it is delegated. On receipt, the workflow SHALL persist proposal GO evidence
under the change verification logs, binding the change identifier, proposal
path, repository, approved scope, and consent state. An optional external link
MAY be recorded but MUST NOT be required. Queue handoff MUST pass those
matching fields and the durable evidence reference.

#### Scenario: Approved active change enters a queue

- **WHEN** `jt-flow-all` delegates an active change whose proposal already has
  explicit user approval
- **THEN** `jt-flow-one` treats that approval as the item proposal GO
- **AND** proceeds under the bounded-exception contract whether or not an Issue
  link exists

#### Scenario: Approved change resumes in another task context

- **WHEN** a queue item has a durable proposal GO record whose change, proposal
  path, repository, and approved scope match the current item
- **THEN** `jt-flow-all` passes the record and matching fields to `jt-flow-one`
- **AND** the workflow reuses the approval without relying on conversational
  memory or requesting another GO

## ADDED Requirements

### Requirement: OpenSpec-only planning excludes parallel plan artifacts

For this repository's `jt-flow-one` delivery workflow, OpenSpec `proposal`,
`design`, `specs`, and `tasks` SHALL be the sole planning artifacts. The
workflow MUST NOT invoke a planning pipeline that creates parallel
`docs/superpowers/` records. It SHALL retain the scoped TDD, debugging,
review, and completion-verification skills needed to execute an approved
change.

#### Scenario: A delivery request begins analysis

- **WHEN** `jt-flow-one` receives a new delivery request
- **THEN** it records planning decisions only in the OpenSpec change artifacts
- **AND** it does not create a parallel Superpowers planning record
