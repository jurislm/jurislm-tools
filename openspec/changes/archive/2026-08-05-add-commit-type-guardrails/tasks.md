## 1. Single definition of permitted commit types (TDD)

- [x] 1.1 Write `scripts/commit-types.test.mjs` asserting: the exported list is exactly
      `feat`/`fix`/`docs`/`chore`; the types in `release-please-config.json` `changelog-sections`
      equal it; the types parsed from the `Commit types:` list in `CLAUDE.md` equal it. Run
      `node --test scripts/commit-types.test.mjs` and confirm it fails for the right reasons.
      **Done, commit `f56404b`.** Confirmed by reading the commit diff: adds
      `scripts/commit-types.test.mjs` (29 lines, three assertions) — TDD Red confirmed in the
      commit message ("went from 2/3 green to 3/3 ... because the two files must land together").
- [x] 1.2 Write `scripts/commit-types.mjs` exporting `PERMITTED_COMMIT_TYPES` plus the helpers the
      tests need to read `release-please-config.json` and parse `CLAUDE.md`. Re-run until the
      definition assertion is green; the other two stay red until task 2.
      **Done, commit `f56404b`.** Same commit adds `scripts/commit-types.mjs` (94 lines,
      `PERMITTED_COMMIT_TYPES` + `readReleasePleaseChangelogTypes` + `parseClaudeMdCommitTypes`).
      Re-verified 2026-08-06: `node --test scripts/commit-types.test.mjs` passes live.

## 2. Align the release configuration

- [x] 2.1 Remove the `perf`, `refactor`, `style` and `test` entries from `changelog-sections` in
      `release-please-config.json`, leaving `feat`, `fix`, `docs` and `chore` (the latter keeping
      `"hidden": true`).
      **Done, commit `f56404b`** (same commit as 1.1/1.2 — the definition and the config trim had
      to land together to keep `npm run validate` green). Confirmed by reading the current file:
      `changelog-sections` has exactly 4 entries (`feat`, `fix`, `docs`, `chore` with
      `"hidden": true`).
- [x] 2.2 Re-run `node --test scripts/commit-types.test.mjs`; all three assertions now pass. Confirm
      `release-please-config.json` is still valid JSON.
      **Done, commit `f56404b`.** Re-verified 2026-08-06: `node --test scripts/commit-types.test.mjs`
      passes (3/3) and `node -e "JSON.parse(...)"` confirms `release-please-config.json` is valid
      JSON.

## 3. Pull-request title checker (TDD)

- [x] 3.1 Write `scripts/validate-pr-title.test.mjs` covering: each permitted type passes; a scope
      passes; a `!` breaking marker passes; `style`/`perf`/`refactor`/`test`/`ci` are rejected; a
      title with no type is rejected; the rejection message names both the observed title and the
      permitted set; a title matching `chore(main): release 1.34.0` passes.
      **Done, commit `f3fbf2e`**, later strengthened by `439e299` (message clarity, defensive
      coercion, zero-width fix) and `a5059cc` (literal-space separator, CodeRabbit finding A).
      Confirmed by grep: all listed cases present as named tests.
- [x] 3.2 Write `scripts/validate-pr-title.mjs` exporting a pure
      `validateTitle(title, types)` that imports `PERMITTED_COMMIT_TYPES` from
      `scripts/commit-types.mjs`, plus a CLI entry reading `DRONE_PULL_REQUEST` and
      `DRONE_PULL_REQUEST_TITLE`. Re-run until green.
      **Done, commit `f3fbf2e`**, same later strengthening as 3.1. Re-verified 2026-08-06:
      `node --test scripts/validate-pr-title.test.mjs` passes (23/23 as of this session).
- [x] 3.3 Extend `scripts/validate-pr-title.test.mjs` for the three input states in design D6:
      empty `DRONE_PULL_REQUEST` skips; title present validates; `DRONE_PULL_REQUEST` set with an
      empty title fails. Implement until green.
      **Done, commit `f3fbf2e`.** Confirmed by grep: all three named tests present
      ("DRONE_PULL_REQUEST empty skips the check", "...validates and passes",
      "...fails loudly rather than skipping").

## 4. Squash-subject checker on main (TDD)

- [x] 4.1 Write `scripts/validate-squash-subject.test.mjs` covering: a conforming first line
      passes; an out-of-policy type fails; only the first line of a multi-line message is
      considered; `chore(main): release 1.34.0` passes.
      **Done, commit `36b912b`.** Confirmed by grep: all four named tests present, plus one added
      later (`a5059cc`) confirming this file shares CodeRabbit finding A's fix via the imported
      `validateTitle` rather than assuming it.
