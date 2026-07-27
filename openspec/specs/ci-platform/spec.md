# ci-platform Specification

## Purpose
TBD - created by archiving change migrate-jurislm-tools-ci-to-drone. Update Purpose after archive.
## Requirements
### Requirement: Drone enforces repository quality

The repository SHALL use a Drone pipeline named `validate` to run the aggregate
repository validation command for pull requests and pushes to `main`. The
pipeline MUST use an exact supported Node version and MUST NOT receive release
credentials.

#### Scenario: Pull request changes repository content

- **WHEN** Drone receives a pull request ref
- **THEN** the `validate` pipeline installs locked dependencies
- **AND** runs `npm run validate`
- **AND** publishes the aggregated Drone commit status to GitHub

#### Scenario: Main receives a direct or merged push

- **WHEN** Drone receives a push whose ref is `refs/heads/main`
- **THEN** the same validation contract runs as a post-merge safety check

### Requirement: Drone owns Release Please

The repository SHALL run Release Please in a Drone pipeline named `release`
only for pushes to `main`. The pipeline MUST use the repository config and
manifest, an explicit `main` target, and a repo-scoped secret supplied through
Drone secret indirection. It MUST attempt `github-release` before
`release-pr`.

#### Scenario: A release PR was merged

- **WHEN** the release pipeline processes the resulting push to `main`
- **THEN** Release Please cuts the outstanding GitHub tag and release
- **AND** then opens or updates the next release PR if releasable commits remain

#### Scenario: Pull request code is untrusted

- **WHEN** Drone evaluates a pull request
- **THEN** no release step runs
- **AND** the release token is unavailable to the validation pipeline

### Requirement: CI and release use one platform

The target repository revision MUST NOT retain GitHub Actions workflows that
duplicate Drone validation or Release Please. Repository instructions and
shared standards SHALL identify Drone as the selected platform for this
plugin-repository variant.

#### Scenario: Migration target is audited

- **WHEN** the repository automation files are inspected
- **THEN** `.drone.yml` owns validation and release
- **AND** no overlapping Repository Quality or Release Please GitHub Actions
  workflow remains

### Requirement: Drone cutover has live evidence

The migration SHALL NOT be considered complete until local structural
validation and a live Drone pull-request build succeed, GitHub shows the
corresponding Drone status, and the post-merge `main` validation and release
pipeline results are read back.

#### Scenario: Local configuration is valid but Drone cannot execute

- **WHEN** static checks pass but the live Drone build or GitHub status does
  not succeed
- **THEN** the migration remains incomplete
- **AND** the failure evidence is retained without claiming successful cutover
