# CLAUDE.md

This file provides project-specific guidance for `jurislm-tools`. Also follow the contributor's local `~/.claude/CLAUDE.md`, when present.

## Repository overview

`jurislm-tools` is a nine-entry Claude Code Plugin Marketplace for JurisLM infrastructure, observability, content, and development workflows. Codex consumes the same `.claude-plugin` marketplace through its supported compatibility path; do not create a parallel `.codex-plugin` or `.agents` tree without a demonstrated incompatibility.

The repository is primarily JSON, YAML, JavaScript validation scripts, and Markdown. It has no application build or deployment pipeline.

## Required validation

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
| `jt-flow` | Skills | Single-request and issue-queue delivery workflows |

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

Release Please runs from `.github/workflows/release.yml` after pushes to `main`. Repository quality runs on pull requests through `.github/workflows/version-check.yml`. This repository does not use Drone.

## OpenSpec

`openspec/` and repo-local `opsx:*` Skills provide the specification workflow; they are not marketplace plugins. Artifact order is `proposal → design → specs → tasks`.

Some legacy detail specs remain historical. For current marketplace membership, prefer `.claude-plugin/marketplace.json`, plugin manifests, and the repository integrity checker. When changing an owned area, update its living OpenSpec documentation in the same proposal.

`jt-flow` depends on externally installed `superpowers:*` Skills. Preserve that dependency unless a proposal explicitly replaces it.

## GitHub Flow and worktrees

The active workflow is feature branch → pull request → `main`. The old `develop → main` instructions are retired; an unprotected remote `develop` branch may still exist but is not bound to CI or deployment.

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
