## 1. Single definition of permitted commit types (TDD)

- [ ] 1.1 Write `scripts/commit-types.test.mjs` asserting: the exported list is exactly
      `feat`/`fix`/`docs`/`chore`; the types in `release-please-config.json` `changelog-sections`
      equal it; the types parsed from the `Commit types:` list in `CLAUDE.md` equal it. Run
      `node --test scripts/commit-types.test.mjs` and confirm it fails for the right reasons.
- [ ] 1.2 Write `scripts/commit-types.mjs` exporting `PERMITTED_COMMIT_TYPES` plus the helpers the
      tests need to read `release-please-config.json` and parse `CLAUDE.md`. Re-run until the
      definition assertion is green; the other two stay red until task 2.

## 2. Align the release configuration

- [ ] 2.1 Remove the `perf`, `refactor`, `style` and `test` entries from `changelog-sections` in
      `release-please-config.json`, leaving `feat`, `fix`, `docs` and `chore` (the latter keeping
      `"hidden": true`).
- [ ] 2.2 Re-run `node --test scripts/commit-types.test.mjs`; all three assertions now pass. Confirm
      `release-please-config.json` is still valid JSON.

## 3. Pull-request title checker (TDD)

- [ ] 3.1 Write `scripts/validate-pr-title.test.mjs` covering: each permitted type passes; a scope
      passes; a `!` breaking marker passes; `style`/`perf`/`refactor`/`test`/`ci` are rejected; a
      title with no type is rejected; the rejection message names both the observed title and the
      permitted set; a title matching `chore(main): release 1.34.0` passes.
- [ ] 3.2 Write `scripts/validate-pr-title.mjs` exporting a pure
      `validateTitle(title, types)` that imports `PERMITTED_COMMIT_TYPES` from
      `scripts/commit-types.mjs`, plus a CLI entry reading `DRONE_PULL_REQUEST` and
      `DRONE_PULL_REQUEST_TITLE`. Re-run until green.
- [ ] 3.3 Extend `scripts/validate-pr-title.test.mjs` for the three input states in design D6:
      empty `DRONE_PULL_REQUEST` skips; title present validates; `DRONE_PULL_REQUEST` set with an
      empty title fails. Implement until green.

## 4. Squash-subject checker on main (TDD)

- [ ] 4.1 Write `scripts/validate-squash-subject.test.mjs` covering: a conforming first line
      passes; an out-of-policy type fails; only the first line of a multi-line message is
      considered; `chore(main): release 1.34.0` passes.
- [ ] 4.2 Write `scripts/validate-squash-subject.mjs` reusing `validateTitle` from
      `scripts/validate-pr-title.mjs`, with a CLI entry reading `DRONE_COMMIT_MESSAGE` and running
      only when `DRONE_PULL_REQUEST` is empty. Re-run until green.

## 5. Wire both checkers into CI

- [ ] 5.1 Add `node scripts/validate-pr-title.mjs` and `node scripts/validate-squash-subject.mjs`
      as steps in the `validate` pipeline of `.drone.yml`, ordered before `npm run validate` so a
      bad title fails fast.
- [ ] 5.2 Run `bash scripts/validate-drone-yml.sh` and `node scripts/validate-drone-config.mjs`;
      confirm both pass with the new steps present.
- [ ] 5.3 Check whether `scripts/drone-ci-policy.test.mjs` asserts the `validate` step list; if it
      does, update its expectations and re-run `npm test`.

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
- [ ] 6.2 After the pull request's own `continuous-integration/drone/pr` check has passed at least
      once, enable branch protection on `main` with that single required context,
      `strict=false`, `enforce_admins=false`, `required_pull_request_reviews=null`,
      `allow_force_pushes=false`, `allow_deletions=false`. Read the protection back with
      `gh api repos/jurislm/jurislm-tools/branches/main/protection` and confirm every field.

## 7. Correct the 1.33.2 record

- [ ] 7.1 Replace the `### 🎨 Styles` block under `## [1.33.2]` in `CHANGELOG.md` with a
      `### 🚀 New Features` entry describing the closed-loop rules that actually shipped, keeping
      the version heading, date and commit link untouched.
- [ ] 7.2 After merge, update the Release notes for tag `v1.33.2` with `gh release edit` to match
      the corrected section, then read back with `gh release view v1.33.2 --json body`.

## 8. Verification

- [ ] 8.1 Run `npm run validate` and confirm `test`, `check:plugins`, `check:versions` and
      `lint:md` all pass.
- [ ] 8.2 Behaviorally verify both checkers by invoking them directly with environment values for
      each state in designs D4 and D6 plus one rejected title, capturing actual stdout/stderr and
      exit codes as evidence in `verification-logs/`.
- [ ] 8.3 Run `openspec validate add-commit-type-guardrails --strict`.
- [ ] 8.4 From the pull request's Drone build log, confirm the title step ran and that
      `DRONE_PULL_REQUEST_TITLE` was populated with this PR's title; record it in
      `verification-logs/` as live confirmation of the environ contract verified at proposal time.
- [ ] 8.5 After enabling protection, confirm `gh pr view <pr> --json mergeable,mergeStateStatus`
      still reports a mergeable state for this pull request, and record the values.
