# Pre-proposal evidence inventory

## Repository and workflow

- `main` is clean at `4a77922` and matches `origin/main` after `git fetch origin --prune`.
- The only GitHub remote is `origin`, whose fetch and push target is `jurislm/jurislm-tools`; `gh repo view` reports admin access and default branch `main`.
- `origin/develop` exists, but GitHub reports no branch protection or ruleset, repository workflows do not bind to `develop`, and this text-only plugin repository has no deployment pipeline. The stale two-stage guidance is documentation drift, not an active deployment dependency.
- OpenSpec `1.6.0` is installed. The only pre-existing active change is `convert-jt-flow-commands-to-skills`, with seven of eight tasks complete; its remaining installed-plugin verification does not own this remediation scope.

## Original review findings

| Finding | Live evidence | Disposition |
|---|---|---|
| Credential-bearing MCP launchers use `@latest` | `plugins/{coolify,hetzner,langfuse}/.mcp.json` pass credentials to mutable npm tags. Published versions observed with `npm view`: `3.6.0`, `1.5.0`, `1.3.2`. | Fix by exact-version pinning and regression validation. |
| Codex manifests and marketplace are absent | `codex plugin list` discovers marketplace `jurislm-tools` from `.claude-plugin/marketplace.json`; Coolify, Hetzner, Langfuse, and jt-flow are installed and enabled at `1.32.0`. | False positive; preserve the compatible Claude marketplace instead of duplicating manifests. |
| Skill frontmatter fails standalone Codex quick validation | The standalone validator rejects Claude fields `version` and `argument-hint`, but installed Skills from the same manifests are exposed in the current Codex session. | False positive for this cross-runtime marketplace; do not remove useful Claude metadata. |
| Local checkout was stale and conflicted with untracked OpenSpec files | Current `git status --short --branch` is clean and synchronized. | Stale state; no code change. |
| Markdown lint is ineffective | `package.json` targets removed `plugins/code-review/**/*.md`; project guidance already records that it fails. | Fix command coverage and CI. |
| Documentation and metadata drift | README advertises the removed `jt` plugin and obsolete commands; Claude CLI help requires `plugin@marketplace`; marketplace and plugin descriptions disagree on tool counts; project guidance still describes `develop -> main`. | Correct and reduce volatile duplicated metadata. |

## Validation and compatibility baseline

- `claude plugin validate .` passes with one warning: missing top-level marketplace description.
- `claude plugin validate plugins/coolify` passes.
- `node scripts/check-version-sync.mjs` passes at `1.32.0`.
- The three local sibling MCP repositories report package versions `3.5.3`, `1.5.0`, and `1.3.2`; npm reports published versions `3.6.0`, `1.5.0`, and `1.3.2`. Published npm versions are the pinning source because plugin consumers install from npm.
- Release Please owns all plugin and marketplace version fields; this change will not edit them manually.
