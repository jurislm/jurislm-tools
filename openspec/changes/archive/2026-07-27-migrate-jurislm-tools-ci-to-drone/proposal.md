# Change: Migrate jurislm-tools CI to Drone

Closes #172

## Why

`jurislm-tools` currently runs repository validation and Release Please through
GitHub Actions. Those jobs cannot start while the GitHub account is blocked by
its billing or spending limit, although the repository is already activated in
JurisLM's self-hosted Drone instance. The repository therefore needs one
self-hosted CI and release path with no overlapping GitHub Actions workflows.

## What Changes

- Add a Drone validation pipeline for pull requests and pushes to `main`,
  running the existing aggregate `npm run validate` contract on a supported
  Node release.
- Add a `main`-push-only Drone release pipeline that uses the existing Release
  Please config and manifest, cuts an outstanding merged release before
  opening or updating the next release PR, and reads its token from a
  repo-scoped Drone secret.
- Remove the overlapping Repository Quality and Release Please GitHub Actions
  workflows after their Drone replacements are structurally verified.
- Add automated structural checks for Drone pipeline names, triggers,
  validation commands, release ordering, and secret indirection.
- Update project instructions, OpenSpec requirements, and `repo-standards` so
  an explicitly selected Drone-based plugin repository uses Drone for both
  validation and release rather than running two CI platforms.
- Verify the migration with local validation plus live Drone PR and GitHub
  status readback.

## Impact

Affected plugin: `repo-standards`. Affected repository infrastructure:
`.drone.yml`, CI validation scripts, GitHub workflow files, project
instructions, and Release Please execution. No application deployment exists
or is added.

## Non-goals

- Change repository validation semantics or release-managed versions.
- Add Coolify deployment, npm publishing, or automatic code review.
- Change the self-hosted Drone server, runner, or other repositories.
- Keep GitHub Actions as a fallback after the verified cutover.
