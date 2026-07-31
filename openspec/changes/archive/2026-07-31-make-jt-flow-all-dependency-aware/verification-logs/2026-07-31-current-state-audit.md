# Current-state audit — 2026-07-31

## Repositories and revisions

- `jurislm/jurislm-tools`: clean `main` and `origin/main` at `fa4df7b97ab0d337642b8298984f1746a79b54f1` before this change.
- `jurislm/entire`: refreshed `origin/main` at `5339bfbbf11f2896d18d8b294792c4cc01faff22` during the audit.
- The `entire` caller worktree was `ahead 2, behind 69` with user-owned OpenSpec archive changes. Its local `openspec list` reported 13 active directories; `git ls-tree origin/main:openspec/changes` showed 10 active changes.

## Policy root cause

The released `jt-flow-all` Skill at baseline:

- lines 33–35: preserves recorded active-change order and forbids dependency or priority reordering;
- lines 46–54: keeps queue items in the current primary agent and forbids item subagents;
- lines 62–66: lets paused/blocked/failed/cancelled stop the entire queue and forbids parallel delivery.

`scripts/jt-flow-queue-execution.test.mjs` asserts those same constraints, proving this is deliberate policy rather than a host capacity limitation.

## Verified current dependency findings

- `#855` is `ACTIVE` at 10/21; its next production gate is Task 1.5 and it directly blocks `#898`.
- `#898` is `BLOCKED`, not merely waiting: its proposal/design/tasks require `#855` durable handoff and deadline/manual-review outputs removed by the current `#855` proposal. Its durable GO names an old change suffix and cannot be reused.
- `#825` waits for `#898` representative runtime evidence.
- Within `#777`, only the topology-evidence tasks wait for `#855 → #898`; documents, aiDraft, completion, monitoring, polling resilience, batch observability, and privacy have independent ready work.
- Within `#778`, only the full AI paywall path waits for `#777` aiDraft. Billing core can proceed independently; pricing, quota, and Stripe credentials are external blockers. Shared UI, a11y, console polish, and mobile are not billing-MVP prerequisites.
- `#818` precedes the remaining `#843` checkpoint-cost/zombie settlement work.
- `#917` catalog cleanup should precede the `#785` Prisma baseline.
- `#894` is technically ready but lacks exact GO; `#774`, `#773`, `#785`, and `#965` are paused or deferred under the current MVP.

## Workload signals

- Refreshed `entire` contained 10 active changes with 27/205 tasks complete and 178 remaining.
- `#777` and `#778` were 51-task and 36-task multi-capability changes, respectively.
- Recent delivery history contained repeated release/documentation amplification and checkpoint-recovery implementation later retired; the audit treats these as reasons to keep the new orchestration policy minimal.

## Scope boundary

This change modifies Markdown Skills, policy tests, documentation, and OpenSpec contracts only. It does not execute `entire` production operations or product implementation. `entire` relationship backfill remains fail-closed until a docs-only artifact merge cannot unintentionally redeploy production workloads.
