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

Invoking or routing to `jt-flow-all` authorizes queue coordination but does not
itself prove CodeRabbit consent. Only durable evidence proving that the user saw
the complete `jt-flow-one` disclosure and explicitly consented permits
`codeRabbitAuthorization=preauthorized` with
`authorizationSource=explicit-coderabbit-consent` for items in the same target
repository.

Otherwise pass `codeRabbitAuthorization=requires-disclosure`. The owner must
include the disclosure in its proposal summary and receive consent in that same
proposal GO. This adds no checkpoint and must not defer consent until after GO.
Skill names or internal handoffs never prove consent.

## 遇到阻塞時的封閉迴圈

與 `jt-flow-one` 同一條規則，coordinator 層一樣適用：**阻塞不是停下回報的理由**。
走 `查資料 → 分析根因 → 修正 → 繼續` 的迴圈，終止條件是**目標達成**，不是「問題已釐清」。

外部系統行為不確定時，**Context7／Exa／Firecrawl 各派一個 `model: "sonnet"` agent
平行查再交叉比對**——不是查不到才換下一個，三者強項不同（官方文件／搜尋摘要／整頁全文）。
明確區分「官方明說」與「社群推測」，查不到就說查不到。

⚠️ **「環境問題」是最容易被用來合理化停止追查的標籤**。判定之前先問「這一步的目的是什麼、
真的需要那個壞掉的東西嗎」——多數時候有繞過壞掉部分的路徑。環境類修正優先用
env var／臨時設定檔／單次指令參數，不動使用者的全域設定（尤其安全性相關者）。

完整說明見 `jt-flow-one` 的同名段落。

**coordinator 專屬的界線**：這條規則作用於**單一 item 內部**的阻塞。
若阻塞來自 dependency snapshot 失效、integration permit 條件不成立、或 remote main
drift，那些有各自明確的處置（重建 snapshot、重新取得 permit、rebase 後重跑
required checks），依既有規則執行，不適用本段的自由裁量。

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
   Hard-dependency, acceptance-only and mixed hard/acceptance cycles are all
   invalid; they block cycle members and their descendants while unrelated
   nodes remain eligible. Affected-area overlap is a coordination warning, not
   a hard dependency: analysis and isolated implementation may proceed, but
   rebase, merge, and production mutation stay serialized.
5. Before dispatch, appoint one independent proposal-scope overdesign reviewer
   for the current material proposal revision. The review asks whether scope is
   too broad, duplicates capabilities, or puts deferred work on the MVP path.
   Repeat only after material scope, architecture, dependency, or production
   risk changes. External-review quota exhaustion uses the existing bounded
   skip rules and does not permanently block the queue.
6. Before every subsequent dispatch or integration-permit decision, reread
   remote main. Any SHA drift invalidates the whole dependency snapshot. Rebuild
   the clean snapshot, active changes, Delivery Relations, reverse edges,
   descendants, and eligibility before proceeding. The refreshed graph may
   reclassify an `ACTIVE` or `INTEGRATION_READY` item; stale state is not
   authoritative.

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
| Acceptance-only dependency cycle | `BLOCKED`; invalid integration deadlock, with cycle members and descendants recorded |
| Mixed hard/acceptance dependency cycle | `BLOCKED`; invalid dispatch/integration deadlock, with cycle members and descendants recorded |
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

## Phase 2 — dependency-aware coordinator dispatch and bounded item ownership

The primary agent is the coordinator and reserves one available agent slot.
Each remaining available slot may own one `READY` change. Before any delegated
fetch or feature-worktree mutation, compare durable proposal GO with the exact
change identifier, proposal path, primary Issue, target repository, and approved
scope. A missing, mismatched, or unverifiable field returns item-local
`AWAITING_GO` before any worktree creation; descendants wait while unrelated
`READY` changes continue.

Only after that comparison makes the item `READY` may its owner start from the
target repository's clean main checkout, fetch remote main, resolve and record
the exact remote-main SHA/ref, and ask `jt-flow-one` to create and own the item's
isolated feature worktree from that ref. When the host has no delegation
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
its item contains the refreshed main SHA or rebases, determines the exact
current required-check set, waits for every required check to reach terminal
success, and reads current mergeability. Evidence records the exact repository,
change identifier, item HEAD SHA, refreshed main SHA, required-check set,
per-check terminal-success conclusions, current mergeability result, and
readback time.

The coordinator issues at most one integration permit and fails closed. It must
reread every bound field at permit grant and again immediately before merge or
any production mutation. Only the matching owner may integrate.

| Permit evidence fixture | Decision |
| --- | --- |
| Exact current repository, change, item HEAD, refreshed main, required-check set and terminal-success results, mergeable result, and fresh readback time | `GRANT` |
| Current required-check set differs from the recorded set | `WITHHOLD_OR_INVALIDATE` |
| Any required check is pending, failed, unknown, non-terminal, missing, or bound to another item HEAD | `WITHHOLD_OR_INVALIDATE` |
| Item HEAD differs from permit evidence | `INVALIDATE` |
| Remote-main SHA differs from permit or dependency snapshot | `INVALIDATE_AND_REBUILD` |
| Mergeability is unknown or non-mergeable | `WITHHOLD_OR_INVALIDATE` |
| Permit evidence readback time is missing or stale | `WITHHOLD_OR_INVALIDATE` |

Item-HEAD drift requires fresh integration evidence, not a new proposal GO.
Remote-main drift invalidates both permit and dependency snapshot: rebuild the
snapshot, relations, descendants, and eligibility before rebase, required-check
reruns, fresh mergeability readback, and any new permit.

Two `INTEGRATION_READY` items wait for this single lane rather than merge in
parallel. Lane release follows these fixed evidence decisions:

| Lane evidence fixture | Decision |
| --- | --- |
| No merge, no production mutation, and no derived downstream pipeline began | `REVOKE` |
| A merge occurred | `HOLD` |
| A production mutation occurred | `HOLD` |
| A derived downstream pipeline began | `HOLD` |
| All downstream CI and deployment are verified healthy | `RELEASE_AFTER_VERIFICATION` |
| The system is restored to a known rollback state | `RELEASE_AFTER_ROLLBACK` |

The coordinator may revoke a stopped or cancelled permit only under the
`REVOKE` row. Once merge, production mutation, or a derived CI, release,
deployment, or other downstream pipeline begins, the lane stays held until a
release row is proved. Unknown merge, pipeline, or production state issues no
new permit; unrelated development and tests continue, but the integration lane
is `WAITING` with an owner and resume condition.

## Completion record

Report the dependency snapshot revision, every item state, relationship or GO
evidence, capacity allocation, integration permit identity/check/mergeability/
readback evidence, lane and downstream-pipeline state, affected descendants,
unmapped records, and any owner/resume condition. The first rollout against a
repository is read-only dependency-map validation; proposal edits, dispatch,
and production work require their separately authorized gates.
