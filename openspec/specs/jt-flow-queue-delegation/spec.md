# jt-flow-queue-delegation Specification

## Purpose
Define dependency-aware queue inventory, whole-change delegation, bounded
parallel delivery, serialized integration, and durable handoff rules for
`jt-flow-all` delegating work to `jt-flow-one`.

## Requirements

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

---
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

---
### Requirement: Single-request delivery workflow has one owner
The `jt-flow-all` Skill MUST NOT duplicate the single-request Spectra
preparation, proposal, worktree, implementation, review, merge, deployment,
archive, or proposal-synchronization procedures. `jt-flow-one` SHALL remain
the owner of those procedures for every delegated item.

#### Scenario: Queue Skill is inspected

- **WHEN** `jt-flow-all` is inspected after the queue-order confirmation
- **THEN** it contains delegation and ordered-progress rules rather than a duplicate end-to-end delivery procedure

---
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

---
### Requirement: Queue delegation preserves CodeRabbit consent
Invoking or routing to `jt-flow-all` SHALL NOT itself prove CodeRabbit consent. The coordinator SHALL pass `codeRabbitAuthorization=preauthorized` with `authorizationSource=explicit-coderabbit-consent` only when durable evidence proves the user saw the complete CodeRabbit disclosure and explicitly consented. For every other invocation it SHALL pass `codeRabbitAuthorization=requires-disclosure`, and the delegated `jt-flow-one` run SHALL include its disclosure in the proposal summary and record any consent through the same proposal GO.

#### Scenario: Queue is invoked by general intent

- **WHEN** `jt-flow-all` is selected by general intent without durable explicit CodeRabbit consent evidence
- **THEN** the delegated `jt-flow-one` item receives `requires-disclosure`

#### Scenario: Queue is invoked explicitly without durable consent evidence

- **WHEN** the user explicitly invokes `jt-flow-all` but no durable evidence proves disclosure and explicit consent
- **THEN** invocation alone does not authorize CodeRabbit and the delegated item receives `requires-disclosure`

#### Scenario: Durable explicit consent exists

- **WHEN** durable evidence proves the user saw the complete disclosure and explicitly consented
- **THEN** the delegated item may receive `preauthorized` with `authorizationSource=explicit-coderabbit-consent`

---
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

---
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

---
### Requirement: Queue exposes dependency-aware states
The coordinator SHALL report each execution unit as `AWAITING_GO`, `READY`, `ACTIVE`, `WAITING`, `BLOCKED`, `PAUSED`, `INTEGRATION_READY`, `SUCCESS`, `FAILED`, or `CANCELLED`. `WAITING` SHALL mean a valid unresolved dependency or external condition; `BLOCKED` SHALL mean missing, contradictory, cyclic, or otherwise invalid delivery metadata that requires correction. Each `WAITING` or `BLOCKED` item SHALL identify what it waits on, why, the resolution owner, the resume condition, and affected descendants.

#### Scenario: User intentionally defers work

- **WHEN** an item is marked `deferred` or explicitly postponed
- **THEN** it remains `PAUSED` and does not consume item-owner capacity or block unrelated MVP work

---
### Requirement: Independent delivery is bounded by available capacity
The primary agent SHALL remain coordinator and reserve one available agent slot. Remaining available slots MAY each own one `READY` item. The coordinator SHALL start an owner from the target repository's clean main checkout, and the delegated `jt-flow-one` run SHALL create and own its isolated feature worktree. When delegation capacity is unavailable, the same dependency rules SHALL run sequentially without changing safety semantics.

#### Scenario: Capacity becomes available

- **WHEN** a worker slot is released and another item is `READY`
- **THEN** the coordinator assigns that item without waiting for active independent items to finish

---
### Requirement: Integration and production mutation are serialized
An item owner SHALL return `INTEGRATION_READY` only after implementation, required tests, `jt-flow-one` quality review, PR checks, review disposition, and exact HEAD readback. Before a permit, the owner SHALL fetch remote main, prove the item contains that exact main SHA or rebase, determine the exact required-check set, wait for each required check to reach terminal success, and read current mergeability. The coordinator SHALL hold at most one integration permit. Its evidence SHALL bind the exact repository, change identifier, item HEAD SHA, refreshed main SHA, required-check set, per-check terminal-success conclusions, current mergeability result, and readback time. The coordinator SHALL fail closed and reread every bound field both at permit grant and immediately before merge or any production mutation. Pending, failed, unknown, non-terminal, missing-check, stale-item-HEAD, stale-main, stale-readback, or non-mergeable evidence SHALL withhold or invalidate the permit; only the matching owner MAY integrate.

#### Scenario: Two items are ready to merge

- **WHEN** two item owners return `INTEGRATION_READY`
- **THEN** the coordinator grants one exact-SHA permit and keeps the other waiting for the integration lane

#### Scenario: Permitted HEAD changes

- **WHEN** the permitted item HEAD no longer matches the permit SHA
- **THEN** the permit is invalidated and requires current-HEAD verification before integration without requiring a new proposal GO solely for that SHA change

#### Scenario: Required check evidence is incomplete

- **WHEN** any required check is pending, failed, unknown, non-terminal, missing from the recorded set, or bound to another item HEAD
- **THEN** the coordinator withholds or invalidates the permit

#### Scenario: Mergeability evidence is not current and mergeable

- **WHEN** current mergeability is unknown, non-mergeable, or the evidence readback is stale
- **THEN** the coordinator withholds or invalidates the permit

#### Scenario: Main changes after integration readiness

- **WHEN** refreshed remote main differs from the main SHA in the integration evidence or permit
- **THEN** the coordinator rebuilds the dependency snapshot, reclassifies eligibility, and only then may the item update from current main, rerun required checks, and obtain a new permit before merge or production mutation

#### Scenario: Permit holder stops during integration

- **WHEN** a permitted item fails or is cancelled
- **THEN** the coordinator revokes the permit only after proving no merge occurred, no production mutation occurred, and no derived CI, release, deployment, or other downstream pipeline began; otherwise it holds the lane until downstream state is verified healthy or restored to a known rollback state

#### Scenario: Merge starts downstream work

- **WHEN** the permitted item merges or any derived pipeline begins
- **THEN** the integration lane remains held until downstream CI and deployment are verified healthy or the system is restored to a known rollback state

#### Scenario: Integration or production state is unknown

- **WHEN** a merge, derived pipeline, or production mutation starts but its downstream target cannot be proven healthy or restored
- **THEN** unrelated development and tests continue, but the integration lane remains `WAITING` with an owner and resume condition and no new permit is issued

---
### Requirement: Proposal and code reviews have separate bounded owners
Before dispatch, `jt-flow-all` SHALL obtain one independent overdesign review for the current material proposal revision. `jt-flow-one` SHALL remain the sole owner of implementation quality review, and `jt-flow-all` MUST NOT initiate a duplicate code review. External reviewer quota exhaustion SHALL follow the existing bounded skip rules and MUST NOT permanently block the queue.

#### Scenario: Proposal materially changes

- **WHEN** scope, architecture, dependencies, or production risk changes after the overdesign review
- **THEN** the item requires one new proposal overdesign review before dispatch

#### Scenario: Implementation review already exists

- **WHEN** `jt-flow-one` supplies the required quality-review evidence for the current code batch
- **THEN** `jt-flow-all` accepts that evidence and does not request another code review
