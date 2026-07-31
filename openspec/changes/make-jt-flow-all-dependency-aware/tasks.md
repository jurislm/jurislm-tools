## Task 1: Preserve history and approve the successor contract

- [x] 1.1 Sync and archive `openspec/changes/delegate-jt-flow-all-to-one/` into the dated archive while preserving its requirements in `openspec/specs/jt-flow-queue-delegation/spec.md`.
- [x] 1.2 Create `jurislm/jurislm-tools#175` and record the current-state evidence plus exact proposal GO in `openspec/changes/make-jt-flow-all-dependency-aware/verification-logs/`.
- [x] 1.3 Strictly validate `openspec/changes/make-jt-flow-all-dependency-aware/` and obtain one independent overdesign review before changing either Skill.

## Task 2: Make queue dispatch dependency-aware

- [x] 2.1 Add RED policy-contract assertions and fixed input/expected-state cases in `scripts/jt-flow-queue-execution.test.mjs` for clean refreshed-remote inventory, relation validation, whole-change dispatch, descendant-only blocking, pause/failure isolation, bounded capacity, integration-only conflict serialization, and safe permit release after failure; do not claim to test a runtime scheduler.
- [x] 2.2 Replace the serial queue contract in `plugins/jt-flow/skills/jt-flow-all/SKILL.md` with the approved change-level graph, fixed state table, coordinator capacity rule, item-owner handoff, and single integration lane bound to fresh item and main SHAs.
- [x] 2.3 Run `node --test scripts/jt-flow-queue-execution.test.mjs` and refactor only enough to keep the dependency-aware contract clear and portable.

## Task 3: Preserve single-item gates without duplicating review

- [ ] 3.1 Add RED policy coverage in `scripts/jt-flow-authorization-policy.test.mjs` for item-local GO mismatch and permits bound to exact repo, change, item HEAD, refreshed main, mergeability, and fresh required checks.
- [ ] 3.2 Add RED policy coverage in `scripts/jt-flow-review-policy.test.mjs` for one proposal overdesign reviewer, `jt-flow-one`-only code-quality review, and Copilot quota-exhausted skip behavior.
- [ ] 3.3 Update `plugins/jt-flow/skills/jt-flow-one/SKILL.md` so delegated owners start from clean main, create their own isolated worktree, stop at `INTEGRATION_READY`, and integrate only under a matching current-item/current-main permit, without weakening proposal GO, TDD, review, CI, deploy, or archive gates.
- [ ] 3.4 Run the focused authorization, review-policy, and queue-execution tests and keep one effective implementation-quality review per code batch.

## Task 4: Align documentation and living policy

- [ ] 4.1 Update `plugins/jt-flow/README.md` and repository `README.md` so they describe dependency-aware dispatch and serialized integration instead of immutable ordered completion.
- [ ] 4.2 Update repository `CLAUDE.md` to require clean refreshed-remote snapshots, proposal `Delivery Relations`, item-local blocking, and one integration lane.
- [ ] 4.3 Confirm the active delta cleanly targets `openspec/specs/jt-flow-queue-delegation/spec.md`; keep the living spec at deployed behavior until archive applies the successor requirements.

## Task 5: Verify, release, and record rollout boundaries

- [ ] 5.1 Run `node --version`, `npm ci`, `npm run validate`, `claude plugin validate .`, `openspec validate make-jt-flow-all-dependency-aware --strict`, the repository secret scan, and the final whole-branch quality review owned by this item's `jt-flow-one` delivery.
- [ ] 5.2 Update `jurislm/jurislm-tools#175` with verified implementation and PR evidence, then complete PR, CI, review, merge, Release Please publication, plugin update, and installed-Skill readback without editing release versions manually.
- [ ] 5.3 After the plugin release, backfill only existing `jurislm/entire` Issues from refreshed `origin/main`; retain proposal edits as a follow-on rollout gate until docs-only merges cannot trigger unsafe deployment.
- [ ] 5.4 Run a read-only dependency-map acceptance for `#855`, `#898` artifact reconciliation, and `#777/#778` MVP relations; record that relation analysis is not partial execution and leave all item dispatch, proposal edits, and production work to a separately authorized follow-on rollout.
