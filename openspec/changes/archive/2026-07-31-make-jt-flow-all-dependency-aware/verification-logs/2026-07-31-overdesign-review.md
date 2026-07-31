# Overdesign review

## Revision 1

- Reviewer: independent architecture reviewer
- Result: changes required before implementation
- Critical findings:
  - A change-level queue could not safely dispatch only the ready tasks inside oversized `#777/#778`; doing so would create the task scheduler excluded by the MVP.
  - A permit bound only to item HEAD did not prove compatibility with a newer remote main or cover every production mutation.
- Important findings:
  - Acceptance dependencies and external blockers lacked deterministic gate semantics.
  - Worktree creation conflicted with the existing `jt-flow-one` clean-main preflight.
  - Reviewer ownership and static policy-test limits were ambiguous.

## Resolution

- Keep each whole active change as one execution unit; partial readiness requires an approved smaller change.
- Define hard dependencies as dispatch gates, acceptance dependencies as integration gates, and each external blocker with an explicit dispatch or integration gate.
- Start owners from clean main and let `jt-flow-one` create the item worktree.
- Bind the single permit to current item and main SHAs after refresh/rebase, current mergeability, and fresh required checks; all production mutation requires that lane.
- Treat Node tests as policy-contract assertions with fixed state tables, not runtime scheduler proof.
- Keep proposal review independently appointed by the coordinator and all code-quality review owned by the item `jt-flow-one` flow.

## Revision 2

- Result: two remaining Important findings.
- Resolution:
  - A permit may be revoked only after proving no production mutation began; otherwise the lane remains waiting until health or a known rollback state is proven. Unrelated development may continue, but this is an explicit safety exception to integration isolation.
  - The first `entire` acceptance is read-only map validation. Proposal edits, item dispatch, and production work require a separately authorized rollout.

## Revision 3

- Result: PASS.
- The reviewer confirmed that all earlier findings are closed and the scope remains a change-level Markdown policy MVP with no scheduler, service, database, or host-specific API.
