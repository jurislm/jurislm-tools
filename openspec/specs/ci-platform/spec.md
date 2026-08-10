# ci-platform Specification

## Purpose
Define the current Drone validation and Release Please ownership, commit and pull-request title policy, squash semantics, and merge-protection contract for this plugin repository. Live Drone/GitHub status is operational evidence read back at delivery time; this spec does not replace that readback.
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

### Requirement: Permitted commit types have a single definition
The repository SHALL define its permitted commit types in exactly one machine-readable location.
`release-please-config.json` `changelog-sections` and the commit types documented in `CLAUDE.md`
SHALL both be asserted equal to that definition by the test suite, so any divergence fails
`npm test` rather than surviving unnoticed.

#### Scenario: Release configuration drifts from the definition

- **WHEN** a commit type is present in `release-please-config.json` `changelog-sections` but absent
  from the single definition
- **THEN** `npm test` fails and names the offending type

#### Scenario: Documentation drifts from the definition

- **WHEN** the commit types listed in `CLAUDE.md` differ from the single definition
- **THEN** `npm test` fails and names the difference

#### Scenario: A type is added deliberately

- **WHEN** a maintainer adds a type to the single definition and updates `CLAUDE.md` and
  `release-please-config.json` to match
- **THEN** `npm test` passes

### Requirement: Drone rejects out-of-policy pull-request titles
The `validate` pipeline SHALL verify, on pull-request builds, that the pull-request title matches
Conventional Commits form `<type>[(<scope>)][!]: <description>` and that `<type>` is in the single
definition. A non-conforming title SHALL fail the pipeline with a message naming both the observed
title and the permitted types.

#### Scenario: Pull request uses a type outside the policy

- **WHEN** a pull request is opened with the title `style(jt-flow): 統一 metadata 不加引號`
- **THEN** the `validate` pipeline fails and reports the rejected title and the permitted types

#### Scenario: Pull request uses a permitted type

- **WHEN** a pull request is opened with the title `feat(jt-flow): 阻塞時走封閉迴圈`
- **THEN** the title check passes and the remaining `validate` steps run unchanged

#### Scenario: Release Please opens a release pull request

- **WHEN** release-please opens a pull request titled `chore(main): release 1.34.0`
- **THEN** the title check passes, because `chore` is in the single definition

### Requirement: Pull-request title check fails loudly when its input is unavailable
The check SHALL distinguish a non-pull-request build from a pull-request build whose title is
unavailable. On a non-pull-request build it SHALL skip and say so. On a pull-request build with a
missing or empty title it SHALL fail. It MUST NOT treat an unavailable title as a pass.

#### Scenario: Push build to main

- **WHEN** the `validate` pipeline runs for a push to `main`
- **THEN** the title check reports that it is skipped and the pipeline continues

#### Scenario: Pull-request build without a title

- **WHEN** the pipeline runs for a pull request and the title variable is missing or empty
- **THEN** the check fails rather than passing silently

### Requirement: Squash subject on main is verified after merge
The `validate` pipeline SHALL verify, on `push` builds targeting `main`, that the first line of the
pushed commit message conforms to the same rule as pull-request titles, so a subject override
applied at merge time is surfaced on the commit that introduced it.

#### Scenario: Merge overrides the subject with an out-of-policy type

- **WHEN** a pull request is squash-merged with an explicit subject `style(jt-flow): …` that
  bypassed the validated pull-request title
- **THEN** the `push` build on `main` fails and identifies the offending subject

#### Scenario: Release Please version commit lands on main

- **WHEN** the commit `chore(main): release 1.34.0` is pushed to `main`
- **THEN** the subject check passes

### Requirement: Release configuration accepts only the permitted commit types
`release-please-config.json` `changelog-sections` SHALL contain exactly the types in the single
definition, so an out-of-policy type cannot be granted a changelog section.

#### Scenario: Configuration is compared with the definition

- **WHEN** the `changelog-sections` entries are compared with the single definition
- **THEN** the sets are identical, and `perf`, `refactor`, `style` and `test` are absent

### Requirement: Squash subject comes from the pull-request title
The repository's `squash_merge_commit_title` setting SHALL be `PR_TITLE`, so the squash subject is
taken from the validated pull-request title regardless of how many commits the pull request has.

#### Scenario: Single-commit pull request is squashed

- **WHEN** a pull request containing exactly one commit is squash-merged without an explicit
  subject override
- **THEN** the resulting commit subject is the pull-request title, not the commit's own title

### Requirement: The pull-request title check is binding
`main` SHALL be protected with `continuous-integration/drone/pr` as a required status check, so a
failing title check blocks the merge. Protection SHALL NOT require pull-request review approvals,
SHALL NOT enforce against administrators, and SHALL NOT make any external review service a
required context.

#### Scenario: Pull request with a failing title check

- **WHEN** a pull request's `continuous-integration/drone/pr` check fails
- **THEN** GitHub reports the pull request as not mergeable

#### Scenario: External review service is rate-limited

- **WHEN** CodeRabbit does not report a result because of quota exhaustion
- **THEN** merging is not blocked, because it is not a required context

#### Scenario: CI platform is unavailable

- **WHEN** Drone cannot report a status and a merge is operationally necessary
- **THEN** an administrator can still merge, because protection is not enforced against
  administrators
