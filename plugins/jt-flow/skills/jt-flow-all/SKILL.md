---
name: jt-flow-all
description: >
  Use when the user wants to deliver every active OpenSpec change as a
  dependency-aware queue, work through the current OpenSpec change queue, or
  asks to "按照 OpenSpec changes 做完".
---

## Scope and non-goals

`jt-flow-all` is a Markdown policy contract, not a runtime scheduler. It
coordinates whole active OpenSpec changes and delegates their delivery to
`jt-flow-one`; it does not implement a service, database, lock, task scheduler,
or host-specific invocation API. `jt-flow-one` remains the single owner of an
item's implementation, isolated worktree, proposal gates, quality review, PR,
CI, external-review disposition, merge, production verification, and archive.

Never infer a missing relationship as safe, create an Issue/change for an
unmapped record, dispatch only a subset of a change's tasks, bypass an exact
proposal GO, or duplicate `jt-flow-one` implementation quality review.

## CodeRabbit authorization handoff

Calling `jt-flow-all` authorizes creation and execution of the change queue; it
does not itself authorize CodeRabbit's App/CLI data scope. Only explicit
CodeRabbit consent evidence in the current task context or a durable approval
record, proving acceptance after the complete `jt-flow-one` disclosure, permits
`codeRabbitAuthorization=preauthorized` for items in the same target repository.

Otherwise pass `codeRabbitAuthorization=requires-disclosure`. The owner must
include the disclosure in its proposal summary and receive consent in that same
proposal GO. This adds no checkpoint and must not defer consent until after GO.
Skill names or internal handoffs never prove consent.

## Phase 1 — refreshed remote dependency snapshot

1. Resolve the actual GitHub remote, fetch --prune it, and record the refreshed
   `<remote>/main` SHA as the dependency snapshot revision. Build inventory from
   a clean detached snapshot of `<remote>/main`, never from a dirty or stale
   caller worktree. Prefer native workspace isolation; otherwise create a
   validated temporary detached git worktree, use it read-only, record the map,
   then remove it.
2. From that same snapshot, paginate all open Issues and read all active
   OpenSpec changes. Each whole active change is one execution unit and names
   one primary Issue. Classify every other open Issue as related, deferred, or
   unmapped. Report deferred or unmapped Issues without creating work or
   blocking unrelated items.
3. Inventory every current proposal's `Priority`, `Hard dependencies`,
   `Acceptance dependencies`, `External blockers`, `Affected areas`,
   `Production targets`, and primary/related Issue mapping. Each external
   blocker must declare a `dispatch` or `integration` gate. Derive reverse
   `Blocks` edges and candidate parallelism from those records; authors do not
   duplicate them. `mvp-critical` ranks before `supporting`; `deferred` stays
   paused. Existing recorded order is only a tie-breaker.
4. Missing, contradictory, cyclic, or otherwise invalid relation data is not
   safe to infer. Mark only the affected item `BLOCKED`, recording the
   correction owner, reason, resume condition, and affected descendants.
   `Production targets: none` is an explicit valid value. An absent, `unknown`,
   or unverifiable `Production targets` value is invalid relation metadata:
   mark that item `BLOCKED` and issue no integration permit until corrected.
   Hard-dependency cycles block cycle members and their descendants, while
   unrelated nodes remain eligible. Affected-area overlap is a coordination
   warning, not a hard dependency: analysis and isolated implementation may
   proceed, but rebase, merge, and production mutation stay serialized.
5. Before dispatch, appoint one independent proposal-scope overdesign reviewer
   for the current material proposal revision. The review asks whether scope is
   too broad, duplicates capabilities, or puts deferred work on the MVP path.
   Repeat only after material scope, architecture, dependency, or production
   risk changes. External-review quota exhaustion uses the existing bounded
   skip rules and does not permanently block the queue.

## Fixed state decisions

Record each execution unit using exactly one of `AWAITING_GO`, `READY`,
`ACTIVE`, `WAITING`, `BLOCKED`, `PAUSED`, `INTEGRATION_READY`, `SUCCESS`,
`FAILED`, or `CANCELLED`.

