# Local verification — 2026-08-13

驗證工作樹：`codex/align-release-auto-merge-standard`，起點為
`b79c28b07618bf1ff8f5fcc5d23e9b141002d821`。

| Command | Result |
| --- | --- |
| `npm ci` | Passed. Installed 75 packages from the lockfile. npm reported one high-severity audit advisory; no dependency or lockfile change was made in this change. |
| `npm run validate` | Passed: 162 tests, Plugin repository validation, version sync `1.37.2`, and Markdown lint. |
| `npm run validate:drone` | Passed: the structural validator accepted the `validate`, `release`, and `release-pr-auto-merge` pipelines. |
| `claude plugin validate .` | Passed: marketplace manifest validation. |
| `spectra validate --strict` | Passed: `align-release-auto-merge-standard` is valid. |
| `spectra analyze align-release-auto-merge-standard --json` | Coverage, Consistency, and Gaps are Clean. It reports 11 non-blocking Ambiguity Suggestions and no blocking finding. |
| `spectra drift align-release-auto-merge-standard --json` | Light result: 0 blocked tasks and 0 maybe-done tasks. Its three syntax-anchor notices are the literal terms `--filter`, `--affected`, and the release branch suffix `--branches--main`, not an implementation discrepancy. |

Additional readback: GitHub's Contents API accepted the validator's percent-encoded
nested artifact path at the base commit and returned
`plugins/repo-standards/.claude-plugin/plugin.json`.

## Spectra implementation mapping

- `ci-platform`: `.drone.yml` binds the trusted `main` pipeline to `validate` and
  `release`; `scripts/release-pr-auto-merge.mjs` validates identity, artifacts,
  version semantics, SHA state, mergeability, `main` protection, and the final
  `main` SHA before using GitHub's protected PR merge API. The dedicated 27-test
  suite covers a valid merge, pending checks, a candidate superseded while pending,
  all other no-op cases, stale protected
  merge rejection, untrusted, missing, extra, deleted, divergent, version-drift,
  protection-drift, API-failure, and timeout rejection paths.
- `docs-and-standards`: the living specification, skill, CI templates, and
  checklist state that `jurislm/entire` is the sole verified reference; the
  policy tests require Turborepo scope/cache rules, observable adoption
  acceptance, exact release command versions, and the automatic merge contract.
