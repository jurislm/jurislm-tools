## MODIFIED Requirements

### Requirement: Ordered queue delivery delegates to the single-request Skill
After the coordinator confirms a dependency snapshot, `jt-flow-all` SHALL invoke `jt-flow-one` once for each whole `READY` active change within available item-owner capacity, passing the exact change identifier, proposal path, Issue mapping, target repository, approved scope, durable proposal GO evidence, dependency snapshot revision, integration policy, and CodeRabbit authorization context. It MUST NOT dispatch a subset of a change's tasks. An item result other than `SUCCESS` SHALL affect only that item and its dependency descendants; unrelated `READY` items SHALL continue.

#### Scenario: Independent changes are dispatched together

- **WHEN** two approved active changes have no hard dependency, external blocker, or overlapping integration target and item-owner capacity is available
- **THEN** the coordinator dispatches both changes without waiting for either to complete first

#### Scenario: A blocked item does not stop independent work

- **WHEN** one active item becomes `BLOCKED` and another item has no dependency path from it
- **THEN** the blocked item records its blocker and descendants while the independent item remains eligible for dispatch

### Requirement: Active changes have tracking issues before queueing
`jt-flow-all` SHALL paginate all open Issues and read all active OpenSpec changes from the same clean dependency snapshot. Each whole active change SHALL remain one execution unit and identify one primary tracking Issue; other open Issues SHALL be classified as related, deferred, or unmapped. The workflow MUST NOT automatically create an Issue or change merely because an unmapped record exists.

#### Scenario: Open Issue has no active change

- **WHEN** inventory finds an open Issue that is not primary or related to an active change
- **THEN** the coordinator reports it as deferred or unmapped without creating work and without blocking unrelated active changes

#### Scenario: Only part of an oversized change is ready

- **WHEN** some tasks in one active change are ready but other tasks have unsatisfied dependencies
- **THEN** the coordinator does not partially dispatch it and requires an approved reduced proposal or separately approved successor change

### Requirement: Per-item gates remain effective
Queue orchestration SHALL NOT bypass any proposal, consent, or approval gate owned by `jt-flow-one`. A missing or mismatched proposal GO SHALL place only that item in `AWAITING_GO`; approval, waiting, failure, or cancellation of one item SHALL NOT pause unrelated items.

#### Scenario: Delegated item requires approval

- **WHEN** an item owner cannot prove an exact proposal GO for its current change, proposal path, Issue, repository, and approved scope
- **THEN** that item enters `AWAITING_GO`, its descendants wait, and unrelated ready items continue

## ADDED Requirements

### Requirement: Queue inventory uses refreshed remote truth
`jt-flow-all` SHALL resolve the actual GitHub remote, fetch and prune it, and build Issue and OpenSpec inventory from a clean detached snapshot of the refreshed remote `main`. It MUST NOT derive the queue from a dirty or stale caller worktree.

#### Scenario: Caller worktree is stale and dirty

- **WHEN** the caller worktree differs from refreshed remote `main`
- **THEN** the coordinator inventories the clean remote snapshot and records that revision as the dependency snapshot source

### Requirement: Proposals declare delivery relations
Every new or updated proposal SHALL declare priority, hard dependencies, acceptance dependencies, external blockers, affected areas, production targets, and primary/related Issue mapping. Each external blocker SHALL identify whether it gates dispatch or integration. Hard dependencies SHALL prevent dispatch until predecessors are `SUCCESS`; acceptance dependencies SHALL allow work through `INTEGRATION_READY` but prevent integration and `SUCCESS`. `jt-flow-all` SHALL derive reverse blockers and safe-parallel candidates; it MUST NOT require authors to duplicate `Blocks` or `Can parallel with` lists.

#### Scenario: Relation metadata is missing or contradictory

- **WHEN** an active proposal lacks required relation fields or contradicts another current artifact
- **THEN** only that item enters `BLOCKED` with the responsible owner, reason, downstream items, and explicit resume condition

#### Scenario: Dependency cycle exists

