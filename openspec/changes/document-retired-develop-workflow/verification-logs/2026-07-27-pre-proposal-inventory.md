# Pre-proposal inventory

Date: 2026-07-27 (Asia/Taipei)

## Repository and branch model

- Repository: `jurislm/jurislm-tools`
- Default branch: `main`
- Local repository root was clean and fast-forwarded to `origin/main` at
  `6ac0293ae5b3dc5b5fe95eb119ee82d50a46dc81`.
- The obsolete local and remote `develop` branches were removed after their
  shared tip was preserved at
  `archive/develop-retired-2026-07-27`
  (`e6a8c022947d2e7a7639f1f28dd6b90be7d232f3`).
- GitHub returned no open pull requests with `develop` as either base or head.
- Searches of `.github/workflows/` found no `develop` trigger. The repository
  has no application deployment pipeline or Coolify application.

## Documentation audit

- `README.md` and `CLAUDE.md` list the same nine published plugins as
  `.claude-plugin/marketplace.json`.
- All nine plugin manifests report version `1.32.5`; versions are managed by
  Release Please and are outside this change.
- Paths referenced by the entry documents exist.
- `README.md` already states that feature branches target `main`, but does not
  explicitly state that the repository does not maintain `develop`.
- `CLAUDE.md` still says an unprotected remote `develop` branch may exist. That
  statement became stale when the branch was retired.
- `plugins/pr-review/` contains only ignored Finder metadata and is not tracked,
  manifested, or published. It is not a tenth plugin.
- No `.env.example` exists, so environment-template comparison is not
  applicable.

## Validation and dependencies

- Baseline `npm test`: 42 tests passed, 0 failed.
- Baseline `npm ci`: completed and reported five existing audit findings
  (two moderate, three high). Dependency remediation is outside this
  documentation-only change.
- Pull requests run `.github/workflows/version-check.yml`; Release Please runs
  `.github/workflows/release.yml` after pushes to `main`.
- Required final validation is `npm run validate`,
  `claude plugin validate .`, Markdown claim inspection, and GitHub branch
  readback.

## OpenSpec and concurrent work

- No active proposal covers retiring `develop` or synchronizing the root entry
  documents with that branch state.
- Existing active changes concern earlier `jt-flow` Skill migration and queue
  delegation.
- Archived packaging and review-orchestration changes establish that
  documentation validation is separate from release or deployment state.
- `openspec/config.yaml` contains stale historical context describing twelve
  plugins and a `develop` worktree. The verified repository state above
  overrides that context for this proposal. Updating the config is outside the
  user-approved two-file scope.

