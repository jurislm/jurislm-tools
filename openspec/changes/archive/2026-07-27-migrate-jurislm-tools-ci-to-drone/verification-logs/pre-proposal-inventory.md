# Pre-proposal inventory: Drone CI migration

Date: 2026-07-27 (Asia/Taipei)

## Repository state

- Source revision: `origin/main` at `5a7c25c`.
- Isolated branch/worktree:
  `codex/migrate-jurislm-tools-ci-to-drone` /
  `.claude/worktrees/migrate-jurislm-tools-ci-to-drone`.
- Tracking issue: #172.
- Existing automation:
  - `.github/workflows/version-check.yml`: pull-request `npm ci` and
    `npm run validate` on Node 22.
  - `.github/workflows/release.yml`: `googleapis/release-please-action@v4` on
    pushes to `main` and manual dispatch.
- Existing aggregate validation includes Node tests, plugin integrity,
  Release Please version synchronization, and Markdown lint.

## Live external state

- PR #171 `validate` failed before runner startup with GitHub's account
  billing/spending-limit annotation.
- The `main` branch has no branch-protection rule, so no required status context
  needs replacement during this migration.
- `drone info` authenticates as repository owner.
- `drone repo info jurislm/jurislm-tools` confirmed that the public repository
  was visible in Drone's synchronized repository list, but its config field was
  empty. This did not prove activation; the live cutover later established the
  distinction.
- `drone build ls jurislm/jurislm-tools --limit 5` returned no builds.
- `drone secret ls jurislm/jurislm-tools` returned no repo-scoped secrets.
- A local variable named `JURISLM_DRONE_RELEASE_PLEASE_TOKEN` exists; its value
  was not read or printed.

## Reference findings

- `entire/.drone.yml` uses pull-request refs plus `main` push refs for checks.
- Its corrected release pipeline runs `github-release` before `release-pr` and
  passes config, manifest, repository URL, and explicit target branch.
- `entire/scripts/validate-drone-yml.sh` combines `drone lint` with structural
  trigger/pipeline assertions.
- `jurislm-tools` has no application deployment or npm publication target, so
  `entire` build, database, deploy, and monorepo pipelines are out of scope.
- Current `repo-standards` text defaults plugin repositories to GitHub Actions;
  the proposed explicit Drone variant therefore requires standards
  synchronization in the same change.
