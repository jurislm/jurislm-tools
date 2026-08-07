# Docs and Standards

## Purpose

Define the standards and guidance that the `repo-standards` and `codebase-sync` plugins teach and apply across JurisLM repositories, and require that guidance to stay aligned with each repo's actual, currently supported conventions.

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
