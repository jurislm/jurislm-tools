## MODIFIED Requirements

### Requirement: Ordered queue delivery delegates to the single-request Skill

After the coordinator confirms a dependency snapshot, `jt-flow-all` SHALL
invoke `jt-flow-one` once for each whole `READY` active OpenSpec change within
available item-owner capacity, passing the exact change identifier, proposal
path, target repository, approved scope, durable proposal GO evidence,
dependency snapshot revision, integration policy, and CodeRabbit authorization
context. An optional external link MAY be passed as descriptive metadata. It
MUST NOT dispatch a subset of a change's tasks. An item result other than
`SUCCESS` SHALL affect only that item and its dependency descendants; unrelated
`READY` items SHALL continue.

#### Scenario: Active change is delegated without an Issue

- **WHEN** an active OpenSpec change is `READY` and has no external Issue link
- **THEN** the coordinator passes the OpenSpec identity and durable proposal GO
  evidence to `jt-flow-one` and dispatches the whole change

### Requirement: Single-request delivery workflow has one owner

The `jt-flow-all` Skill MUST NOT duplicate the single-request OpenSpec
preparation, proposal, worktree, implementation, review, merge, deployment,
archive, or proposal-synchronization procedures. `jt-flow-one` SHALL remain
the owner of those procedures for every delegated item.

#### Scenario: Queue Skill is inspected

- **WHEN** `jt-flow-all` is inspected after the queue-order confirmation
- **THEN** it contains delegation and ordered-progress rules rather than a
  duplicate end-to-end delivery procedure

### Requirement: Per-item gates remain effective

Queue orchestration SHALL NOT bypass any proposal, consent, or approval gate
owned by `jt-flow-one`. Before any delegated fetch or feature-worktree
mutation, the coordinator and owner SHALL match durable proposal GO evidence to
the exact change identifier, proposal path, repository, and approved scope. A
missing or mismatched proposal GO SHALL place only that item in `AWAITING_GO`;
only a `READY` item MAY then fetch remote main, resolve and record its exact
SHA/ref, and create its isolated feature worktree. Approval, waiting, failure,
or cancellation of one item SHALL NOT pause unrelated items.

#### Scenario: Delegated item has no external Issue

- **WHEN** durable proposal GO matches the current change, proposal path,
  repository, and approved scope but no Issue link exists
- **THEN** the item becomes `READY` before its owner fetches remote main and
  creates the isolated worktree

### Requirement: Queue inventory uses refreshed remote truth

`jt-flow-all` SHALL resolve the actual GitHub remote, fetch and prune it, and
build active OpenSpec inventory from a clean detached snapshot of the refreshed
remote `main`. It MUST NOT derive the queue from a dirty or stale caller
worktree or from an open Issue inventory. Before every subsequent dispatch or
integration-permit decision, it SHALL reread remote main; any SHA drift SHALL
invalidate the dependency snapshot and require a new clean snapshot plus
refreshed active changes, Delivery Relations, reverse edges, descendants, and
item eligibility. The refreshed graph MAY reclassify an `ACTIVE` or
`INTEGRATION_READY` item.

#### Scenario: Queue snapshot contains no Issue inventory

- **WHEN** the refreshed remote snapshot contains active OpenSpec changes but
  no Issue inventory is read
- **THEN** the coordinator still derives active changes, relations, and
  eligibility and does not block valid items

### Requirement: Proposals declare delivery relations

Every new or updated proposal SHALL declare priority, hard dependencies,
acceptance dependencies, external blockers, affected areas, and production
targets. Each external blocker SHALL identify whether it gates dispatch or
integration. Hard dependencies SHALL prevent dispatch until predecessors are
`SUCCESS`; acceptance dependencies SHALL allow work through
`INTEGRATION_READY` but prevent integration and `SUCCESS`. `jt-flow-all` SHALL
derive reverse blockers and safe-parallel candidates; it MUST NOT require
authors to duplicate `Blocks`, `Can parallel with`, or Issue mapping lists. Any
directed cycle formed by only hard dependencies, only acceptance dependencies,
or a mixture of hard and acceptance dependencies SHALL be invalid and
`BLOCKED` rather than left to deadlock at dispatch or integration.

#### Scenario: Relations are complete without Issue mapping

- **WHEN** a proposal declares all required dependency, blocker, area, and
  production-target fields without an Issue mapping
- **THEN** the proposal remains relation-complete and can enter the applicable
  queue state

## REMOVED Requirements

### Requirement: Active changes have tracking issues before queueing

**Reason**: Queue eligibility no longer depends on a GitHub Issue or Issue
mapping; active OpenSpec changes with valid Delivery Relations are the sole
execution records.

**Migration**: Use `Active changes use OpenSpec delivery records before
queueing` for queue inventory and eligibility. Existing Issue links remain
optional external context.

## ADDED Requirements

### Requirement: Active changes use OpenSpec delivery records before queueing

`jt-flow-all` SHALL read all active OpenSpec changes from the same clean
dependency snapshot and SHALL derive the queue from those changes and their
Delivery Relations. Each whole active change SHALL remain one execution unit.
Open Issue inventory, primary Issue mapping, and Issue creation MUST NOT be
required for queue eligibility. An existing Issue MAY be reported or linked as
external context, but an unrelated or missing Issue MUST NOT create, block, or
pause an otherwise valid active change.

#### Scenario: Active change has no Issue

- **WHEN** an active OpenSpec change has complete valid relation metadata and no
  linked GitHub Issue
- **THEN** it remains eligible for `READY` or the applicable dependency state
- **AND** the coordinator does not create an Issue or mark the item `BLOCKED`

#### Scenario: Open Issue has no active change

- **WHEN** an open Issue is not linked to an active OpenSpec change
- **THEN** it remains outside the execution graph and does not block unrelated
  active changes
