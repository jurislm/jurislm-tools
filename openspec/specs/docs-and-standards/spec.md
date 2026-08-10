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

### Requirement: Flat-repo CI template stays synchronized with its reference repo

`repo-standards`'s Coolify web app CI template (Template A) SHALL list every
Drone pipeline that its stated rationale requires, and that list SHALL be
checked against `jurislm/entire`'s actual `.drone.yml` whenever either is known
to have changed. The monorepo template (Template B) SHALL state the current
pipeline count and names for `jurislm/entire`, since it explicitly mirrors that
repo rather than defining independent rationale.

#### Scenario: Template A pipeline list matches its own stated rationale

- **WHEN** Template A documents a rationale for a pipeline category, such as
  build-only failures not being caught by lint or typecheck
- **THEN** the corresponding pipeline appears in Template A's pipeline list and
  example YAML

#### Scenario: Template B pipeline count matches entire's actual `.drone.yml`

- **WHEN** someone compares Template B's stated pipeline list and count against
  `jurislm/entire`'s current `.drone.yml`
- **THEN** the names and count match, or any intentional omission is explicitly
  called out rather than silently missing

#### Scenario: A repo adopting Template A gets deploy-gating and build verification

- **WHEN** a new flat-repo Coolify web app is set up following Template A
- **THEN** its `.drone.yml` includes a `build` pipeline catching build-only
  failures and a `release-pr-auto-merge` pipeline automating release PR merges
