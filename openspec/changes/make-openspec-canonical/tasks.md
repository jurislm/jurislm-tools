## 1. Establish the OpenSpec-only contract

- [x] 1.1 Update `jt-flow-one` so OpenSpec is the only required delivery record;
  make Issue links optional and remove Issue creation, synchronization, and
  closure gates.
- [x] 1.2 Update `jt-flow-all` so active OpenSpec changes, not open Issues, are
  the queue inventory and execution units.
- [x] 1.3 Remove Issue identity from delegated GO and team-mode contracts.
- [x] 1.4 Make OpenSpec the only planning pipeline for `jt-flow-one` while
  preserving its scoped execution and verification skills.

## 2. Synchronize repository guidance and specifications

- [x] 2.1 Update `plugins/jt-flow/README.md` and root `CLAUDE.md`.
- [x] 2.2 Update the three living policy surfaces through this change's delta
  specs and keep the OpenSpec artifact order canonical.
- [x] 2.3 Declare Delivery Relations and record the active conversion change as
  an integration blocker until its stale Issue-queue wording is reconciled.
- [x] 2.4 Update delta requirements that would otherwise retain the retired
  issue-confirmation and Step 5 terminology after archive.
- [x] 2.5 Delete only obsolete jt-flow `docs/superpowers/` planning documents,
  retain unrelated plugin design records, and clear stale archive references.

## 3. Verify the contract

- [x] 3.1 Update policy tests to reject Issue prerequisites and assert
  OpenSpec-derived queue identity.
- [x] 3.2 Run `openspec validate --all --strict`.
- [x] 3.3 Run `npm run validate`, `claude plugin validate .`, and `git diff --check`.

## 4. Archive acceptance gate

- [ ] 4.1 After `convert-jt-flow-commands-to-skills` is reconciled or archived,
  sync this change's deltas, manually update
  `openspec/specs/jt-flow-one-team-mode-dispatch/spec.md`'s Purpose from
  `Step 5` to `Phase 4`, and before archiving verify that
  `rg -n 'Step 5 code-review dispatch' openspec/specs/jt-flow-one-team-mode-dispatch/spec.md`
  has no output; rerun `node --test scripts/jt-flow-authorization-policy.test.mjs`
  and `openspec validate --all --strict`.
