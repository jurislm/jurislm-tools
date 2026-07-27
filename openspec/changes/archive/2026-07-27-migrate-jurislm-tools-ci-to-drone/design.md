# Design: Single-platform Drone CI for jurislm-tools

## Context

The repository has two GitHub Actions workflows: `version-check.yml` runs
`npm ci` plus `npm run validate` for pull requests, and `release.yml` runs
Release Please after pushes to `main`. Live inspection shows the GitHub job on
PR #171 fails before runner startup because of account billing, while
`drone repo info jurislm/jurislm-tools` succeeds but reports no config and no
build history. The Drone repository currently has no repo-scoped secrets.

`entire` provides the proven JurisLM trigger and Release Please pattern, but its
six monorepo checks, databases, build, and deploy pipelines do not apply here.
The local `repo-standards` documentation currently treats GitHub Actions as the
default for plugin repositories, so this explicit exception must be recorded
there rather than implemented only in one repository.

## Decisions

### Use two aggregate pipelines

`validate` runs for `pull_request` refs and pushes to `main`. It installs the
locked npm dependency graph and runs the existing `npm run validate` command in
an exact Node version allowed by `package.json`. Keeping one pipeline preserves
Drone's single aggregated `drone/pr` GitHub status and avoids splitting this
small repository into redundant installs.

`release` runs only for pushes to `main`. It uses Release Please CLI with the
existing config, manifest, explicit target branch, and repository URL. It runs
`github-release` before `release-pr`, matching the corrected `entire` ordering:
an already merged release PR is cut before a next release PR is opened.

### Keep secrets out of pull-request pipelines

Only `release` receives `RELEASE_PLEASE_TOKEN` through Drone `from_secret`.
The existing local `JURISLM_DRONE_RELEASE_PLEASE_TOKEN` may populate the
repo-scoped secret after proposal approval; commands and logs must never print
its value. Pull-request access remains disabled.

### Make the target state single-platform

The target revision deletes both overlapping GitHub Actions workflows. The
Drone YAML and its structural policy test are added first in the implementation
sequence, then the workflows are removed in the same reviewed change. There is
no deploy or publish pipeline.

### Cut over with observable gates

Before merge, local checks must pass: the structural policy test,
`drone lint`, `npm run validate`, plugin validation, and strict OpenSpec
validation. The migration PR must then produce a successful live Drone build
and matching GitHub commit status. After merge, a `main` Drone build and release
pipeline result are read back. PR #171 is then updated from `main` so its
validation can be observed on Drone; its failed historical GitHub Actions run
is not treated as a Drone failure.

## Rejected Alternatives

- Migrate validation only: leaves release dependent on the blocked platform and
  violates the single-platform target.
- Copy the full `entire` configuration: adds irrelevant monorepo and deployment
  infrastructure.
- Retain disabled GitHub workflows as fallback: preserves ambiguous ownership
  and allows accidental double execution later.

## Rollback

Before merge, revert the migration commit. After merge, restore the two
workflows in a follow-up change only if Drone cannot execute; do not enable both
release paths simultaneously. Removing the Drone repo secret is a separate
explicit secret mutation.
