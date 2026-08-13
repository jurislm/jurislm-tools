# Recovery local verification — 2026-08-13

驗證工作樹：`codex/recover-release-delivery`，起點為 failed delivery
`3197ce9df8312d23f303405740e63132ef3e8326`。

## Regression and repository validation

| Check | Result |
| --- | --- |
| Red test | Before implementation, the new focused suite failed on missing `DRONE_COMMIT` binding, raw Compare classification of `test(ci)`, missing first-parent traversal, merge recovery parsing, merge method, and policy wording. |
| Focused suite | `node --test scripts/release-eligibility.test.mjs scripts/release-pr-auto-merge.test.mjs scripts/repo-standards-policy.test.mjs` passed: 45 tests. |
| Historic delivery readback | With `DRONE_COMMIT=3197ce9df8312d23f303405740e63132ef3e8326`, the source-controlled eligibility command printed `feat/fix commit found; running release-pr.` It used GitHub Compare read-only access and did not invoke Release Please. |
| `npm ci` | Passed. Installed 75 packages from the lockfile. npm reported one pre-existing high-severity audit advisory; no dependency or lockfile change was made. |
| `npm run validate` | Passed: 167 tests, plugin repository validation, version sync `1.37.2`, and Markdown lint. |
| `npm run validate:drone` | Passed: `validate`, `release`, and `release-pr-auto-merge` structural contract accepted. |
| `claude plugin validate .` | Passed. |
| `spectra validate --strict` | Passed: `align-release-auto-merge-standard` is valid. |
| `spectra analyze align-release-auto-merge-standard --json` | Coverage, Consistency, and Gaps are Clean. It reports the pre-existing 11 non-blocking ambiguity suggestions. |
| `spectra drift align-release-auto-merge-standard --json` | Light result: no blocked or maybe-done task. Its three syntax-anchor notices are literal `--filter`, `--affected`, and `--branches--main` text, not a code discrepancy. |
| `git diff --check` | Passed. |

## GitHub configuration readback

```json
{
  "allow_auto_merge": true,
  "allow_merge_commit": false,
  "allow_rebase_merge": false,
  "allow_squash_merge": true,
  "use_squash_pr_title_as_default": true
}
```

```json
{
  "enforce_admins": true,
  "required_pull_request_reviews": null,
  "required_status_checks": {
    "contexts": ["continuous-integration/drone/pr"],
    "strict": true
  }
}
```

## Remaining acceptance

The only remaining delivery acceptance is task 4.2: merge this source-controlled
recovery through a squash PR, read back its Drone delivery, observe the generated
Release Please PR automatically squash-merge without human action, then read back
the release commit's follow-up build, tag, and GitHub release. No manual release
or manual candidate merge is authorized.

## Final rerun after template alignment

After the policy test exposed and corrected the stale raw-branch template wording,
the final repository rerun passed: `npm run validate` (168 tests), `npm run
validate:drone`, `claude plugin validate .`, `spectra validate --strict`,
`spectra analyze align-release-auto-merge-standard --json` (Coverage,
Consistency, and Gaps Clean; the same 11 non-blocking ambiguity suggestions), and
`git diff --check`.