- [x] 4.2 Write `scripts/validate-squash-subject.mjs` reusing `validateTitle` from
      `scripts/validate-pr-title.mjs`, with a CLI entry reading `DRONE_COMMIT_MESSAGE` and running
      only when `DRONE_PULL_REQUEST` is empty. Re-run until green.
      **Done, commit `36b912b`.** Confirmed by reading the file: imports `validateTitle`, CLI
      entry reads `DRONE_COMMIT_MESSAGE`, `checkSquashSubject` returns early when
      `DRONE_PULL_REQUEST` is non-empty. Re-verified 2026-08-06:
      `node --test scripts/validate-squash-subject.test.mjs` passes (6/6).

## 5. Wire both checkers into CI

- [x] 5.1 Add `node scripts/validate-pr-title.mjs` and `node scripts/validate-squash-subject.mjs`
      as steps in the `validate` pipeline of `.drone.yml`, ordered before `npm run validate` so a
      bad title fails fast.
      **Done, commit `9d9d2cb`.** Confirmed by reading the current `.drone.yml`: both commands are
      present in the single `validate` step, ordered before `npm ci`/`npm run validate`.
- [x] 5.2 Run `bash scripts/validate-drone-yml.sh` and `node scripts/validate-drone-config.mjs`;
      confirm both pass with the new steps present.
      **Done, commit `9d9d2cb`** (adds the ordering/presence assertions to
      `validate-drone-config.mjs`). Re-verified 2026-08-06 live: both commands exit 0 against the
      current `.drone.yml`.
- [x] 5.3 Check whether `scripts/drone-ci-policy.test.mjs` asserts the `validate` step list; if it
      does, update its expectations and re-run `npm test`.
      **Checked, condition does not apply — verified independently, not taken on faith.**
      `commands: [npm ci, npm run validate]` in `drone-ci-policy.test.mjs`'s two fixtures is
      negative-test input (deliberately missing the two checkers), not an expectation about the
      real `.drone.yml`. `requireValue` in `validate-drone-config.mjs` is collection-style
      (`errors.push`, not throw-on-first). Ran the "release-pr before github-release" fixture
      directly through `validate-drone-config.mjs`: it produces exactly 8 errors, including
      `"github-release must run before release-pr"`, which is what
      `assert.match(..., /github-release.*before.*release-pr/i)` checks for — so the fixture test
      still passes correctly even without the two new checker commands. What actually guards the
      new assertions is the *first* test, which asserts `status === 0` against the real
      `.drone.yml`. Re-verified 2026-08-06: `node --test scripts/drone-ci-policy.test.mjs` passes
      (3/3) with no changes to that file.

## 6. Repository settings

- [x] 6.1 Set `squash_merge_commit_title` to `PR_TITLE` via
      `gh api repos/jurislm/jurislm-tools -X PATCH -f squash_merge_commit_title=PR_TITLE`, then
      read it back and confirm the value.
      **Done 2026-08-05, ahead of the other phases.** This task touches no repository file and
      does not depend on the toolchain, so it was executed early to cover the bun-migration pull
      request itself. Read-back evidence: before
      `{"squash_merge_commit_title":"COMMIT_OR_PR_TITLE"}` → after
      `{"squash_merge_commit_title":"PR_TITLE"}`
      (`squash_merge_commit_message` unchanged at `COMMIT_MESSAGES`).
- [x] 6.2 After the pull request's own `continuous-integration/drone/pr` check has passed at least
      once, enable branch protection on `main` with that single required context,
      `strict=false`, `enforce_admins=false`, `required_pull_request_reviews=null`,
      `allow_force_pushes=false`, `allow_deletions=false`. Read the protection back with
      `gh api repos/jurislm/jurislm-tools/branches/main/protection` and confirm every field.
      **Done 2026-08-06, after PR #183's own `continuous-integration/drone/pr` check had passed.**
      Read-back evidence (`gh api repos/jurislm/jurislm-tools/branches/main/protection`):
      `required_status_checks.contexts=["continuous-integration/drone/pr"]`,
      `required_status_checks.strict=false`, `enforce_admins.enabled=false`,
      `required_pull_request_reviews=null` (absent from the response, i.e. not required),
      `allow_force_pushes.enabled=false`, `allow_deletions.enabled=false`. Every field matches
      the values specified above.

## 7. Correct the 1.33.2 record

