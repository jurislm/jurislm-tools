## MODIFIED Requirements

### Requirement: Explicit invocation authorizes Spectra preparation

An explicit `jt-flow-one` invocation SHALL authorize repository-scoped
discovery and Spectra artifact creation or update without additional
normal-path approval. Spectra artifacts are the sole current planning and
delivery record; the workflow MUST NOT create, link, or depend on a GitHub
Issue. It SHALL NOT authorize implementation before proposal GO.

#### Scenario: No existing proposal matches

- **WHEN** the user explicitly invokes `jt-flow-one`
- **AND** repository evidence shows no matching Spectra change
- **THEN** the workflow creates the Spectra artifacts without asking for
  separate creation approval
- **AND** pauses at the proposal GO gate before implementation

### Requirement: Proposal GO authorizes end-to-end delivery

Proposal GO SHALL authorize implementation, commit, push, PR creation,
authorized review requests, finding disposition, merge, deployment
verification, and Spectra archive for the approved scope. GitHub Issue
creation, linkage, and closure are outside this workflow and MUST NOT be
approval or completion gates. Before merge, every accepted finding MUST be
fixed and verified, and every rejected finding MUST retain a concrete reason.
The workflow MUST NOT request another normal-path authorization for those
actions.

#### Scenario: Approved proposal reaches merge

- **WHEN** the user has given proposal GO
- **AND** implementation, review, CI, and mergeability gates pass
- **THEN** the workflow merges and continues through deployment verification
  and archive without another authorization prompt

##### Example: Approved documentation change

- **GIVEN** `align-repo-standards-code-review` has a recorded proposal GO
- **WHEN** its PR checks and mergeability gates are current and successful
- **THEN** its approved delivery continues through merge and archive

### Requirement: Delegated items use the same checkpoint contract

A `jt-flow-all` delegated item SHALL retain its proposal GO gate and SHALL
continue automatically to a terminal result after that GO. An active proposal
with an already recorded explicit GO MUST NOT require another GO solely because
it is delegated. On receipt, the workflow SHALL persist proposal GO evidence
under the change verification logs, binding the change identifier, proposal
path, repository, approved scope, and consent state. Queue handoff MUST pass
those matching fields and the durable evidence reference; it MUST NOT include
or depend on a GitHub Issue link.

#### Scenario: Approved active change enters a queue

- **WHEN** `jt-flow-all` delegates an active change whose proposal already has
  explicit user approval
- **THEN** `jt-flow-one` treats that approval as the item proposal GO
- **AND** proceeds under the bounded-exception contract using the durable
  Spectra evidence

#### Scenario: Approved change resumes in another task context

- **WHEN** a queue item has a durable proposal GO record whose change,
  proposal path, repository, and approved scope match the current item
- **THEN** `jt-flow-all` passes the record and matching fields to `jt-flow-one`
- **AND** the workflow reuses the approval without relying on conversational
  memory or requesting another GO
