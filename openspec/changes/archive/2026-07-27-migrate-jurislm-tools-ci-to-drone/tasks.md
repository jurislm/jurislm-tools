## 1. Protect the Drone contract

- [x] 1.1 Add a failing structural policy test at
  `scripts/drone-ci-policy.test.mjs` covering pipeline names, triggers,
  commands, release ordering, and secret indirection.
- [x] 1.2 Add the static Drone validator at
  `scripts/validate-drone-yml.sh` and expose it through `package.json`.

## 2. Migrate repository automation

- [x] 2.1 Add `.drone.yml` with aggregate `validate` and main-only `release`
  pipelines.
- [x] 2.2 Remove `.github/workflows/version-check.yml` and
  `.github/workflows/release.yml` after the Drone contract passes locally.
- [x] 2.3 Update `CLAUDE.md` with the single-platform Drone ownership and
  release behavior.

## 3. Synchronize repository standards

- [x] 3.1 Update
  `plugins/repo-standards/skills/repo-standards/SKILL.md` to document the
  explicit Drone plugin-repository variant and corrected release ordering.
- [x] 3.2 Update
  `plugins/repo-standards/skills/repo-standards/references/ci-workflow-templates.md`
  with the same variant, cutover gates, and no-double-run rule.

## 4. Verify and cut over

- [x] 4.1 Run `scripts/validate-drone-yml.sh`, `npm run validate`,
  `claude plugin validate .`, and strict OpenSpec validation; record results in
  `openspec/changes/migrate-jurislm-tools-ci-to-drone/verification-logs/implementation-verification.md`.
- [x] 4.2 Configure the `RELEASE_PLEASE_TOKEN` Drone repo secret from the
  approved local credential without exposing it, and read back only its name
  and pull-request policy.
- [x] 4.3 Push the feature branch, open its PR, and record a successful live
  Drone build plus matching GitHub commit status before merge.
- [x] 4.4 After merge, read back the `main` Drone validation and release
  results, then update PR #171 from `main` and verify its Drone status.
