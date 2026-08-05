## Why

Release 1.33.2 was recorded as "🎨 Styles — 統一 model: sonnet 前端 metadata 不加引號" while the
change actually added 72 lines of behavioral rules to two `jt-flow` Skills, and the version bumped
patch instead of the minor Conventional Commits rule 2 requires. Four verified gaps allowed it
(evidence in `verification-logs/`):

1. The squash subject was overwritten at merge time with the last commit's `style:` title. The PR
   title was correct, and the repository setting would have used it.
2. `release-please-config.json` accepts 8 commit types while `CLAUDE.md` allows 4. Nothing compares
   them, so the out-of-policy `style:` was accepted and given its own changelog section.
3. The `validate` pipeline checks plugin structure, version sync and Markdown only. No step
   inspects a commit or pull-request title.
4. `main` has no branch protection and no rulesets, so even a red pipeline cannot stop a merge.

Closes #181.

## What Changes

- Add `scripts/commit-types.mjs` as the single definition of the permitted types, with tests
  asserting `release-please-config.json` and `CLAUDE.md` both match it. Drift fails `npm test`.
- Add `scripts/validate-pr-title.mjs` and wire it into `validate` so a pull request whose title is
  not `feat`/`fix`/`docs`/`chore` fails CI before merge.
- Add `scripts/validate-squash-subject.mjs` on `push` to `main`, catching a `--subject` override
  that bypassed the pull-request title while the release PR is still editable.
- Remove `perf`, `refactor`, `style`, `test` from `release-please-config.json`.
- Set `squash_merge_commit_title` to `PR_TITLE`.
- Enable branch protection on `main` requiring the `continuous-integration/drone/pr` context, so
  the title check actually blocks merges.
- Correct the 1.33.2 `CHANGELOG.md` entry and its GitHub Release notes.

Affected plugin: none. Repository-level CI and release configuration only.

## Non-goals

- **Not** re-cutting 1.33.2 or moving its tag. Renumbering a published release costs more
  confusion than the inaccurate record does.
- **Not** widening the allowlist to `ci`/`refactor`. That means amending `CLAUDE.md` first — a
  separate decision, made cheap and explicit by the single-source design rather than pre-granted
  here.
- **Not** validating intermediate commits on a PR branch. They do not determine the squash result,
  and the specification permits maintainers to clean the message at merge time.
- **Not** judging whether a type is semantically correct. No checker can decide whether 72 lines of
  rules are `feat` or `style`; that judgment stays human.
- **Not** requiring pull-request review approvals or making `CodeRabbit` a required context. A solo
  maintainer cannot self-approve, and an external service under rate limits must not gate merges.
- **Not** migrating to GitHub Actions. `CLAUDE.md` forbids workflows overlapping Drone.