- [x] 7.1 Replace the `### 🎨 Styles` block under `## [1.33.2]` in `CHANGELOG.md` with a
      `### 🚀 New Features` entry describing the closed-loop rules that actually shipped, keeping
      the version heading, date and commit link untouched.
      **Done, commit `a403de2`.** Confirmed by reading the current `CHANGELOG.md`: the `[1.33.2]`
      entry is now `### 🚀 New Features` / "阻塞時走封閉迴圈，不停在問題回報", with the version
      heading, `(2026-08-05)` date, and `25e6bc2` commit link unchanged.
- [x] 7.2 After merge, update the Release notes for tag `v1.33.2` with `gh release edit` to match
      the corrected section, then read back with `gh release view v1.33.2 --json body`.
      **Done 2026-08-05, after PR #183 merged.** The notes now read
      `### 🚀 New Features` / `* **jt-flow:** 阻塞時走封閉迴圈，不停在問題回報 ([25e6bc2](...))`,
      matching the corrected `CHANGELOG.md` section verbatim. Read back with
      `gh release view v1.33.2 --json body` to confirm.
      ⚠️ Verified the tag itself was **not** moved: `v1.33.2` still points at `c11b5e9`, per the
      proposal's Non-goal of not re-cutting the published release.

## 8. Verification

- [x] 8.1 Run `npm run validate` and confirm `test`, `check:plugins`, `check:versions` and
      `lint:md` all pass. Also run `claude plugin validate .` (repository coding guideline for
      changes touching `**/*.{json,yml,yaml,js,mjs,md}`) and record its output in
      `verification-logs/`; if the command is unavailable in the executing environment, record
      that fact and the reason instead of skipping it silently.
      **Done.** Live re-run 2026-08-06: `npm run validate` → 96/96 tests, `check:plugins`,
      `check:versions` (`Version sync OK: 1.33.2`), `lint:md` all pass. `claude plugin validate .`
      is available (`/Users/terrychen/.local/bin/claude`, v2.1.221) and passes ("✔ Validation
      passed"); output recorded in
      `verification-logs/2026-08-06-coderabbit-review-fixes-verification.md`.
- [x] 8.2 Behaviorally verify both checkers by invoking them directly with environment values for
      each state in designs D4 and D6 plus one rejected title, capturing actual stdout/stderr and
      exit codes as evidence in `verification-logs/`.
      **Done.** Evidence across three logs: `2026-08-05-implementation-verification.md` (initial
      D4/D6 states + rejected title), `2026-08-06-review-fixes-verification.md` (Chinese-title and
      zero-width-space cases), `2026-08-06-coderabbit-review-fixes-verification.md` (tab/newline/
      full-width-space separator cases). Confirmed present via `ls verification-logs/`.
- [x] 8.3 Run `openspec validate add-commit-type-guardrails --strict`.
      **Done.** Live re-run 2026-08-06: `openspec validate add-commit-type-guardrails --strict` →
      `Change 'add-commit-type-guardrails' is valid`.
- [x] 8.4 From the pull request's Drone build log, confirm the title step ran and that
      `DRONE_PULL_REQUEST_TITLE` was populated with this PR's title; record it in
      `verification-logs/` as live confirmation of the environ contract verified at proposal time.
      **Done.** Independently pulled from the Drone API (not copied from a pasted excerpt):
      `GET /api/repos/jurislm/jurislm-tools/builds/25/logs/1/2` (stage 1 "validate", step 2
      "validate") shows:
      ```
      + node scripts/validate-pr-title.mjs
      PR title OK: "feat(ci): 為 commit type 建立自動護欄，避免 CHANGELOG 與版號失準"
      + node scripts/validate-squash-subject.mjs
      DRONE_PULL_REQUEST is set ("183"); this is a pull-request build, not a push to main. Skipping the squash-subject check (validate-pr-title.mjs already covers it).
      + npm ci
      ```
      Confirms `DRONE_PULL_REQUEST_TITLE` was populated with PR #183's real title in production
      CI, and both checkers ran (and passed) before `npm ci` with no dependency ordering problem.
      The full 599-line step log ends with `npm run validate` completing successfully.
- [x] 8.5 After enabling protection, confirm `gh pr view <pr> --json mergeable,mergeStateStatus`
      still reports a mergeable state for this pull request, and record the values.
      **Done 2026-08-06.** `gh pr view 183 --json mergeable,mergeStateStatus` initially read back
      `mergeable=MERGEABLE`, `mergeStateStatus=UNSTABLE` (UNSTABLE caused by the non-required
      CodeRabbit check, not by the newly enabled required context; does not affect mergeability).
      Re-read at verification time now reports `mergeable=MERGEABLE`, `mergeStateStatus=CLEAN`.
