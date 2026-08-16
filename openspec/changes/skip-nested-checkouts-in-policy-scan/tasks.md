# Tasks

## Phase 0 — reproduce (stop on failure)

- [x] `0.1` Reproduce the false red. Run
      `node --test scripts/jt-flow-review-policy.test.mjs` in a working tree
      that has sibling worktrees under `.claude/worktrees/`. **Expected:**
      `fail 1`. **On failure:** stop — nothing to fix.
      **Actual:** `fail 1`, message `a paragraph prescribes the CLI without
      naming --help as the authority for its flag spelling`, pointing at
      `.claude/worktrees/research-spectra-stale-in-progress-markers/CLAUDE.md`.
      ⚠️ It is the `--help` assertion that fires, not the stale-spelling one —
      two stale copies contain no `coderabbit review --help` at all and that
      assertion runs first.
- [x] `0.2` Confirm every hit is inside a nested checkout:
      `grep -rln -- '--type committed' .claude/`. **Expected:** only
      `.claude/worktrees/<branch>/…` paths. **On failure:** stop — a hit outside
      a nested checkout is a real uncorrected site.
      **Actual:** all hits under
      `.claude/worktrees/research-spectra-stale-in-progress-markers/` and
      `.claude/worktrees/remove-superpowers-plan-spec-flow/`.

## Phase 1 — fix the scan range

- [x] `1.1` In `scripts/jt-flow-review-policy.test.mjs`, make `walk()` skip any
      directory containing a `.git` entry, alongside the existing `node_modules`
      and `.git` exclusions. Do not name `.claude` or `.claude/worktrees` —
      `git worktree add` accepts any path.
      **Actual:** added `isCheckout(dir)` — a directory containing a `.git`
      entry is skipped.
- [x] `1.2` Re-run the test in the tree with nested worktrees.
      **Actual:** 9 pass, 0 fail (was `fail 1` before the change).
- [x] `1.3` Re-run the original positive control in the same tree: add one
      markdown file that prescribes `coderabbit review --agent` without naming
      `coderabbit review --help`, confirm the run turns red, then remove it and
      confirm it returns to green. Skipping nested checkouts must not have
      become skipping the check.
      **Actual:** with the probe file present → 8 pass / 1 fail; removed →
      9 pass / 0 fail. Both runs in the tree that has nested worktrees, so the
      control exercises the same code path as the fix.

- [x] `1.4` Replace the hardcoded quoting exemption
      (`openspec/changes/fix-coderabbit-cli-flag/`) with the structural one
      (`openspec/changes/`). Found while running `2.1`: this change's own
      artifacts quote the stale spelling and were flagged.
      **Actual:** `isQuotingContext` now tests the `openspec/changes/` prefix.
- [x] `1.5` Re-run both positive controls after widening the exemption, to prove
      it did not disable the check. **Actual:** reintroducing `--type committed`
      into the skill → 8 pass / 1 fail; a new document prescribing the command
      without `--help` → 8 pass / 1 fail; clean → 9 pass / 0 fail.

- [x] `1.6` Narrow the exemption after review: archived changes exempt from both
      assertions, active change artifacts exempt only from the stale-spelling
      one. The blanket version let an `openspec/changes/<active>/tasks.md`
      prescribing the command without `--help` pass silently — the file
      `spectra-apply` executes line by line.
- [x] `1.7` Update `External tool invocations name their source of truth` via
      `specs/jt-flow-review-orchestration/spec.md` delta, recording the widened
      exclusion clause. **The earlier claim that the contract was
      unchanged was wrong**: the living spec excluded only archived changes and
      the change performing the correction, not every change artifact.
- [x] `1.8` Re-run all four probes in the tree with nested worktrees.
      **Actual:** baseline 9 pass; active-change `tasks.md` without `--help`
      → 8 pass / 1 fail; active-change quoting `--type committed` → 9 pass;
      skill reverted to `--type committed` → 8 pass / 1 fail.

## Phase 2 — validation

- [x] `2.1` `npm run validate` from the repository root. **Actual:** 170 pass /
      0 fail; plugin repository validation passed; version sync OK (1.38.1).
- [x] `2.2` `claude plugin validate .`. **Actual:** ✔ Validation passed.
- [x] `2.3` `spectra validate --strict skip-nested-checkouts-in-policy-scan` and
      `spectra analyze`. **Actual:** valid; analyze reports no issues. The
      `No delta specs found` warning is expected — see the proposal's
      **No spec delta** section.
- [x] `2.4` Confirm no release-managed version field was touched:
      `git diff origin/main -- '*/plugin.json' '.claude-plugin/marketplace.json'`
      **Actual:** empty (0 lines).

## Phase 3 — delivery

- [ ] `3.1` Commit as `fix:` (the guard misreports, which is incorrect
      behaviour), push, and open the PR against `main`.
- [ ] `3.2` Invoke `superpowers:requesting-code-review` through the Skill tool
      and disposition every finding.
- [ ] `3.3` Handle external reviewer comments per this repository's rules, then
      merge once the gates pass. Archiving follows in its own PR, matching this
      repository's existing pattern.