- **WHEN** hard-dependency edges form a cycle
- **THEN** the cycle members and their descendants are blocked while unrelated nodes remain eligible

### Requirement: Queue exposes dependency-aware states
The coordinator SHALL report each execution unit as `AWAITING_GO`, `READY`, `ACTIVE`, `WAITING`, `BLOCKED`, `PAUSED`, `INTEGRATION_READY`, `SUCCESS`, `FAILED`, or `CANCELLED`. `WAITING` SHALL mean a valid unresolved dependency or external condition; `BLOCKED` SHALL mean missing, contradictory, cyclic, or otherwise invalid delivery metadata that requires correction. Each `WAITING` or `BLOCKED` item SHALL identify what it waits on, why, the resolution owner, the resume condition, and affected descendants.

#### Scenario: User intentionally defers work

- **WHEN** an item is marked `deferred` or explicitly postponed
- **THEN** it remains `PAUSED` and does not consume item-owner capacity or block unrelated MVP work

### Requirement: Independent delivery is bounded by available capacity
The primary agent SHALL remain coordinator and reserve one available agent slot. Remaining available slots MAY each own one `READY` item. The coordinator SHALL start an owner from the target repository's clean main checkout, and the delegated `jt-flow-one` run SHALL create and own its isolated feature worktree. When delegation capacity is unavailable, the same dependency rules SHALL run sequentially without changing safety semantics.

#### Scenario: Capacity becomes available

- **WHEN** a worker slot is released and another item is `READY`
- **THEN** the coordinator assigns that item without waiting for active independent items to finish

### Requirement: Integration and production mutation are serialized
An item owner SHALL return `INTEGRATION_READY` only after implementation, required tests, `jt-flow-one` quality review, PR checks, review disposition, and exact HEAD readback. Before a permit, the owner SHALL fetch remote main, prove the item contains that exact main SHA or rebase, rerun required checks, and read current mergeability. The coordinator SHALL hold at most one integration permit containing the exact repository, change identifier, item HEAD SHA, and verified main SHA; only the matching owner MAY merge or perform any production mutation, then verify and archive.

#### Scenario: Two items are ready to merge

- **WHEN** two item owners return `INTEGRATION_READY`
- **THEN** the coordinator grants one exact-SHA permit and keeps the other waiting for the integration lane

#### Scenario: Permitted HEAD changes

- **WHEN** the permitted item HEAD no longer matches the permit SHA
- **THEN** the permit is invalidated and requires current-HEAD verification before integration without requiring a new proposal GO solely for that SHA change

#### Scenario: Main changes after integration readiness

- **WHEN** refreshed remote main differs from the main SHA in the integration evidence or permit
- **THEN** the item updates from current main, reruns required checks, and obtains a new permit before merge or production mutation

#### Scenario: Permit holder stops during integration

- **WHEN** a permitted item fails or is cancelled
- **THEN** the coordinator revokes the permit only after proving no production mutation began, or holds the lane until the affected target is verified healthy or restored to a known rollback state

#### Scenario: Production target state is unknown

- **WHEN** a permitted production mutation starts but its target cannot be proven healthy or restored
- **THEN** unrelated development and tests continue, but the integration lane remains `WAITING` with an owner and resume condition and no new permit is issued

### Requirement: Proposal and code reviews have separate bounded owners
Before dispatch, `jt-flow-all` SHALL obtain one independent overdesign review for the current material proposal revision. `jt-flow-one` SHALL remain the sole owner of implementation quality review, and `jt-flow-all` MUST NOT initiate a duplicate code review. External reviewer quota exhaustion SHALL follow the existing bounded skip rules and MUST NOT permanently block the queue.

#### Scenario: Proposal materially changes

- **WHEN** scope, architecture, dependencies, or production risk changes after the overdesign review
- **THEN** the item requires one new proposal overdesign review before dispatch

#### Scenario: Implementation review already exists

- **WHEN** `jt-flow-one` supplies the required quality-review evidence for the current code batch
- **THEN** `jt-flow-all` accepts that evidence and does not request another code review
