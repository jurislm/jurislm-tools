# Docs and Standards

## Purpose

Define the standards and guidance that the `repo-standards` plugin teaches and
applies across JurisLM repositories, and require that guidance to stay aligned
with each repo's actual, currently supported conventions. The `codebase-sync`
workflow is documented separately in its detail spec.

## Requirements

### Requirement: repo-standards worktree guidance matches the supported branch model

`repo-standards` SHALL teach the single-stage GitHub Flow worktree model — feature worktrees created directly from `main` at `.claude/worktrees/<change-name>`, pull requests opened directly `<change-name> → main` — in `SKILL.md`, `references/new-repo-checklist.md`, `references/eslint-templates.md`, `references/testing-config-templates.md`, and `openspec/specs/docs-and-standards/repo-standards-detail.md`, and SHALL NOT present a `develop` branch or `.worktrees/develop` worktree as a required or default step for any repo adopting the standard.

#### Scenario: A repo follows the worktree creation guidance

- **WHEN** a new or existing repo follows repo-standards' worktree creation guidance to start feature work
- **THEN** the instructed path is `.claude/worktrees/<change-name>` created directly from `main`
- **AND** no step directs the repo through a `develop` branch or `.worktrees/develop` worktree

#### Scenario: A repo follows the pull request guidance

- **WHEN** a repo follows repo-standards' guidance to open a pull request for a feature worktree
- **THEN** the documented pull request target is `<change-name> → main` directly, without an intermediate `develop` merge step

#### Scenario: A repo follows the worktree-exclude guidance for local tooling

- **WHEN** a repo follows repo-standards' `.gitignore`/`.prettierignore`/ESLint/`vitest.config.ts` guidance for excluding worktree directories
- **THEN** `.claude/worktrees/` is not added to the repo's committed `.gitignore`
- **AND** `.claude/worktrees/**` (or the equivalent pattern for that tool) is added to `.prettierignore`, ESLint ignores, and `vitest.config.ts` exclude

### Requirement: CI templates distinguish the verified reference from adoption targets

`repo-standards` SHALL identify `jurislm/entire` at its current `main` as the
sole verified reference for release delivery and monorepo CI/CD invariants.
The monorepo template (Template B) SHALL mirror that source fact and currently
list exactly these twelve Drone pipelines: `lint-typecheck`, `cli`, `app`,
`module`, `package`, `release`, `build`, `deploy`, `release-pr-auto-merge`,
`detect-missed-push-builds`, `audit-missed-builds`, and
`audit-shared-migration-drift`. It MUST NOT identify another repository as a
reference or compliant before that repository's own observable acceptance
succeeds. The flat-repo template (Template A) SHALL remain independently
justified and SHALL NOT imply that copying it establishes verified compliance.

Every repository adopting a standard SHALL record the source fact, the failure
that fact prevents, the local rule that implements it, and the observable
acceptance that proves it. Copying `entire`'s topology alone is not acceptance.

#### Scenario: Template A pipeline list matches its own stated rationale

- **WHEN** Template A documents a rationale for a pipeline category, such as
  build-only failures not being caught by lint or typecheck
- **THEN** the corresponding pipeline appears in Template A's pipeline list and
  example YAML

#### Scenario: The verified reference and adoption status are explicit

- **WHEN** a repository is evaluated against repo-standards
- **THEN** `jurislm/entire` at current `main` is the only repository described
  as a verified reference for release delivery and monorepo CI/CD
- **AND** every other repository is an adoption target until its own observable
  acceptance succeeds
- **AND** the repository records source fact, prevented failure, local rule,
  and observable acceptance

#### Scenario: Template B pipeline count matches entire's actual `.drone.yml`

- **WHEN** someone compares Template B's stated pipeline list and count against
  `jurislm/entire`'s current `.drone.yml`
- **THEN** the names and count match the twelve current pipelines, or any
  intentional omission is explicitly called out rather than silently missing

#### Scenario: A repo adopting Template A gets deploy-gating and build verification

- **WHEN** a new flat-repo Coolify web app is set up following Template A
- **THEN** its `.drone.yml` includes a `build` pipeline catching build-only
  failures and a `release-pr-auto-merge` pipeline automating release PR merges

### Requirement: JurisLM monorepos require Turborepo and trustworthy scoped execution

Every JurisLM monorepo SHALL use Turborepo with a root `turbo.json`, and
cross-workspace scripts SHALL be owned by Turbo. `--filter` SHALL represent a
fixed, explicitly named workspace boundary. `--affected` MAY be used only when
the Git base and head are trustworthy and the source of that range is recorded.
When the Git range is unavailable or the affected query cannot be established,
the standard SHALL run full validation or full deployment and MUST NOT report an
unaffected success. Turbo task inputs SHALL include every source,
configuration, and test file read by the underlying task so a cached success
cannot hide a relevant change.

#### Scenario: A fixed workspace boundary uses filter

- **WHEN** a CI gate has a known, fixed workspace boundary
- **THEN** the gate uses Turbo `--filter` to select that boundary
- **AND** it runs the task for the selected workspaces

#### Scenario: Affected execution has a trustworthy Git range

- **WHEN** a CI gate has a verified Git base and head and uses change-derived
  routing
- **THEN** the standard permits Turbo `--affected`
- **AND** the gate records the source of its Git range

#### Scenario: Affected execution cannot establish its range

- **WHEN** the Git base or head is unavailable, untrusted, or the affected query
  errors
