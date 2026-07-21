# Implementation verification

Date: 2026-07-21

## Automated validation

| Command | Result |
|---|---|
| `npm run validate` | PASS: 19 tests passed; repository integrity, version sync at `1.32.0`, and scoped Markdown lint passed. |
| `node scripts/check-version-sync.mjs` | PASS: `Version sync OK: 1.32.0`. |
| `openspec validate harden-plugin-packaging-and-validation --strict` | PASS: change is valid. |
| `git diff --check` | PASS: no whitespace errors. |

The repository test suite covers mutable credential-bearing npm references,
marketplace/path/manifest name mismatches, missing source paths, malformed JSON,
local Claude worktree exclusion, structured and shell npm package runners,
per-server and per-package launcher isolation, duplicate or orphaned marketplace
inventory, and exact installation identifiers in both the root and per-plugin
README files.

## Review follow-up

GitHub Codex review raised five P2 issues against the initial validator. All
five were reproduced before implementation and resolved with regression tests:

- unrelated `.claude/worktrees` content is excluded from JSON discovery;
- every local `npx` and `npm exec` package runner is checked without relying on
  credential-name guesses;
- structured command/args and shell command forms, including exact unscoped
  packages, are parsed per invocation and per explicit package;
- documentation IDs are parsed as complete install-command tokens, so a suffix
  typo cannot satisfy the expected identifier.

Independent Superpowers review then reproduced structured command/args,
multi-invocation, and one-way inventory gaps. The final validator additionally
compares marketplace names and sources, plugin manifest directories, and
documented installation IDs as complete sets, rejecting duplicates and orphaned
artifacts. Final re-review also verified newline and background-operator shell
boundaries, which now isolate every package-runner invocation.

## Native runtime acceptance

| Command | Result |
|---|---|
| `claude plugin validate .` | PASS: marketplace validation completed without warnings. |
| `claude plugin validate plugins/<name>` for all nine marketplace entries | PASS: Coolify, Hetzner, Langfuse, jt-flow, repo-standards, podcast-to-blog, codebase-sync, learn-eval, and Higgsfield manifests are valid. |
| `codex plugin list \| rg -A 15 'Marketplace \`jurislm-tools\`'` | PASS: Codex discovered the canonical `.claude-plugin/marketplace.json`, listed all nine entries, and reported Coolify, Hetzner, Langfuse, and jt-flow installed and enabled at `1.32.0`. |

The Codex command emitted a non-fatal sandbox warning about creating PATH
aliases. Marketplace discovery and listing still completed successfully.

## Original finding dispositions

| Finding | Disposition | Repeatable evidence |
|---|---|---|
| Credential-bearing MCP launchers use `@latest`. | Fixed. Coolify, Hetzner, and Langfuse now use exact published versions `3.6.0`, `1.5.0`, and `1.3.2`; the repository validator rejects mutable replacements. | `npm run check:plugins`; `node --test scripts/validate-plugin-repository.test.mjs` |
| Codex-specific manifests and marketplace are absent. | Disproved premise; no duplicate manifest tree was added. Current Codex supports the canonical Claude marketplace compatibility path. | `codex plugin list \| rg -A 15 'Marketplace \`jurislm-tools\`'` |
| Skill frontmatter fails a standalone Codex quick validator. | Disproved premise for the installed cross-runtime marketplace; Claude metadata was preserved because the Skills are loaded by current Codex. | `codex plugin list`; current Codex session exposes `jt-flow:jt-flow` and the installed infrastructure Skills. |
| The local checkout is stale and conflicts with untracked OpenSpec files. | Stale external state; no remediation change was required. The proposal began from clean, synchronized `main` at `4a77922`. | `git status --short --branch`; `git rev-parse main origin/main` in the pre-proposal inventory. |
| Markdown lint is ineffective. | Fixed. The removed target was replaced with tracked entrypoint and OpenSpec coverage, and PR CI runs the aggregate command. | `npm run lint:md`; `npm run validate` |
| Documentation and metadata have drifted. | Fixed. Current docs describe nine plugins, `plugin@jurislm-tools`, GitHub Flow, exact MCP pins, and stable capability descriptions. | `npm run check:plugins`; `claude plugin validate .`; repository diff review. |

## Behavior-level verification

- Immutable launcher requirement: exact-version positive checks and mutable-tag
  negative tests pass.
- Cross-runtime marketplace requirement: structural validation, Claude native
  validation, and Codex native discovery pass without duplicate manifests.
- Pull-request quality requirement: `npm run validate` aggregates tests,
  marketplace integrity, release-version synchronization, and Markdown lint;
  `.github/workflows/version-check.yml` runs it for relevant pull requests.
- Documentation requirement: the validator confirms every marketplace plugin has
  a README containing its correct installation identifier, while the root README
  covers all nine identifiers.
- Evidence-backed disposition requirement: every original review finding is
  mapped above to a fix, disproved premise, or stale state.

The implementation satisfies the change spec and completed task list. Archival
remains intentionally deferred until the merged `main` revision is revalidated.
