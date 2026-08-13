## ADDED Requirements

### Requirement: Drone auto-merges only an authorized Release Please candidate

The repository SHALL run a source-controlled `release-pr-auto-merge` Drone pipeline only for trusted pushes to `main`. The pipeline MUST depend on the same delivery commit's `validate` and `release` pipelines, MUST serialize overlapping deliveries, and MUST receive the release write credential only in its trusted main context.

The validator SHALL select at most one open Release Please candidate for the configured repository, base branch, official author, and release branch. Before merging, it MUST validate the exact title and Release Please body markers, base and head repository identity, base SHA, head SHA, mergeability, and current main tip. The GitHub merge request MUST include the head SHA that the validator just read.

The candidate SHALL change exactly the trusted Plugin release artifact contract: the release manifest, CHANGELOG, all configured plugin version files, and marketplace version metadata. The validator MUST reject an extra, missing, deleted, or semantically inconsistent artifact. Every version field MUST equal the candidate manifest version, the candidate version MUST exceed the base manifest version, and the CHANGELOG MUST prepend the new release entry without rewriting the base content.

The validator SHALL exit successfully without merging only when no candidate exists, when the candidate base is a descendant of the triggering delivery commit, or when its last main-tip recheck finds that `main` no longer equals that delivery commit. Every other candidate, API, artifact, mergeability, or candidate-base SHA relationship failure MUST fail closed.

#### Scenario: Matching main delivery authorizes merge

- **WHEN** `validate(C)` and `release(C)` succeed and the open candidate has base SHA `C`, a valid artifact contract, a mergeable head, and current main tip `C`
- **THEN** the validator sends one GitHub merge request containing the validated head SHA
- **AND** the pipeline reports the merged pull request

#### Scenario: No candidate needs no action

- **WHEN** the authorized main delivery has no open Release Please candidate
- **THEN** the validator exits successfully as a no-op
- **AND** it does not send a GitHub merge request

#### Scenario: A newer delivery owns a superseded candidate

- **WHEN** the candidate base SHA is a descendant of the triggering delivery commit
- **THEN** the older validator exits successfully as a no-op
- **AND** it does not merge the candidate

#### Scenario: A changed main tip supersedes a validated candidate

- **WHEN** the validator's final main-tip recheck finds that `main` no longer equals `C`
- **THEN** the older validator exits successfully as a no-op
- **AND** it does not send a GitHub merge request

#### Scenario: Candidate validation fails closed

- **WHEN** the candidate has an unrecognized author, branch, marker, artifact, version value, mergeability state, API response, or a base SHA that is neither `C` nor a descendant of `C`
- **THEN** the validator exits with failure
- **AND** it does not send a GitHub merge request
- **AND** the candidate remains open for a later trusted main delivery

#### Scenario: Pull request code cannot obtain merge authority

- **WHEN** Drone evaluates an arbitrary pull request
- **THEN** the auto-merge pipeline does not run
- **AND** the release write credential is unavailable
- **AND** no workflow checks out or executes candidate-head code with merge authority

### Requirement: Release Please write commands use a fixed executable version

Every Drone command that invokes Release Please with a GitHub write credential MUST name one exact Release Please version. Repository structural validation MUST reject an unversioned, ranged, or `latest` invocation.

#### Scenario: A release command has an exact version

- **WHEN** the release and auto-merge configuration is structurally validated
- **THEN** every Release Please command with write authority names the repository's exact configured version

#### Scenario: A release command is unpinned

- **WHEN** a Drone release command invokes Release Please without an exact version
- **THEN** repository structural validation fails before the configuration is accepted
