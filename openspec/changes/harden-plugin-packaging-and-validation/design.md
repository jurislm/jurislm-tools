## Context

`jurislm-tools` is a nine-entry Claude Code marketplace that Codex also consumes through its Claude-marketplace compatibility path. Three hybrid plugins launch npm MCP packages with privileged environment variables. The repository has Release Please version checks but no effective Markdown or packaging-integrity gate, and several documents still describe the retired single-plugin and `develop -> main` model.

Constraints include preserving the existing `.claude-plugin` contract, leaving release-managed versions untouched, keeping validation runnable in generic GitHub Actions without requiring installed Claude or Codex CLIs, and not mixing the adjacent jt-flow migration change into this work.

## Goals / Non-Goals

**Goals:**

- Make credential-bearing MCP startup reproducible and reviewable.
- Make one CI command validate Markdown, JSON, version sync, and marketplace invariants.
- Restore current, low-drift installation and architecture documentation.
- Preserve successful installation in both Claude Code and Codex.

**Non-Goals:**

- Create a second Codex-specific marketplace or duplicate plugin manifests.
- Remove Claude-specific Skill metadata that the current compatibility loader accepts.
- Automate releases of the three upstream MCP packages.
- Change credentials, plugin release versions, or deployed services.

## Decisions

### Pin exact published npm versions

The launchers will use `@jurislm/coolify-mcp@3.6.0`, `@jurislm/hetzner-mcp@1.5.0`, and `@jurislm/langfuse-mcp@1.3.2`. Exact versions make a reviewed plugin revision deterministic. Major-only ranges and `@latest` were rejected because they still allow unreviewed code to receive infrastructure credentials. Future upgrades become explicit dependency PRs.

### Add a dependency-free repository integrity checker

A Node script will parse the marketplace and manifests, resolve every local source path, require entry/folder/manifest names to agree, parse repository JSON, reject `@latest` in credential-bearing local MCP launchers, require exact semver package references, and invoke or share the existing release-version checks. A repository-local checker is preferred over requiring Claude or Codex CLIs in CI; native CLI validation remains a behavioral acceptance step where those CLIs are available.

### Use one pull-request quality workflow

Package scripts will expose focused checks and a single aggregate validation command. Pull requests affecting repository content will run `npm ci` and the aggregate command. Markdown lint will cover tracked user and plugin documentation instead of the removed `plugins/code-review` path, using the existing repository configuration rather than introducing another formatter.

### Minimize duplicated volatile metadata

README and marketplace metadata will enumerate the current nine plugins and use the verified `plugin@marketplace` syntax. Volatile tool counts will be removed from overview descriptions where they are repeatedly copied; capability details remain in the owning Skill or reference. Marketplace paths and plugin manifests remain the structural source of truth, and the checker prevents entry/path/name divergence.

### Preserve the proven cross-runtime format

The `.claude-plugin` marketplace remains canonical. Evidence from `codex plugin list` and Claude validation will be retained in verification logs. Adding parallel `.codex-plugin` and `.agents` trees was rejected because it creates two release and metadata surfaces without solving an observed compatibility failure.

## Risks / Trade-offs

- [Pinned packages no longer auto-upgrade] → Handle upgrades through explicit reviewed PRs and keep the pinned versions visible in current documentation.
- [Broad Markdown lint exposes legacy violations] → Use the existing documented rule configuration and fix real violations in scoped tracked documentation; do not exclude files merely to obtain green CI.
- [A custom checker diverges from native plugin schemas] → Limit it to repository invariants and retain `claude plugin validate` plus `codex plugin list` as behavioral acceptance evidence.
- [The adjacent jt-flow change edits overlapping documentation] → Base the feature worktree on fresh `origin/main`, avoid its artifacts, and resolve only real implementation conflicts.

## Migration Plan

1. Add failing integrity checks for mutable MCP tags and broken inventory or installation documentation.
2. Pin launchers, repair package scripts and CI, then update metadata and documentation until all checks pass.
3. Validate with repository commands, `claude plugin validate`, installed Claude plugin inventory, and `codex plugin list`.
4. Deliver through a feature branch and PR to `main`; rollback is a PR revert, which restores the prior launcher tags and documentation without data migration.

## Open Questions

None.