| Fixed input | Expected state and policy |
| --- | --- |
| Complete, consistent relations; exact proposal GO; every hard predecessor is `SUCCESS` | `READY` |
| Proposal GO missing or mismatched to change, proposal path, Issue, repository, or approved scope | `AWAITING_GO`; descendants wait |
| A `READY` change is assigned to an item owner | `ACTIVE`; it consumes that owner's one capacity slot |
| Valid but unresolved hard dependency or dispatch-gated external blocker | `WAITING`; record what, why, owner, resume condition, and affected descendants |
| Required relationship absent, contradictory, invalid, or cyclic | `BLOCKED`; record correction owner, reason, resume condition, and affected descendants |
| `Production targets` absent, `unknown`, or unverifiable | `BLOCKED`; correct the relation metadata and no integration permit may issue |
| Explicit `Production targets: none` with otherwise complete valid relations | `READY`; `none` is a valid explicit no-target value |
| Explicitly `deferred` or postponed | `PAUSED`; it consumes no item-owner capacity and does not block unrelated MVP work |
| Implementation, required tests, `jt-flow-one` quality review, PR checks, review disposition, and current item HEAD readback complete | `INTEGRATION_READY` |
| Acceptance dependencies satisfied and permitted integration, verification, and archive complete | `SUCCESS` |
| The item owner reports an irrecoverable delivery failure | `FAILED`; only its descendants are affected |
| The user explicitly cancels an item | `CANCELLED`; only its descendants are affected |

Hard dependencies prevent dispatch until every predecessor is `SUCCESS`.
Acceptance dependencies permit work through `INTEGRATION_READY` but prevent an
integration permit and `SUCCESS` until satisfied. A valid unresolved
integration-gated external blocker is `WAITING` at integration rather than a
dispatch blocker. `WAITING` always means a valid unresolved condition;
`BLOCKED` always means delivery metadata needs correction.

`AWAITING_GO`, `WAITING`, `BLOCKED`, `PAUSED`, `FAILED`, or `CANCELLED` affects
only that item and its dependency descendants. The coordinator continues to
dispatch unrelated `READY` changes. Do not partially dispatch an oversized
change: it stays non-ready until its proposal is reduced or an independently
approved successor change has its own exact GO.

## Phase 2 — 由同一主代理逐項執行 coordinator dispatch、bounded ownership and handoff

The primary agent is the coordinator and reserves one available agent slot.
Each remaining available slot may own one `READY` change. Start an item owner
from the target repository's clean main checkout; `jt-flow-one` creates and
owns the item's isolated feature worktree. When the host has no delegation
capacity, apply this same state table sequentially without changing its safety
semantics. When a slot is released, assign the next independent `READY` change
without waiting for active independent work to finish.

The same primary agent performs coordinator dispatch, not each item's delivery.
For the current item, invoke `jt-flow-one` with the exact change identifier,
proposal path, primary/related Issue mapping, target repository, approved scope,
durable proposal GO evidence, dependency snapshot revision, integration policy,
and CodeRabbit authorization context. In the durable record this is the exact
`change identifier`、`proposal 路徑`、`<owner>/<repo>`、`核准範圍` of the 目前 item;
the `proposal 路徑`、`已核准範圍` and `proposal GO evidence` must all match.
已記錄的明確 proposal GO 可沿用，不得重複詢問或重複取得 GO；mismatch remains
`AWAITING_GO` and follows `jt-flow-one`'s bounded safety exceptions. The
coordinator verifies `jt-flow-one` evidence but never initiates a second
implementation code review.

An owner that is not `SUCCESS` returns its precise state and evidence to the
coordinator. `ACTIVE` consumes one owner slot; `WAITING`, `BLOCKED`, `PAUSED`,
`FAILED`, `CANCELLED`, and `AWAITING_GO` release it. Continue isolated work for
unrelated ready changes; do not treat an item-local pause or failure as a global
queue stop.

## Phase 3 — one exact-SHA integration lane

An owner may return `INTEGRATION_READY` only after the fixed-state evidence
above. Before requesting an integration permit, it fetches remote main, proves
its item contains the verified main SHA or rebases, reruns required checks, and
reads current mergeability.

The coordinator issues at most one integration permit. The permit contains the
exact repository, change identifier, item HEAD SHA, and verified main SHA; only
the matching owner may merge or perform any production mutation. A changed item
HEAD invalidates the permit. A changed main SHA requires updating from current
main, rerunning required checks, fresh mergeability evidence, and a new permit;
neither SHA refresh needs a new proposal GO by itself.

Two `INTEGRATION_READY` items wait for this single lane rather than merge in
parallel. The permit holder merges or mutates production, verifies the target,
then archives. If it fails or is cancelled before any production mutation, the
coordinator may revoke the permit only after proving no production mutation
began. If mutation began, hold the lane until the target is verified healthy or
restored to a known rollback state. After a production mutation begins, an
unknown production state issues no new permit; unrelated development and tests
continue, but the integration lane is `WAITING` with an owner and resume
condition.

## Completion record

Report the dependency snapshot revision, every item state, relationship or GO
evidence, capacity allocation, integration permit evidence, affected descendants,
unmapped records, and any owner/resume condition. The first rollout against a
repository is read-only dependency-map validation; proposal edits, dispatch, and
production work require their separately authorized gates.
