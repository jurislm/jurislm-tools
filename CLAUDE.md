<!-- DELIVERY:START -->

# Linear + Superpowers Delivery

New product and development requests use this authority chain:

```text
Linear product requirement
  → Superpowers engineering workflow
  → GitHub PR, CI, and browser/runtime acceptance evidence
  → Linear readback
  → product-owner final acceptance
```

Linear is the source of truth for product intent, approved behavior, scope,
acceptance criteria, owner decisions, and delivery status. Superpowers owns
engineering clarification, design, implementation planning, TDD, debugging,
review, and verification. GitHub, CI, and runtime/browser readback own delivery
evidence; none of them silently redefine product behavior.

For a new request, begin from its Linear issue or document and use the available
Superpowers skills directly. Do not create another orchestration plugin,
role-agent framework, or Spectra/OpenSpec proposal unless the user explicitly
requests one. Product behavior or scope changes discovered during delivery
return to Linear for an owner decision before engineering work resumes.

<!-- DELIVERY:END -->

## CLAUDE.md

This file provides project-specific guidance for `jurislm-tools`. Also follow the contributor's local `~/.claude/CLAUDE.md`, when present.

## Repository overview

`jurislm-tools` is an eight-entry Claude Code Plugin Marketplace for JurisLM observability, content, and development workflows. Coolify and Hetzner are maintained in separate public plugin repositories. Codex consumes the same `.claude-plugin` marketplace through its supported compatibility path; do not create a parallel `.codex-plugin` or `.agents` tree without a demonstrated incompatibility.

The repository is primarily JSON, YAML, JavaScript validation scripts, and Markdown. It has no application build or deployment pipeline.

## Required validation

The repository development toolchain supports Node.js
`^22.22.2 || ^24.15.0 || >=26.0.0`. Confirm the active Node.js version satisfies
this range before installing dependencies or running validation. `shellcheck` must
also be on `PATH`; it is not an npm dependency, so `npm ci` does not provide it.

```bash
npm ci
npm run validate
claude plugin validate .
```

`npm run validate` runs:

- Node tests for repository integrity.
- Marketplace path, name, installation-ID, and immutable MCP dependency checks.
- Release Please version synchronization.
- Markdown lint for current entry documents and OpenSpec artifacts.
- Shell script lint (`shellcheck`) for every `.sh` file in the repository.

The Codex local environment is defined in `.codex/environments/environment.toml`; setup is intentionally a no-op.

## Architecture

```text
.claude-plugin/marketplace.json
plugins/<plugin-name>/
├── .claude-plugin/plugin.json
├── .mcp.json                       # Hybrid plugins only
├── skills/<name>/SKILL.md
├── commands/<name>.md              # Compatibility entry, when present
└── README.md
```

Skills and commands are auto-discovered. A plugin manifest owns metadata; it does not enumerate every Skill.

### Published plugins

| Plugin | Type | Primary surface |
|---|---|---|
| `langfuse` | Hybrid | `@jurislm/langfuse-mcp@1.3.2` + Skill |
| `higgsfield` | Hybrid | OAuth remote MCP + seven Skills |
| `repo-standards` | Skill | Repository standards |
| `podcast-to-blog` | Skill | Podcast transcription and writing |
| `codebase-sync` | Skill | README and CLAUDE.md synchronization |
| `learn-eval` | Skill | Reusable session-pattern extraction |
| `hook-standards` | Skill | Claude Code hook 規格與三支現行守衛腳本 |

JT Harness is maintained in the standalone `jurislm/jt-harness-plugin` repository. Do not restore retired `/jt:*` command surfaces in this repository. Current local Skills are triggered by intent.

## MCP dependency and credential policy

Credential-bearing local MCP launchers must use exact npm versions. `@latest`, unversioned packages, caret, tilde, and other ranges are prohibited because unreviewed code would receive infrastructure credentials. Upgrades require explicit dependency PRs that update the launcher and owning documentation together.

MCP environment variables belong in `~/.zshenv`, not `~/.zshrc`:

| Plugin | Required variables |
|---|---|
| `langfuse` | `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`, `LANGFUSE_HOST` |
| `higgsfield` | None; browser OAuth |

Never print credentials or shell environment values during validation.

## Version management

Never manually edit plugin or marketplace release versions. Release Please owns:

