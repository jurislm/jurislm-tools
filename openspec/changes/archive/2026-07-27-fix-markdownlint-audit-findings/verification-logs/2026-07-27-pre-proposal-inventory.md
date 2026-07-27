# Pre-proposal inventory: markdownlint audit remediation

Date: 2026-07-27 (Asia/Taipei)

## Repository and workflow

- Repository root was clean on `main` at
  `821d8c25b1448ec40b0e9f12cd9feef58f83ea96`.
- No local or remote `develop` branch exists. Repository Quality runs for pull
  requests on Node.js 22; Release Please runs after pushes to `main`.
- The repository has no application deployment pipeline.
- Work is isolated at
  `.claude/worktrees/fix-markdownlint-audit-findings` on
  `codex/fix-markdownlint-audit-findings`, based on `origin/main`.

## Dependency and vulnerability evidence

- `package.json` has one direct dependency:
  `devDependencies.markdownlint-cli = "^0.48.0"`.
- `npm ls markdownlint-cli js-yaml markdown-it linkify-it brace-expansion
  --all` resolved:
  - `markdownlint-cli@0.48.0`
  - `js-yaml@4.1.1`
  - `markdown-it@14.1.1`
  - `linkify-it@5.0.1`
  - `brace-expansion@5.0.6`
- `npm audit --json` reported 5 findings: 2 moderate, 3 high, 0 critical.
- All findings are within the development-only markdown lint tree.
- `npm audit --omit=dev --json` reported 0 production findings.
- The findings are denial-of-service advisories in `js-yaml`, `markdown-it`,
  `linkify-it`, and `brace-expansion`; the repository does not expose these
  packages as a runtime service.
- `npm view markdownlint-cli@0.49.1` reports Node.js `>=22` and fixed dependency
  lines including `js-yaml ~5.2.1` and `markdown-it ~14.3.0`.
- The local Node.js version is `v22.23.1`; CI uses Node.js 22.
- `npm audit fix --dry-run --json` proposed only two transitive updates and did
  not provide a complete remediation plan. No actual audit fix was run.

## Existing work and tracking

- GitHub issue search found no existing matching audit/dependency issue.
- Issue #167 was created as a Task with Priority Medium, Effort Low,
  `dependencies` and `chore` labels, and assignee `terry90918`.
- Active OpenSpec proposals concern jt-flow migration/queue work and do not
  overlap this dependency remediation.
- The archived `harden-plugin-packaging-and-validation` change established the
  unified `npm run validate` and Markdown lint coverage; this change preserves
  that validation surface.

## Baseline verification

- Fresh `npm ci` reproduced 5 findings.
- `npm test` passed 42 tests with 0 failures.
- `.coderabbit.yaml` has automatic review disabled for `main`.

## Scope conclusion

Use the smallest upstream-supported direct dependency upgrade,
`markdownlint-cli@0.49.1`, without overrides or `--force`. Acceptance requires
the full audit to reach zero and all existing repository validations to remain
green.
