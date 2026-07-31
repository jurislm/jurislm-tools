## Context

`jt-flow-all` is a Markdown Skill, not a runtime scheduler. Its current policy intentionally reads active changes in recorded order, keeps all work in one primary agent, and stops the queue whenever the current item is not successful. The policy tests enforce those choices. In `jurislm/entire`, this hid independent work behind `#855`, conflated a stale-contract blocker in `#898` with normal waiting, and allowed a dirty local worktree to disagree with refreshed remote state.

The replacement must remain portable across Claude Code and Codex, preserve `jt-flow-one` as the single-item delivery owner, and add no service, database, dependency, or host-specific invocation API.

## Goals / Non-Goals

**Goals:**

- Build an evidence-backed dependency map from refreshed remote `main`.
- Keep active OpenSpec changes as delivery units while classifying every open Issue.
- Dispatch independent item owners within available capacity.
- Isolate waiting and failure to affected descendants.
- Serialize integration and production mutation.
- Make proposal overdesign review distinct from implementation quality review.

**Non-Goals:**

- Implement a persistent scheduler, lock service, or task database.
- Infer missing relationships as safe, bypass proposal GO, or duplicate `jt-flow-one` review.
- Automatically create changes for unmapped Issues or execute product work during this plugin change.

## Decisions

### 1. Inventory from a clean remote snapshot

The coordinator resolves the actual GitHub remote, fetches and prunes it, then inventories a clean detached snapshot of `<remote>/main`; it never runs queue discovery against a dirty or stale caller worktree. Native workspace isolation is preferred; a validated temporary detached git worktree is the portable fallback. The snapshot is read-only and removed after the map is recorded.

The coordinator paginates all open Issues and reads all active OpenSpec artifacts. Each whole active change is one execution unit. It never dispatches only selected tasks from an oversized change; that change remains non-ready until its proposal is reduced or a smaller successor change receives its own exact GO. Issues are classified as primary, related, deferred, or unmapped; an unmapped Issue is reported but does not automatically create work or stop unrelated items.

### 2. Proposal relations are the semantic source of truth

Every new or updated proposal declares `Priority`, `Hard dependencies`, `Acceptance dependencies`, `External blockers`, `Affected areas`, `Production targets`, and primary/related Issue mapping. Reverse `Blocks` edges and candidate parallelism are derived. Missing or contradictory metadata marks only that item `BLOCKED` with a correction owner and resume condition.

Hard dependencies form a directed graph and block dispatch until every predecessor is `SUCCESS`. Acceptance dependencies allow implementation through `INTEGRATION_READY` but block the integration permit and `SUCCESS` until satisfied. Each external blocker declares a `dispatch` or `integration` gate: an unresolved valid blocker puts the item in `WAITING` at that gate, while missing, contradictory, cyclic, or invalid relation data puts it in `BLOCKED`. Cycles block the cycle members and descendants, not unrelated nodes. Ready ordering is `mvp-critical`, then `supporting`; `deferred` stays `PAUSED`. Existing recorded order is only a tie-breaker.

Affected-area overlap is a coordination warning, not an automatic hard dependency. Shared files, migrations, databases, deployment targets, or uncertain overlap may proceed through analysis and isolated implementation, but must serialize rebase, merge, and production mutation.

### 3. Bounded item ownership

The primary agent remains coordinator and reserves one available agent slot. Each remaining available slot may own one `READY` change. The coordinator starts each owner from the target repository's clean main checkout; `jt-flow-one`, not `jt-flow-all`, creates and owns the isolated feature worktree. If the host exposes no delegation capacity, the same state machine runs sequentially.

The item owner invokes `jt-flow-one` with the existing exact change, proposal, Issue, repository, scope, GO, and CodeRabbit fields plus the dependency snapshot revision and integration policy. `AWAITING_GO`, `WAITING`, `BLOCKED`, `PAUSED`, `FAILED`, or `CANCELLED` affects that item and descendants only; the coordinator continues dispatching unrelated `READY` items.

### 4. Single integration lane

An item owner stops at `INTEGRATION_READY` after committed implementation, tests, `jt-flow-one` quality review, PR, CI, external-review disposition, and current HEAD readback. Before a permit, the owner fetches remote main, proves the item contains that main revision or rebases, reruns required checks, and reads current mergeability. The coordinator issues at most one permit containing the exact repository, change, item HEAD SHA, and verified main SHA. Only the matching owner may perform merge or any production mutation, then verify and archive. A changed item HEAD or main SHA invalidates the permit and requires fresh integration evidence, not a new proposal GO.

If a permitted item stops before any production mutation, the coordinator may revoke the permit only after verifying that no mutation began. After a production mutation starts, the lane is not released until the target is verified healthy or restored to a known rollback state. Unknown production state is the narrow safety exception to item-local integration isolation: development and tests for unrelated items continue, but no new integration permit is issued.

### 5. Two non-duplicated review responsibilities

Before dispatch, an independent reviewer performs one proposal-scope overdesign review. It checks whether a change is too broad, duplicates existing capabilities, or places deferred work on the MVP critical path. The review is repeated only after a material proposal change.

`jt-flow-one` alone owns implementation quality review. `jt-flow-all` verifies its evidence but does not initiate another code review. Existing one-effective-review budgets and quota-exhausted skip rules remain unchanged.

## Risks / Trade-offs

- [Relationship metadata becomes stale] → Rebuild from refreshed remote state and mark contradictions `BLOCKED`; never infer safety.
- [Parallel branches overlap late] → Refresh main, rebase if needed, rerun required checks, and integrate one item at a time.
- [Multiple workers attempt production changes] → Require one exact item-and-main-SHA permit held by the coordinator.
- [Full Issue inventory adds noise] → Classify non-change Issues without auto-queueing or auto-creating artifacts.
- [Review multiplication slows delivery] → Limit overdesign to proposal scope and keep all code quality review in `jt-flow-one`.

## Migration Plan

1. In the same feature branch, sync and archive completed `delegate-jt-flow-all-to-one` so history and the living queue spec are preserved.
2. Update policy tests first so current serial behavior fails the new contract.
3. Update both Skills and aligned documentation; validate the new delta spec.
4. Merge and let Release Please publish the version; never edit version fields manually.
5. Update `jt-flow@jurislm-tools`, start a new session, and read back the packaged Skill.
6. After the plugin release, backfill existing `jurislm/entire` Issues and run a read-only dependency-map acceptance. Treat proposal edits and actual item dispatch as a separate rollout gate: no partial-change execution, no unsafe docs-only merge, and no item work without its exact GO.

Rollback is a revert of the feature commit or release. No data or production resource migration is involved.

## Open Questions

None.
