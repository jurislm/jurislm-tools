## ADDED Requirements

### Requirement: Spectra-only change tracking

`jurislm-tools` and repositories adopting `repo-standards` SHALL use the
active Spectra change's `proposal`, `design`, `specs`, and `tasks` artifacts as
the only change-tracking record. Guidance MUST NOT create, require, link, or
depend on a GitHub Issue. When a standard change affects other adoption
targets, its active proposal's Delivery Relations SHALL record those targets
and their acceptance dependencies.

#### Scenario: A repository starts a standard change

- **WHEN** a repository begins a non-trivial standards change
- **THEN** it records the work in the active Spectra change without creating or referencing a GitHub Issue

##### Example: Next.js repository setup

- **GIVEN** an active change named `adopt-nextjs-standard`
- **WHEN** the repository starts its standards work
- **THEN** its proposal, design, specs, and tasks record the work and no GitHub Issue is created

#### Scenario: A discovered standard affects other repositories

- **WHEN** a source repository discovers a CI or deployment lesson that affects other adoption targets
- **THEN** the active Spectra proposal records the affected targets and acceptance dependencies in Delivery Relations without opening a GitHub Issue

##### Example: CI template lesson

- **GIVEN** a Drone fix applies to two adoption targets
- **WHEN** its source change records the lesson
- **THEN** Delivery Relations names both targets and their acceptance dependency without a GitHub Issue

### Requirement: Canonical PR review contract

`repo-standards` SHALL identify the repository `CLAUDE.md` and
`jt-flow-review-orchestration` as the canonical PR review and merge contract.
Its skill, command, checklist, CI reference, and Copilot reference MUST direct
agents to invoke `superpowers:requesting-code-review`, use
`superpowers:receiving-code-review` for findings, dispose every finding, resolve
review threads, and satisfy CI and mergeability gates. It MUST configure
CodeRabbit auto-review as disabled with one explicit App request, permit the
CLI only as the prescribed fallback, allow one Copilot review, treat Codex as
passive, and exclude automatic Claude PR-review pipelines.

#### Scenario: A repository opens a pull request

- **WHEN** an adopting repository opens a pull request
- **THEN** its guidance invokes the canonical Skill-driven review contract rather than manual `/code-review` plus bot automation

#### Scenario: A review produces findings

- **WHEN** local or external review produces findings
- **THEN** the repository disposes every finding, resolves every review thread, and does not start a new external review solely because a fix was pushed

##### Example: Fixed CodeRabbit finding

- **GIVEN** the one permitted CodeRabbit review reports a finding
- **WHEN** the finding is fixed and its thread is resolved
- **THEN** final validation covers the new HEAD without requesting another CodeRabbit review

#### Scenario: A repository configures review services

- **WHEN** an adopting repository configures CodeRabbit, Copilot, and Claude review support
- **THEN** CodeRabbit auto-review is disabled with one explicit App request, Copilot has repository instructions and one review budget, and no automatic Claude PR-review pipeline is configured

##### Example: Repository review configuration

- **GIVEN** a repository adds `.coderabbit.yaml` and `.github/copilot-instructions.md`
- **WHEN** it opens a pull request
- **THEN** it explicitly requests CodeRabbit App once, uses one Copilot review budget, and has no Claude review workflow
