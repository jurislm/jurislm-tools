# CLAUDE.md

This file provides project-specific guidance for `jurislm-tools`. Also follow the contributor's local `~/.claude/CLAUDE.md`, when present.

## Repository overview

`jurislm-tools` is a nine-entry Claude Code Plugin Marketplace for JurisLM infrastructure, observability, content, and development workflows. Codex consumes the same `.claude-plugin` marketplace through its supported compatibility path; do not create a parallel `.codex-plugin` or `.agents` tree without a demonstrated incompatibility.

The repository is primarily JSON, YAML, JavaScript validation scripts, and Markdown. It has no application build or deployment pipeline.

## Required validation

The repository development toolchain supports Node.js
`^22.22.2 || ^24.15.0 || >=26.0.0`. Confirm the active Node.js version satisfies
this range before installing dependencies or running validation.

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
| `coolify` | Hybrid | `@jurislm/coolify-mcp@3.6.0` + Skill |
| `hetzner` | Hybrid | `@jurislm/hetzner-mcp@1.5.0` + Skill |
| `langfuse` | Hybrid | `@jurislm/langfuse-mcp@1.3.2` + Skill |
| `higgsfield` | Hybrid | OAuth remote MCP + seven Skills |
| `repo-standards` | Skill | Repository standards |
| `podcast-to-blog` | Skill | Podcast transcription and writing |
| `codebase-sync` | Skill | README and CLAUDE.md synchronization |
| `learn-eval` | Skill | Reusable session-pattern extraction |
| `jt-flow` | Skills | `jt-flow-one` single-request and `jt-flow-all` active OpenSpec change-queue delivery workflows |

Do not restore retired `/jt:*`, `/jt-flow`, or `/jt-flow-all` command surfaces. Current Skills are triggered by intent.

## MCP dependency and credential policy

Credential-bearing local MCP launchers must use exact npm versions. `@latest`, unversioned packages, caret, tilde, and other ranges are prohibited because unreviewed code would receive infrastructure credentials. Upgrades require explicit dependency PRs that update the launcher and owning documentation together.

MCP environment variables belong in `~/.zshenv`, not `~/.zshrc`:

| Plugin | Required variables |
|---|---|
| `coolify` | `COOLIFY_ACCESS_TOKEN`, `COOLIFY_BASE_URL` |
| `hetzner` | `HETZNER_API_TOKEN` |
| `langfuse` | `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`, `LANGFUSE_HOST` |
| `higgsfield` | None; browser OAuth |

Never print credentials or shell environment values during validation.

## Version management

Never manually edit plugin or marketplace release versions. Release Please owns:

- All nine `plugins/<name>/.claude-plugin/plugin.json` version fields.
- `.claude-plugin/marketplace.json` at `$.plugins[0].version`.

`coolify` must remain the first marketplace entry because Release Please uses array index zero. Append new plugins unless the release configuration is changed atomically.

Commit types:

- `feat:` for new or materially expanded plugin behavior.
- `fix:` for incorrect behavior or information.
- `docs:` or `chore:` for non-behavioral maintenance.

Repository quality and Release Please run on the self-hosted Drone instance
through `.drone.yml`. The `validate` pipeline covers pull requests and pushes
to `main`; the `release` pipeline runs only after pushes to `main`, reads
`RELEASE_PLEASE_TOKEN` from a repo-scoped Drone secret, cuts any outstanding
merged release before opening or updating the next release PR, and never
receives that token in pull-request builds. Do not add overlapping GitHub
Actions validation or release workflows.

## OpenSpec

`openspec/` and repo-local `opsx:*` Skills provide the specification workflow; they are not marketplace plugins. Artifact order is `proposal → design → specs → tasks`.

Some legacy detail specs remain historical. For current marketplace membership, prefer `.claude-plugin/marketplace.json`, plugin manifests, and the repository integrity checker. When changing an owned area, update its living OpenSpec documentation in the same proposal.

`jt-flow` depends on externally installed `superpowers:*` Skills. Preserve that dependency unless a proposal explicitly replaces it.

For `jt-flow-one`, proposal GO is the sole normal-path checkpoint. Explicit
invocation authorizes issue and OpenSpec preparation; proposal GO authorizes
implementation, commits, push, PR, disclosed reviews, finding disposition,
merge, deployment verification, issue closure, and archive. Do not add another
normal authorization prompt for those actions. After GO, pause only for
evidence-unresolved target or behavior ambiguity, material scope or architecture
change or new external dependency or production risk, secrets or sensitive
payloads, missing permissions or platform-enforced approval, an unapproved
destructive production mutation, or rollback with database, schema, data-loss,
or unclear-target risk. A `jt-flow-all` item reuses a recorded explicit proposal
GO and must not ask again solely because the item entered the queue. For
intent-routed runs without CodeRabbit consent, include the App and CLI
disclosure in the proposal summary and let the same proposal GO record consent;
do not defer this predictable consent into a second normal checkpoint.

Keep `jt-flow` review orchestration portable across Claude Code and Codex. Its two CodeRabbit channels are the CodeRabbit GitHub App and the independently installed CodeRabbit CLI (`coderabbit review --agent --type committed --base <remote>/main`); do not model the CLI as, or require, a host-specific Claude or Codex plugin. Preserve the Skill's disclosure, consent, secret-scanning, explicit local change selection, service-side context disclosure, and App-to-CLI fallback gates when changing this workflow. Secret preflight must scan every new commit, tree, and blob that will be pushed, not only the aggregate base-to-HEAD diff; removing a secret in a later commit does not make the earlier object safe to transmit.

CodeRabbit completion means every finding has an explicit disposition: accepted
findings are fixed and verified, while rejected findings retain a concrete
reason. It does not require a zero-finding response. Keep CodeRabbit
`reviews.auto_review.enabled` false and explicitly request the App once so later
pushes cannot create another automatic review. The CodeRabbit GitHub App and CLI
together permit at most one effective review per PR or change: prefer the App,
wait for that sole request to reach a terminal outcome, use the CLI at most once
only when the App cannot produce a review, and stop the fallback as soon as
either channel produces a real review.

Only `jt-flow-one` owns local code review and uses
`superpowers:requesting-code-review`; `jt-flow-all` only orchestrates its issue
queue and must not initiate or own an additional review. Each completed
code-change batch permits at most one Superpowers review; an accepted finding
that changes code creates a new batch eligible for one more review, while no
intervening code change means no repeat review. Use
`superpowers:receiving-code-review` to verify findings, not as another reviewer.
Copilot permits at most one review per PR or change. Fixes and later pushes must
not restart CodeRabbit or Copilot; final `HEAD` is covered by tests, behavioral
acceptance, CI, mergeability, and resolved review threads. Skip Copilot when its
quota is exhausted, move from the CodeRabbit App to the CLI when the App cannot
produce a review, and close the CodeRabbit channel when the CLI is limited.

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
claude plugin install coolify@jurislm-tools
claude plugin update coolify@jurislm-tools
```

For a local directory marketplace, add the repository path instead of the GitHub URL. Start a new Claude Code or Codex session after installation or update.

## Review checklist

- No release-managed version was edited manually.
- `coolify` remains marketplace entry zero.
- Marketplace name, source folder, and manifest name agree.
- Credential-bearing npm launchers use exact versions.
- Install identifiers use `plugin@jurislm-tools`.
- Skill descriptions are specific enough for reliable routing.
- `npm run validate` and native Claude validation pass.
