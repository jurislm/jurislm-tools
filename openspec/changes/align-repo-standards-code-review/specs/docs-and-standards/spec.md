## ADDED Requirements

### Requirement: Spectra-only change tracking

`jurislm-tools` and repositories adopting `repo-standards` SHALL use the
active Spectra change's `proposal`, `design`, `specs`, and `tasks` artifacts as
the only change-tracking record. Before requiring an active change, guidance
MUST run `spectra --version` and, when the target lacks `openspec/` or
`.spectra.yaml`, MUST run `spectra init` at the repository root. Guidance MUST
NOT create, require, link, or depend on a GitHub Issue. When a standard change
affects other adoption targets, its active proposal's Delivery Relations SHALL
record those targets and their acceptance dependencies.

#### Scenario: A repository starts a standard change

- **WHEN** a repository begins a non-trivial standards change and lacks
  Spectra initialization
- **THEN** it runs `spectra init` before it records the work in an active
  Spectra change without creating or referencing a GitHub Issue

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

`repo-standards` SHALL package a portable PR review and merge template and
identify the target repository's `CLAUDE.md` as its canonical contract. When
the target lacks the template's `PR review and merge contract` section, its
skill MUST write and customize that section before configuring review services.
Its skill, command, checklist, CI reference, and Copilot reference MUST direct
agents to invoke `superpowers:requesting-code-review`, use
`superpowers:receiving-code-review` for findings, dispose every finding, resolve
review threads, and satisfy CI and mergeability gates. It MUST configure
CodeRabbit auto-review as disabled with one explicit App request, permit the
CLI only as the prescribed fallback, allow one Copilot review, treat Codex as
passive, and exclude automatic Claude PR-review pipelines. For a target using
`jt-flow-all`, that Skill SHALL only coordinate its Spectra change queue;
delegated `jt-flow-one` SHALL own and invoke the local review without any
additional `jt-flow-all` review.

#### Scenario: A repository opens a pull request

- **WHEN** an adopting repository opens a pull request
- **THEN** its own `CLAUDE.md` invokes the canonical Skill-driven review
  contract rather than a source-repository-only pointer or manual `/code-review`
  plus bot automation

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
