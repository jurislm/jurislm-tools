# Tasks

## Phase 0 — preconditions (stop on failure)

- [x] `0.1` Read back the CLI flags. `coderabbit review --help`. **Expected:**
      option list contains `--committed`; `--type` appears nowhere.
      **Actual:** confirmed against CLI 0.7.3 on 2026-08-16 (Taiwan time); the
      option list is saved to
      `openspec/changes/fix-coderabbit-cli-flag/verification-logs/2026-08-16-cli-flag-readback.md`.
      **On failure:** stop.
- [x] `0.2` Enumerate every prescribed invocation **repo-wide**, not in one
      file: `git ls-files -z '*.md' | xargs -0 grep -n 'coderabbit review'`.
      **Expected:** every hit is either an already-correct `--help` preflight, a
      call site this change corrects, or a quoting context (archive / this
      change's own artifacts). **Actual:** hits in
      `plugins/jt-flow/skills/jt-flow-one/SKILL.md` (`:238` preflight — already
      correct; `:247` and `:479` — corrected here), `CLAUDE.md:216` (corrected
      here), plus quoting contexts. **On failure:** stop — an uncorrected site
      outside a quoting context means the fix is incomplete.
      ⚠️ The first draft scanned only `SKILL.md`, which is precisely why
      `CLAUDE.md:216` survived the first round; see `design.md` D2.

## Phase 1 — correct the skill

- [x] `1.1` In `plugins/jt-flow/skills/jt-flow-one/SKILL.md:247`, replace
      `--type committed` with `--committed`, and state that the spelling is read
      from `coderabbit review --help` at invocation time, never copied from a
      document.
- [x] `1.2` Apply the same correction and the same sentence at
      `plugins/jt-flow/skills/jt-flow-one/SKILL.md:479`.
- [x] `1.3` Correct `CLAUDE.md:216`, which prescribes the same command with no
      caveat and loads before any skill.
      **Actual:** now reads `--committed` plus the `--help` authority clause.
- [x] `1.4` Sweep **repo-wide**, not just `plugins/`:
      `grep -rn -- '--type committed' . --exclude-dir=.git --exclude-dir=node_modules`.
      **Expected:** hits only in `openspec/changes/archive/**` (historical
      counter-example, correctly preserved) and this change's own artifacts
      (which quote what is being fixed), plus the guard's own assertion in
      `scripts/jt-flow-review-policy.test.mjs`. **Actual:** exactly that — the
      archive verification-log, this change's `proposal.md` / `tasks.md` /
      `design.md` (the last one holds the search string inside D2's own grep
      command), and the test's `doesNotMatch` regex. No prescribing site
      remains.
      ⚠️ The first draft scoped this to `plugins/`, which is why `CLAUDE.md`
      was missed; see `design.md` D2.
- [x] `1.5` Satisfy `External tool invocations name their source of truth`:
      every corrected site states that the flag spelling is read from
      `coderabbit review --help` at invocation time and is never taken from
      this file, any document, or an archived change.
- [x] `1.6` Add machine enforcement in `scripts/jt-flow-review-policy.test.mjs`,
      matching this repository's convention of pinning each jt-flow policy with
      a node test. It asserts the durable invariant — every paragraph
      prescribing `coderabbit review --agent` also names
      `coderabbit review --help`, and neither the skill nor `CLAUDE.md` carries
      a spelling the current CLI rejects — rather than the literal flag, which
      would expire with the next CLI rename.
      **Actual:** `node --test scripts/jt-flow-review-policy.test.mjs` → 9 pass,
      0 fail. Positive control: adding one markdown file that prescribes the
      command without naming `--help` turns the run into 8 pass / 1 fail, and
      removing it restores 9 pass — so the test detects the regression rather
      than passing vacuously.
      ⚠️ The first implementation enumerated files with `git ls-files` and
      passed locally but failed CI (Drone build 125: `spawnSync git ENOENT` —
      the container has no `git`). Replaced with a `readdirSync` walk, which is
      also strictly stronger: it catches untracked files too.

## Phase 2 — validation

- [x] `2.1` `npm ci && npm run validate` from the repository root. **Actual:**
      plugin repository validation passed, version sync OK (1.38.0), markdownlint
      clean over the new OpenSpec artifacts.
- [x] `2.2` `claude plugin validate .` (validates `.claude-plugin/marketplace.json`). **Actual:** ✔ Validation passed.
- [x] `2.3` `spectra validate --strict fix-coderabbit-cli-flag` and
      `spectra analyze`. **Actual:** valid; analyze's only finding was the
      requirement-without-task warning, resolved by `1.5`.
- [x] `2.4` Confirm no release-managed version field was touched:
      `git diff origin/main -- '*/plugin.json' '.claude-plugin/marketplace.json'`
      **Actual:** empty (0 lines).

## Phase 3 — delivery

- [ ] `3.1` Commit as `fix:` (the prescribed command is incorrect behaviour, not
      maintenance), push, and open the PR against `main`.
- [ ] `3.2` Invoke `superpowers:requesting-code-review` through the Skill tool
      and disposition every finding.
- [ ] `3.3` Handle external reviewer comments per this repository's rules, then
      merge once the gates pass. Archiving follows in its own PR, matching this
      repository's existing pattern (#219, #222).