- All active `plugins/<name>/.claude-plugin/plugin.json` version fields.
- `.claude-plugin/marketplace.json` at `$.plugins[0].version`.

`langfuse` remains the first marketplace entry because Release Please uses array index zero. Append new plugins unless the release configuration is changed atomically.

Commit types:

- `feat:` for new or materially expanded plugin behavior.
- `fix:` for incorrect behavior or information.
- `docs:` or `chore:` for non-behavioral maintenance.

`scripts/commit-types.mjs` parses this exact list to keep it in sync with
`release-please-config.json`; `npm test` fails if they drift. Keep it a flat
bullet list with each type wrapped in backticks, and keep the heading above
unique in this file — a second occurrence makes the parse target ambiguous
and the parser now rejects that outright.

Repository quality and Release Please currently run on the self-hosted Drone
instance through `.drone.yml`. The `validate` pipeline covers pull requests
and pushes to `main`; the `release` pipeline runs only after pushes to `main`,
uses a repo-scoped named credential, cuts any outstanding merged release before
opening or updating the next release PR, and never receives that credential in
pull-request builds. Do not add overlapping GitHub Actions validation or
release workflows.

JUR-217 adds `.woodpecker/` only as source-controlled parity for those three
contracts. It does not activate Woodpecker or change repository integration,
credential provisioning, required-check governance, deploy responsibility, or
Drone authority. Workflow files are separately named workflows; cross-workflow
dependencies use filename-derived names and cannot share a workspace. Keep
`.drone.yml` intact. Live status, release, auto-merge, governance, and rollback
acceptance remain JUR-215 controlled-window work; see
[`docs/ci/woodpecker-source-parity.md`](docs/ci/woodpecker-source-parity.md).

## Delivery authority

For new work, use Linear for requirements, decisions, acceptance criteria, and
progress. Use Superpowers directly for clarification, engineering design,
implementation planning, TDD, systematic debugging, code review, and completion
verification. Prefer the smallest applicable Superpowers skill sequence instead
of maintaining a second workflow abstraction.

Engineering defects return through systematic debugging, TDD, and fresh
verification. A change to product behavior or scope returns to Linear and
requires product-owner acceptance before the affected engineering plan resumes.

Completion requires acceptance-criteria evidence, fresh tests, applicable CI
and browser/runtime readback, resolved review findings, a durable Linear
readback, and the product owner's final acceptance. Linear may be marked Done
only after these conditions hold. Missing credentials,
platform-enforced approval, destructive production changes, unresolved product
ambiguity, or repeated no-progress iterations are explicit pause conditions.

## Legacy OpenSpec

`openspec/` and the generated `/spectra-*` Skills remain for maintaining or
completing existing OpenSpec changes. Route new work to them only when the user
explicitly requests Spectra or OpenSpec. Within such an explicitly selected
legacy run, its artifacts and authorization contract remain authoritative; do
not mix Linear/Superpowers planning artifacts into that same delivery container.

For current marketplace membership, prefer `.claude-plugin/marketplace.json`,
plugin manifests, and repository validation over historical specs. Do not
delete or rewrite archived OpenSpec evidence merely because the default workflow
has changed.

## GitHub Flow and worktrees

The active workflow is feature branch → pull request → `main`. The repository does not maintain a `develop` branch.

- Keep the repository root on `main`.
- Fetch `origin/main` before starting work.
- Create feature worktrees under `.claude/worktrees/<change-name>` from `origin/main`.
- Never develop or push directly on `main`.
- PRs target `main` and must pass repository quality, review, and mergeability gates.

## Installation and updates

Identifiers use `plugin@marketplace`, never the reverse:

```bash
claude plugin marketplace add https://github.com/jurislm/jurislm-tools.git
claude plugin install langfuse@jurislm-tools
claude plugin update langfuse@jurislm-tools
```

For a local directory marketplace, add the repository path instead of the GitHub URL. Start a new Claude Code or Codex session after installation or update.

## Review checklist

- No release-managed version was edited manually.
- `langfuse` remains marketplace entry zero.
- Marketplace name, source folder, and manifest name agree.
- Credential-bearing npm launchers use exact versions.
- Install identifiers use `plugin@jurislm-tools`.
- Skill descriptions are specific enough for reliable routing.
- `npm run validate` and native Claude validation pass.
