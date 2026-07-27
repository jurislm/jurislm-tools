## Context

The repository uses `markdownlint-cli` only as a development dependency behind
`npm run lint:md`, but version `0.48.0` resolves four vulnerable transitive
packages. The five audit entries are availability/complexity advisories, not
runtime exposure: `npm audit --omit=dev` is clean and this repository has no
application deployment. Nevertheless, the dependency tree is installed in CI
and on contributor machines.

The upstream `markdownlint-cli@0.49.1` release requires Node.js 22, while its
locked `commander@15.0.0` and `ini@7.0.0` transitives raise the effective
minimum to Node.js `22.22.2`. The current local environment is `22.23.1`, and
the repository workflow's floating Node.js 22 selection resolves to a
compatible current patch. The upgrade replaces the affected dependency lines
while preserving the command-line interface used by the repository.

## Goals / Non-Goals

**Goals:**

- Remove all currently reported npm audit findings through an upstream-supported
  direct dependency upgrade.
- Preserve the exact `lint:md` command, lint scope, rules, and validation suite.
- Keep the package change reviewable by limiting dependency edits to
  `markdownlint-cli` and its lockfile closure.
- Produce evidence for the resolved dependency tree and zero-result full audit.
- State and verify the effective Node.js minimum as `22.22.2`, rather than
  implying compatibility with every Node.js 22 patch.

**Non-Goals:**

- Introduce overrides, automated dependency updates, or a new CI audit gate.
- Change Markdown content or lint policy to accommodate the new version.
- Update plugin runtime dependencies, GitHub Actions, or release versions.

## Decisions

### Upgrade the direct dependency to `^0.49.1`

Use `npm install --save-dev markdownlint-cli@^0.49.1` in the isolated worktree.
This expresses the existing caret-based dependency policy while moving the
minimum version to the first verified fixed release. If npm preserves a
vulnerable transitive lock entry that remains within the upgraded dependency's
declared range, use a package-scoped `npm update <transitive>` to refresh only
that resolution.

Alternative: pin exactly `0.49.1`. Rejected because this non-credential-bearing
development tool already uses caret semantics, and this change does not propose
a broader dependency policy change.

Alternative: use npm `overrides` for `js-yaml`, `markdown-it`, `linkify-it`, and
`brace-expansion`. Rejected because it bypasses the direct package's tested
dependency ranges and creates repository-owned compatibility risk.

The first Green attempt established that `minimatch@10.2.5` legitimately
declares `brace-expansion ^5.0.5`, but npm retained vulnerable
`brace-expansion@5.0.6` from the old lockfile. Refreshing that package to
`5.0.8` is within the upstream range and is therefore part of the required
lockfile closure, not an override or new direct dependency.

### Treat the audit as the TDD acceptance boundary

The failing baseline is the machine-readable full `npm audit --json` count of
five. After the single dependency update, the same command must report zero.
Existing behavioral coverage is the unchanged Markdown lint command plus the
full repository and native plugin validators.

Alternative: add a new test that asserts a hard-coded dependency version.
Rejected because the requirement is vulnerability absence and validation
compatibility, not permanent coupling to one patch version.

### Keep the change development-only

Only `package.json`, `package-lock.json`, contributor-facing Node prerequisite
guidance in `README.md`/`CLAUDE.md`, and OpenSpec evidence may change. Review the
lockfile diff to confirm no production, plugin runtime, or unrelated package
movement.

### Make the effective engine range an enforceable public contract

Add the most restrictive locked transitive engine range to root
`package.json.engines.node`: `^22.22.2 || ^24.15.0 || >=26.0.0`. Mirror that
exact range in README contributor setup and CLAUDE required-validation guidance.
This prevents contributors from treating every Node.js 22 or 24 patch as
supported merely because npm normally treats transitive engine declarations as
advisory.

Alternative: record only `>=22.22.2`. Rejected because locked `ini@7.0.0`
explicitly excludes Node.js 23 and early Node.js 24, so a monotonic minimum
would overstate compatibility.

Alternative: leave the range only in temporary OpenSpec evidence. Rejected
because that disappears from the active contributor path after archive and
does not give npm a root engine contract.

## Risks / Trade-offs

- The upgraded lock raises the effective Node.js floor from 20 to `22.22.2` →
  the local environment is `22.23.1`; CI selects the current Node.js 22 patch,
  and validation must confirm it remains at or above the effective minimum.
- A new linter release may expose new Markdown violations → run the unchanged
  lint command before accepting the upgrade; do not weaken rules to force green.
- Caret resolution can advance within the `0.49` line on future installs →
  `package-lock.json` preserves the reviewed tree, while normal dependency PRs
  remain responsible for later lock updates.
- Audit registry state can change over time → capture the date, resolved tree,
  and audit metadata in the verification log.

## Migration Plan

1. Capture the failing audit count and current dependency tree.
2. Update the direct development dependency, then refresh only any vulnerable
   transitive resolution retained within the new supported dependency range.
3. Restore invariant lockfile root metadata if npm derives it from the linked
   worktree directory, then confirm the remaining diff is limited to the
   intended dependency closure.
4. Add the exact effective Node.js range to root package metadata and
   contributor setup documentation.
5. Run the full audit and all repository validations.
6. If any contract fails, revert the package and contributor-document changes
   in the feature branch;
   no deployed service, data, or schema rollback is required.

## Open Questions

None. Node.js compatibility, package scope, and the target fixed release were
verified before proposal creation.
