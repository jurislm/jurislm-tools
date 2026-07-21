## Why

The marketplace currently launches three credential-bearing MCP packages through mutable `@latest` tags, while its only Markdown lint command targets a removed directory and current installation, inventory, and branch-model documentation has drifted from the repository. The preceding review also produced three false or stale positives, so the remediation must fix verified defects without breaking the Claude marketplace format that Codex already supports.

## What Changes

- Pin the Coolify, Hetzner, and Langfuse MCP launchers to the exact npm versions verified during proposal inventory, and reject future credential-bearing `@latest` launchers.
- Replace the dead Markdown lint target with repository-wide quality commands and run JSON, version, packaging, and Markdown validation in pull-request CI.
- Correct marketplace metadata, plugin inventory, installation syntax, GitHub Flow guidance, and user-facing documentation; remove volatile duplicated tool counts where they cannot be kept authoritative.
- Add the missing marketplace description reported by the native Claude plugin validator.
- Record the disposition and evidence for all six original review findings.

## Capabilities

### New Capabilities

- `plugin-packaging-integrity`: Defines immutable credential-bearing MCP launchers, cross-runtime marketplace compatibility, repository validation gates, and source-of-truth documentation requirements.

### Modified Capabilities

- None.

## Impact

Affected plugins: `coolify`, `hetzner`, and `langfuse`. Affected shared surfaces: `.claude-plugin/marketplace.json`, repository validation scripts and CI, README and project guidance, and current marketplace architecture documentation. No runtime API, credential value, deployment target, database, or release-managed version is changed manually. Closes #146.

## Non-goals

- Do not add `.codex-plugin` manifests or an `.agents` marketplace: live `codex plugin list` proves Codex installs this `.claude-plugin` marketplace.
- Do not remove Claude-supported Skill frontmatter merely to satisfy the standalone Codex skill-creator validator; the installed Skills load successfully in Codex.
- Do not modify or archive the separate `convert-jt-flow-commands-to-skills` change.
