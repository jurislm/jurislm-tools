## 1. Repository integrity checks

- [x] 1.1 Add RED coverage in `scripts/validate-plugin-repository.test.mjs` for mutable credential-bearing npm references, mismatched marketplace entry/path/manifest names, missing source paths, malformed repository JSON, and invalid installation identifiers.
- [x] 1.2 Implement the dependency-free checks in `scripts/validate-plugin-repository.mjs` until `scripts/validate-plugin-repository.test.mjs` passes, preserving the existing release-version behavior in `scripts/check-version-sync.mjs`.

## 2. Immutable MCP launchers

- [x] 2.1 Pin `plugins/coolify/.mcp.json` to `@jurislm/coolify-mcp@3.6.0` and update Coolify-owned package references in `plugins/coolify/README.md`, `plugins/coolify/skills/coolify/SKILL.md`, and `openspec/specs/infra/coolify-detail.md` without changing credentials or release-managed versions.
- [ ] 2.2 Pin `plugins/hetzner/.mcp.json` to `@jurislm/hetzner-mcp@1.5.0` and update Hetzner-owned package references in `plugins/hetzner/README.md`, `plugins/hetzner/skills/hetzner/SKILL.md`, and `openspec/specs/infra/hetzner-detail.md` without changing credentials or release-managed versions.
- [ ] 2.3 Pin `plugins/langfuse/.mcp.json` to `@jurislm/langfuse-mcp@1.3.2` and update Langfuse-owned package references in `plugins/langfuse/README.md`, `plugins/langfuse/skills/langfuse/SKILL.md`, and `openspec/specs/observability/langfuse-detail.md` without changing credentials or release-managed versions.

## 3. Validation and CI

- [ ] 3.1 Replace the removed Markdown target and add focused plus aggregate validation scripts in `package.json`; update `package-lock.json` only if `npm install --package-lock-only` proves it is required.
- [ ] 3.2 Replace the narrow version-only pull-request job in `.github/workflows/version-check.yml` with `npm ci` plus the aggregate repository validation command, using path triggers that cover marketplace, plugin, script, workflow, and documentation changes.
- [ ] 3.3 Verify the existing policy in `.markdownlint.jsonc` against the newly covered tracked Markdown and make only evidence-backed rule adjustments in `.markdownlint.jsonc` when a repository convention intentionally differs.

## 4. Marketplace and documentation

- [ ] 4.1 Add the missing marketplace description, correct current entry descriptions, and remove duplicated volatile tool counts in `.claude-plugin/marketplace.json` while preserving plugin order and the release-managed first-entry version.
- [ ] 4.2 Synchronize `plugins/coolify/.claude-plugin/plugin.json` with the Coolify marketplace description without editing its release-managed version.
- [ ] 4.3 Synchronize `plugins/hetzner/.claude-plugin/plugin.json` with the Hetzner marketplace description without editing its release-managed version.
- [ ] 4.4 Synchronize `plugins/langfuse/.claude-plugin/plugin.json` with the Langfuse marketplace description without editing its release-managed version.
- [ ] 4.5 Rewrite `README.md` installation and inventory sections for the nine current plugins, verified `plugin@jurislm-tools` identifiers, current Skill surfaces, and non-duplicated MCP capability descriptions.
- [ ] 4.6 Update `CLAUDE.md`, `.github/copilot-instructions.md`, and `openspec/specs/_overview/marketplace-architecture.md` to GitHub Flow, the nine-plugin architecture, current install syntax, pinned-dependency policy, and aggregate validation commands.
- [ ] 4.7 Update shared dependency policy in `openspec/specs/infra/infra-overview.md` and remove stale aggregate tool-count claims without changing any individual plugin implementation.

## 5. Verification and delivery evidence

- [ ] 5.1 Run the tests and aggregate validation from `package.json`, plus strict validation of `openspec/changes/harden-plugin-packaging-and-validation/`; record exact results in `openspec/changes/harden-plugin-packaging-and-validation/verification-logs/implementation-verification.md`.
- [ ] 5.2 Run `claude plugin validate .`, validate each affected plugin manifest, and confirm `codex plugin list` still discovers `jurislm-tools`; record results and all six finding dispositions in `openspec/changes/harden-plugin-packaging-and-validation/verification-logs/implementation-verification.md`.
- [ ] 5.3 Use `openspec/changes/harden-plugin-packaging-and-validation/specs/plugin-packaging-integrity/spec.md` and `tasks.md` for final behavior-level verification before PR delivery; do not archive until merged `main` is revalidated.
