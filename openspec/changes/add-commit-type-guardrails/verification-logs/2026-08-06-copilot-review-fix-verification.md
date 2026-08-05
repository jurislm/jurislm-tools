# 2026-08-06 Copilot review fix verification (PR #183)

Third review round. The coordinator had scanned issue comments and
CodeRabbit's inline thread on prior rounds but missed Copilot's inline
review; this log covers the one valid, non-stale Copilot finding.

Commit: (this round's `fix:` commit — see `git log` for the hash).

## Finding — ordering assertion in `scripts/validate-drone-config.mjs` was incomplete

The existing assertion only guaranteed both commit-type checkers ran before
`npm run validate`. It said nothing about their position relative to
`npm ci`, and nothing separately enforced `npm ci` before `npm run
validate` (that pair was previously only checked for *presence* via
`.includes`, not order). A checker moved to between `npm ci` and `npm run
validate` would still satisfy the old assertion while defeating the actual
design intent stated in the surrounding comment: fail before paying for a
dependency install.

### Confirmed the gap was real before touching any code

Built a fixture identical to the real `.drone.yml`'s `validate` pipeline
except with both checkers moved after `npm ci`, and ran it through the
**pre-fix** `validate-drone-config.mjs` directly:

```
$ node scripts/validate-drone-config.mjs fixture-checker-after-npm-ci.yml
validated fixture-checker-after-npm-ci.yml: validate + release
exit=0
```

Passed — confirming the gap Copilot identified was real, not a stale or
theoretical concern.

### TDD: two new tests in `drone-ci-policy.test.mjs`, confirmed red first

```
$ node --test scripts/drone-ci-policy.test.mjs
...
not ok 3 - the validator rejects the commit-type checkers running after npm ci (Copilot finding: incomplete ordering assertion)
not ok 4 - the validator rejects npm ci running after npm run validate
...
# tests 5
# pass 3
# fail 2
```

Both new fixtures failed for the right reason: `assert.notEqual(result.status,
0)` failed because the pre-fix validator accepted them (exit 0).

### Fix: assert the full three-link chain (checkers → npm ci → npm run validate)

Added two `requireValue` checks to `validate-drone-config.mjs`:

1. Both checkers must precede `npm ci` (not merely `npm run validate`).
2. `npm ci` must precede `npm run validate` (previously presence-only).

### Green after the fix, with actual output — not just green assertions

Per the coordinator's instruction to actually run the fixture and read the
output (the same discipline used to confirm task 5.3 in the prior round),
manually re-ran both fixtures directly through `validate-drone-config.mjs`
after the fix, not just through the test runner's pass/fail summary:

```
$ node scripts/validate-drone-config.mjs fixture-checker-after-npm-ci.yml
ERROR: the commit-type checkers must run before npm ci, not merely before npm run validate — otherwise a bad title still pays for the dependency install it was supposed to skip
exit=1

$ node scripts/validate-drone-config.mjs fixture-npmci-after-validate.yml
ERROR: npm ci must run before npm run validate
exit=1
```

`requireValue` is collection-style (`errors.push`, not throw-on-first), so
this also confirms the specific expected error string is actually present
in the collected output, not merely that *some* error fired.

```
$ node --test scripts/drone-ci-policy.test.mjs
...
ok 1 - the repository Drone configuration satisfies the CI and release contract
ok 2 - the validator rejects release-pr running before github-release
ok 3 - the validator rejects the commit-type checkers running after npm ci (Copilot finding: incomplete ordering assertion)
ok 4 - the validator rejects npm ci running after npm run validate
ok 5 - the validator rejects a second validate step that can escape isolation
# tests 5
# pass 5
# fail 0
```

Test 1 confirms the real `.drone.yml` still satisfies the strengthened
three-link chain (it does: checkers, then `npm ci`, then `npm run
validate`, in that exact order).

## Audit for the same class of gap elsewhere (per the coordinator's request to report proactively, not wait for a fourth round)

Reviewed every `requireValue` in `validate-drone-config.mjs` for a
partially-asserted multi-point invariant:

- `githubReleaseIndex < releasePrIndex` (release pipeline order) — a
  two-item chain; a single ordering check is already the complete
  invariant, no missing link.
- `release-pr` `depends_on` includes `github-release` — a presence check
  on Drone's actual DAG-scheduling field (the real execution-order
  authority when `depends_on` is set), not an ordering chain; already
  complete on its own.
- All other `requireValue` calls in this file are single-value equality or
  presence checks with no ordering component.

No other instance of the "asserts a subset of a longer invariant chain"
pattern found in this file, or in the other files this proposal
introduced (`commit-types.mjs`, `validate-pr-title.mjs`,
`validate-squash-subject.mjs` — none of these have step-ordering
semantics).

## Not touched, as instructed

The `validate-pr-title.mjs` `/^\s/` Copilot finding is the same issue as
CodeRabbit finding A, already fixed in `a5059cc` and confirmed by the
coordinator as marked outdated on that thread. No changes made here.

## Full suite

```
$ npm run validate
...
# tests 98
# pass 98
# fail 0

> check:plugins
Plugin repository validation passed

> check:versions
Version sync OK: 1.33.2

> lint:md
(no output — clean)
```

98 tests, up from 96 before this round (+2 in `drone-ci-policy.test.mjs`).

```
$ bash scripts/validate-drone-yml.sh
validated .drone.yml: validate + release
exit=0

$ openspec validate add-commit-type-guardrails --strict
Change 'add-commit-type-guardrails' is valid
```

## Not pushed

Per instruction, no `git push` was performed; the coordinator controls push
timing.
