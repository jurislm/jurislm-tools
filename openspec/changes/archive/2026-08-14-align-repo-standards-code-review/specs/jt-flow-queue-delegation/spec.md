## MODIFIED Requirements

### Requirement: Ordered queue delivery delegates to the single-request Skill

After the coordinator confirms a dependency snapshot, `jt-flow-all` SHALL
invoke `jt-flow-one` once for each whole `READY` active Spectra change within
available item-owner capacity, passing the exact change identifier, proposal
path, target repository, approved scope, durable proposal GO evidence,
dependency snapshot revision, integration policy, and CodeRabbit authorization
context. It MUST NOT dispatch a subset of a change's tasks. An item result
other than `SUCCESS` SHALL affect only that item and its dependency descendants;
unrelated `READY` items SHALL continue.

#### Scenario: Active change is delegated from Spectra evidence

- **WHEN** an active Spectra change is `READY`
- **THEN** the coordinator passes the Spectra identity and durable proposal GO
  evidence to `jt-flow-one` and dispatches the whole change

### Requirement: Active changes use Spectra delivery records before queueing

`jt-flow-all` SHALL read all active Spectra changes from the same clean
dependency snapshot and SHALL derive the queue from those changes and their
Delivery Relations. Each whole active change SHALL remain one execution unit.
GitHub Issue inventory, mapping, creation, and links MUST NOT be read, created,
or required for queue eligibility.

#### Scenario: Active change has complete delivery relations

- **WHEN** an active Spectra change has complete valid relation metadata
- **THEN** it remains eligible for `READY` or the applicable dependency state
  without any GitHub Issue data

### Requirement: Per-item gates remain effective

Queue orchestration SHALL NOT bypass any proposal, consent, or approval gate
owned by `jt-flow-one`. Before any delegated fetch or feature-worktree
mutation, the coordinator and owner SHALL match durable proposal GO evidence to
the exact change identifier, proposal path, repository, and approved scope. A
missing or mismatched proposal GO SHALL place only that item in `AWAITING_GO`;
only a `READY` item SHALL be permitted to fetch remote main, resolve and record
its exact SHA/ref, and create its isolated feature worktree. Approval, waiting, failure,
or cancellation of one item SHALL NOT pause unrelated items.

#### Scenario: Delegated item has matching approval

- **WHEN** durable proposal GO matches the current change, proposal path,
  repository, and approved scope
- **THEN** the item becomes `READY` before its owner fetches remote main and
  creates the isolated worktree

### Requirement: Queue inventory uses refreshed remote truth

`jt-flow-all` SHALL resolve the actual GitHub remote, fetch and prune it, and
build active Spectra inventory from a clean detached snapshot of the refreshed
remote `main`. It MUST NOT derive the queue from a dirty or stale caller
worktree or from GitHub Issue inventory. Before every subsequent dispatch or
integration-permit decision, it SHALL reread remote main; any SHA drift SHALL
invalidate the dependency snapshot and require a new clean snapshot plus
refreshed active changes, Delivery Relations, reverse edges, descendants, and
item eligibility. The refreshed graph SHALL reclassify every affected `ACTIVE`
or `INTEGRATION_READY` item.

#### Scenario: Queue snapshot is Spectra-only

- **WHEN** the refreshed remote snapshot contains active Spectra changes
- **THEN** the coordinator derives active changes, relations, and eligibility
  without reading GitHub Issue inventory

##### Example: Clean detached source

- **GIVEN** local worktree edits differ from `origin/main`
- **WHEN** the coordinator refreshes the remote snapshot
- **THEN** it derives the queue from the clean detached `origin/main` snapshot

#### Scenario: Remote main changes after inventory

- **WHEN** remote-main SHA differs from the dependency snapshot before a
  dispatch or permit decision
- **THEN** the coordinator invalidates the snapshot and rebuilds all
  active-change relations and eligibility before proceeding

##### Example: Main advances while an item waits

- **GIVEN** a queued item was classified from remote main SHA `abc1234`
- **WHEN** refreshed remote main resolves to SHA `def5678`
- **THEN** the coordinator rebuilds its dependency snapshot before dispatch

### Requirement: Proposals declare delivery relations

Every new or updated proposal SHALL declare priority, hard dependencies,
acceptance dependencies, external blockers, affected areas, and production
targets. Each external blocker SHALL identify whether it gates dispatch or
integration. Hard dependencies SHALL prevent dispatch until predecessors are
`SUCCESS`; acceptance dependencies SHALL allow work through
`INTEGRATION_READY` but prevent integration and `SUCCESS`. `jt-flow-all` SHALL
derive reverse blockers and safe-parallel candidates; it MUST NOT require
authors to duplicate derived relation lists or GitHub Issue mappings. Any
directed cycle formed by only hard dependencies, only acceptance dependencies,
or a mixture of hard and acceptance dependencies SHALL be invalid and
`BLOCKED` rather than left to deadlock at dispatch or integration.

#### Scenario: Relations are complete without GitHub Issue mapping

- **WHEN** a proposal declares all required dependency, blocker, area, and
  production-target fields
- **THEN** the proposal remains relation-complete and can enter the applicable
  queue state without a GitHub Issue mapping

##### Example: Relation-complete proposal

- **GIVEN** a proposal records priority, dependencies, blockers, affected areas,
  and production targets
- **WHEN** `jt-flow-all` reads the proposal from the refreshed snapshot
- **THEN** it can determine the applicable queue state from those fields alone

#### Scenario: Hard-dependency cycle exists

- **WHEN** hard-dependency edges form a cycle
- **THEN** the cycle members and their descendants are `BLOCKED` while unrelated
  nodes remain eligible

#### Scenario: Acceptance-only dependency cycle exists

- **WHEN** acceptance-dependency edges form a cycle
- **THEN** the cycle members and their descendants are `BLOCKED` before
  integration while unrelated nodes remain eligible

#### Scenario: Mixed dependency cycle exists

- **WHEN** hard and acceptance edges together form a directed cycle
- **THEN** the cycle members and their descendants are `BLOCKED` rather than
  allowed to deadlock
