## Why

The repository's only direct npm dependency, the development-only
`markdownlint-cli@0.48.0`, currently resolves four vulnerable transitive
packages and causes `npm ci` to report five audit findings. The lint toolchain
should be upgraded now because its fixed release is compatible with the
repository's current Node.js 22 environment. The upgraded lock requires Node.js
`>=22.22.2` and can remove the findings without changing runtime plugins.

Closes #167

## What Changes

- Upgrade `markdownlint-cli` from the `0.48` line to `0.49.1` and refresh only
  the npm dependency lock data required by that upgrade.
- Refresh any still-vulnerable transitive resolution within the upgraded
  package's declared compatible range when npm preserves an older lock entry.
- Require a full `npm audit` result with zero known vulnerabilities while
  preserving the existing Markdown lint command and repository validations.
- Document and verify the upgraded tree's effective Node.js minimum of
  `22.22.2`.
- Record reproducible before/after dependency-tree and audit evidence.
- Avoid dependency overrides, `npm audit fix --force`, unrelated package
  updates, and release-managed version changes.

## Capabilities

### New Capabilities

- `development-dependency-security`: Defines the repository contract for
  evidence-backed development dependency remediation and audit verification.

### Modified Capabilities

None.

## Impact

- Affected files: `package.json`, `package-lock.json`, and this OpenSpec change.
- Affected dependency: development-only `markdownlint-cli`; no production
  dependency or published plugin runtime package changes.
- Affected validation: npm audit, Markdown lint, repository tests, plugin
  validation, and OpenSpec strict validation.
- Existing plugins affected: none; the shared repository documentation lint
  toolchain is affected.

## Non-goals

- Adding an automated dependency bot or a permanent zero-warning CI gate.
- Refactoring Markdown rules or changing the set of files linted.
- Remediating unrelated GitHub Actions or MCP package versions.
