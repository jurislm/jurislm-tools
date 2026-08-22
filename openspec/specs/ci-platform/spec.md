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
- **AND** the shared GitHub API token is unavailable to the validation pipeline

### Requirement: Release eligibility classifies immutable mainline delivery units

`release` pipeline 必須無條件且先執行 `github-release`，再執行
`release-pr` 資格判定。資格閘門必須讀取 manifest 的已發布版本，透過
`DRONE_REPO`、`DRONE_BRANCH` 與 immutable `DRONE_COMMIT` 對已驗證的 GitHub
Compare API 取得可到達提交；它必須從該 delivery commit 沿 first-parent
mainline 回走至已發布 tag 的 base，且只分類這些 mainline delivery units。raw
Compare reachability 不得把 side branch commit 當作 main delivery。標準 squash
delivery 使用其 subject；為了相容既有 GitHub default merge delivery，只有當
merge subject 精確符合 GitHub 預設 PR merge 格式，且 body 第一個非空白行本身
通過 Conventional Commit 驗證時，閘門才可使用該行。缺失、斷裂、循環或不可信的
path 必須 fail closed，且不得暴露這顆共用的 GitHub API token。

#### Scenario: 只有文件或維護提交尚未發布

- **當** 已發布 tag 到 immutable `DRONE_COMMIT` 的 first-parent mainline 範圍只有有效的 `docs` 或
  `chore` subject
- **那麼** `release-pr` 成功結束而不呼叫 Release Please

#### Scenario: 未發布 mainline 範圍含有可發布提交

- **當** immutable `DRONE_COMMIT` 的 first-parent 未發布 mainline 範圍含有有效的 `feat` 或 `fix` subject
- **那麼** `release-pr` 在 `github-release` 之後呼叫 Release Please

#### Scenario: 無法安全判定未發布 mainline 範圍

- **當** Compare request、metadata、分頁、first-parent path 或任一 subject 無法驗證
- **那麼** `release-pr` 在呼叫 Release Please 前失敗，且輸出不得包含 token

#### Scenario: Compare includes side-branch history

- **當** Compare 回傳未被 first-parent mainline 採用的中間分支提交
- **那麼** 發布資格只使用 immutable `DRONE_COMMIT` 的 first-parent delivery subjects
- **並且** side-branch 的不允許 type 不會阻擋一個已驗證的 mainline `feat` 或 `fix`

#### Scenario: A malformed historical merge delivery is not accepted

- **WHEN** a two-parent delivery lacks the exact GitHub default merge subject or a valid Conventional Commit body title
- **THEN** the gate fails closed before invoking Release Please

### Requirement: Drone auto-merges only an authorized Release Please candidate

The repository SHALL run a source-controlled `release-pr-auto-merge` Drone
pipeline only for trusted pushes to `main`. The pipeline MUST depend on the
same delivery commit's `validate` and `release` pipelines, MUST serialize
overlapping deliveries, and MUST receive the release write credential only in
its trusted main context.

The validator SHALL select at most one open Release Please candidate for the
configured repository, base branch, official author, and release branch.
Before merging, it MUST validate the exact title and Release Please body
markers, base and head repository identity, base SHA, head SHA, required-check
clean state, and mergeability. It MUST verify that the target branch protection
or ruleset requires the candidate to be tested with the latest base, enforces
that requirement for the automation credential, and does not require human
approval for release PR automation. The current target SHALL use GitHub's PR
merge API with the validated head SHA, `merge_method: squash`, and the
validated release title as `commit_title`, never directly updating the main
ref.

The candidate SHALL change exactly the trusted Plugin release artifact
contract: the release manifest, CHANGELOG, all configured plugin version files,
and marketplace version metadata. The validator MUST reject an extra, missing,
deleted, or semantically inconsistent artifact. Every version field MUST equal
the candidate manifest version, the candidate version MUST exceed the base
manifest version, and the CHANGELOG MUST prepend exactly one candidate version
entry without rewriting or inserting another version block before the base
content.

The validator SHALL exit successfully without merging only when no candidate
exists, when the candidate base is a descendant of the triggering delivery
commit, when an awaiting candidate's main reread proves `main` no longer equals
that delivery commit, or when GitHub rejects a stale merge and a reread proves
`main` no longer equals that delivery commit. Every other candidate, API,
protection, artifact, required-check, mergeability, or candidate-base SHA
relationship failure MUST fail closed.

#### Scenario: Matching main delivery authorizes merge

- **WHEN** `validate(C)` and `release(C)` succeed and the open candidate has base SHA `C`, a valid artifact contract, a mergeable head, and current main tip `C`
- **THEN** the validator sends one GitHub PR squash-merge request containing the validated head SHA and release title
- **AND** the pipeline reports the merged pull request

#### Scenario: No candidate needs no action

- **WHEN** the authorized main delivery has no open Release Please candidate
- **THEN** the validator exits successfully as a no-op
- **AND** it does not update `main`

#### Scenario: A newer delivery owns a superseded candidate

- **WHEN** the candidate base SHA is a descendant of the triggering delivery commit
- **THEN** the older validator exits successfully as a no-op
- **AND** it does not merge the candidate

#### Scenario: GitHub's protected merge detects a changed main tip

- **WHEN** the validator's protected PR merge is rejected and a reread finds that `main` no longer equals `C`
- **THEN** the older validator exits successfully as a no-op
- **AND** it does not retry a merge for that stale candidate

#### Scenario: A waiting candidate is superseded before mergeability is ready

- **WHEN** GitHub reports the candidate as pending or behind and a main reread differs from `C`
- **THEN** the older validator exits successfully as a no-op
- **AND** it does not send a GitHub PR merge request

#### Scenario: Candidate validation fails closed

- **WHEN** the candidate has an unrecognized author, branch, marker, artifact, version value, mergeability state, API response, or a base SHA that is neither `C` nor a descendant of `C`
- **THEN** the validator exits with failure
- **AND** it does not update `main`
- **AND** the candidate remains open for a later trusted main delivery

#### Scenario: Branch protection cannot support non-interactive latest-base merging

- **WHEN** the target branch protection or ruleset does not require latest-base checks for the automation credential or requires human approval for release PRs
- **THEN** the validator fails closed
- **AND** it does not send a GitHub PR merge request

#### Scenario: CHANGELOG contains a second release block

- **WHEN** a candidate prepends its version entry but also inserts another version heading before the unchanged base CHANGELOG content
- **THEN** the validator fails closed
- **AND** it does not update `main`

#### Scenario: Pull request code cannot obtain merge authority

- **WHEN** Drone evaluates an arbitrary pull request
- **THEN** the auto-merge pipeline does not run
- **AND** the release write credential is unavailable
- **AND** no workflow checks out or executes candidate-head code with merge authority

### Requirement: Release Please write commands use a fixed executable version

Every Drone command that invokes Release Please with a GitHub write credential
MUST name one exact Release Please version. Repository structural validation
MUST reject an unversioned, ranged, or `latest` invocation.

#### Scenario: A release command has an exact version

- **WHEN** the release and auto-merge configuration is structurally validated
- **THEN** every Release Please command with write authority names the repository's exact configured version

#### Scenario: A release command is unpinned

- **WHEN** a Drone release command invokes Release Please without an exact version
- **THEN** repository structural validation fails before the configuration is accepted

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
