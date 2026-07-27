## 1. Establish the failing security baseline

- [x] 1.1 Run `npm audit --json` and `npm ls markdownlint-cli js-yaml markdown-it linkify-it brace-expansion --all`, then record the five-finding baseline in `openspec/changes/fix-markdownlint-audit-findings/verification-logs/2026-07-27-implementation-verification.md`.
- [x] 1.2 Confirm with `npm audit --omit=dev --json` that `package.json` has no production dependency finding before changing the development toolchain.

## 2. Upgrade the owning development dependency

- [ ] 2.1 Update `package.json` and `package-lock.json` with `npm install --save-dev markdownlint-cli@^0.49.1`, then use `npm update brace-expansion` to refresh the vulnerable retained lock resolution within `minimatch`'s supported range; do not use `--force`, add `overrides`, or add `brace-expansion` as a direct dependency.
- [ ] 2.2 Restore the original `package-lock.json` root name if npm derives it from the worktree directory, then review the package diff and resolved `npm ls` tree to verify that changes are limited to `markdownlint-cli` and the transitive closure required by that upgrade.

## 3. Verify security and behavior

- [ ] 3.1 Run a fresh `npm ci`, then require `npm audit --json` to report zero vulnerabilities at every severity.
- [ ] 3.2 Run the unchanged Markdown lint contract through `npm run lint:md` and confirm no rule, scope, or Markdown content change is required.
- [ ] 3.3 Run `npm run validate`, `claude plugin validate .`, and `openspec validate fix-markdownlint-audit-findings --strict`.
- [ ] 3.4 Record commands, resolved versions, audit metadata, and validation results in `openspec/changes/fix-markdownlint-audit-findings/verification-logs/2026-07-27-implementation-verification.md`.

## 4. Review and delivery

- [ ] 4.1 Use `openspec verify`/the repo-local verification workflow to compare `package.json`, `package-lock.json`, and the evidence log against the `development-dependency-security` spec.
- [ ] 4.2 Complete local review, secret preflight, PR review, CI, mergeability, and review-thread resolution without broadening the dependency scope.
- [ ] 4.3 After the implementation PR reaches `main`, verify the merged commit and audit/validation evidence, sync the new living spec, and archive `openspec/changes/fix-markdownlint-audit-findings/`.