- **THEN** the gate runs full validation or full deployment
- **AND** it does not report an unaffected success

#### Scenario: Task inputs cover files read by the task

- **WHEN** a Turbo task reads source, configuration, or test files
- **THEN** those paths are included in the task's declared inputs
- **AND** changing one of those files invalidates the cached result

### Requirement: Release Please auto-merge is authorized by the same delivery

Every adopting repository that enables Release Please, including npm packages
and MCP servers, SHALL use a trusted `main`-delivery
`release-pr-auto-merge` validator. An npm or MCP target may skip only
deploy-specific gating; it MUST still configure this validator and its
observable acceptance. The validator MUST depend on
the same delivery commit's required validation and release gates, validate a
repository-specific closed artifact contract with no extra, missing, deleted,
or semantically inconsistent release artifact, validate required-check clean
state, and verify that GitHub's branch protection or ruleset requires a
latest-base check, applies it to the automation credential, and has no human
release-PR approval gate. It MUST use
GitHub's PR merge API with the validated candidate head SHA, not directly update
`main`. A main reread during a pending candidate, or a GitHub rejection, followed
by proof that `main` changed since the triggering delivery SHALL be a successful
no-op; every other discrepancy MUST fail closed. No manual merge fallback SHALL be documented or required, and every
Release Please command with GitHub write authority SHALL name the target
repository's exact executable version. Each target SHALL record and read back a
target-compatible merge mode before enabling the validator. For a Conventional
Commit release eligibility guard, the safe default is squash-only with the
pull-request title as the squash title; another representation requires its own
documented and tested subject parser.

#### Scenario: The candidate belongs to the same trusted delivery

- **WHEN** the trusted `main` delivery's validation and release gates succeed
  and its candidate satisfies the closed artifact contract
- **THEN** the validator may send GitHub one protected PR merge request with
  the validated candidate head SHA
- **AND** a pull-request build cannot obtain the release write credential

#### Scenario: GitHub's protected PR merge detects a newer tip

- **WHEN** GitHub rejects the validator's protected PR merge and a reread of
  `main` differs from its triggering delivery commit
- **THEN** the validator exits successfully as a no-op
- **AND** it does not retry the stale candidate

#### Scenario: A waiting candidate is superseded by a newer tip

- **WHEN** a candidate remains pending or behind and its main reread differs
  from the triggering delivery commit
- **THEN** the validator exits successfully as a no-op
- **AND** it sends no protected PR merge request

#### Scenario: A candidate violates the closed artifact contract

- **WHEN** a candidate has an extra, missing, deleted, or semantically
  inconsistent release artifact, or any other identity, SHA, API, or
  mergeability discrepancy
- **THEN** the validator fails closed without merging
- **AND** no manual merge path is used to bypass the rejection

#### Scenario: An npm or MCP repository adopts a release template

- **WHEN** an npm package or MCP server enables Release Please
- **THEN** it skips only deploy-specific gating
- **AND** it still configures the trusted release PR auto-merge validator and its observable acceptance

### Requirement: repo-standards 發布指引避免不可發布的版本升級

對使用 Release Please 且設定 `release-type: simple` 的 plugin 儲存庫，
`repo-standards` 必須提供 Drone `release-pr` 發布資格閘門的指引。閘門必須
位於無條件執行的 `github-release` 之後、`release-pr` 之前，並透過 Compare
API 比較已發布版本 tag 與 immutable `DRONE_COMMIT`；Compare 只提供可到達
提交，閘門必須從該 commit 沿 first-parent mainline 回走至已發布 tag 的 base，
只分類這些 mainline delivery subjects，不能把 side branch 的中間提交算成
main 歷史。只有該範圍含有有效的 `feat` 或 `fix` subject 時，才可呼叫 Release
Please。只有 `docs`、只有 `chore` 或空範圍必須成功跳過；範圍、metadata、
token、first-parent path 或 subject 無法驗證時必須 fail closed。既有 GitHub
default merge delivery 僅可在精確 merge subject 與 body 的 Conventional Commit
title 都驗證時做相容性判讀；未來應使用 target-compatible squash-only policy。
範本不得記錄發布憑證，也不得指示維護者手動修改由 Release Please 管理的版本。

#### Scenario: 採用範本的 plugin 儲存庫只有文件維護

- **當** 已發布 manifest tag 之後只合併有效的 `docs` 與 `chore` 提交
- **那麼** `release-pr` 完成而不呼叫 Release Please，版本檔案維持不變

#### Scenario: 採用範本的 plugin 儲存庫有可發布變更

- **當** immutable `DRONE_COMMIT` 的 first-parent 未發布 mainline 範圍含有有效的 `feat` 或 `fix` subject
- **那麼** `release-pr` 在 `github-release` 之後呼叫 Release Please，並使用
  儲存庫的 manifest 與 extra-file 設定建立或更新 release PR

#### Scenario: 範本無法建立安全的發布範圍

- **當** Compare request、manifest metadata 或任一 commit subject 無法驗證
- **那麼** `release-pr` 在任何版本升級命令前失敗，且失敗訊息不包含 token

#### Scenario: Compare includes side-branch history

- **當** Compare 回傳未被 first-parent mainline 採用的中間分支提交
- **那麼** 發布資格只使用 immutable `DRONE_COMMIT` 的 first-parent delivery subjects
- **並且** side-branch 的不允許 type 不會阻擋一個已驗證的 mainline `feat` 或 `fix`
