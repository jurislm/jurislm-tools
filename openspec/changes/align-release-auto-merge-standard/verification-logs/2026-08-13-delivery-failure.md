# Delivery failure evidence — 2026-08-13

## What happened

Source PR #216 merged to `main` as `3197ce9df8312d23f303405740e63132ef3e8326`.
GitHub delivered its push webhook to Drone, which started build #105. The delivery
failed closed before creating a Release Please candidate:

| Pipeline / step | Readback |
| --- | --- |
| `validate` | `validate-squash-subject.mjs` rejected the GitHub default merge subject `Merge pull request #216 from jurislm/codex/align-release-auto-merge-standard` because it is not a permitted Conventional Commit title. |
| `release / release-pr` | `release-eligibility.mjs` rejected `test(ci): add release auto-merge policy red tests` in the Compare range. |
| `release-pr-auto-merge` | Skipped because `validate` and `release` failed. |
| GitHub | No release PR, tag, or GitHub release was created; latest published tag remained `v1.37.2`. |

## Root cause

GitHub Compare from `v1.37.2` to the delivery SHA returned eleven reachable
commits. Nine were PR-side commits; only the first-parent chain represented
main delivery units. The merge commit had first parent `b79c28b` and second
parent `7277720`; its body held the valid PR title `feat(release): auto-merge
trusted Release Please PRs`. The raw-Compare guard treated side-branch
`test(ci)` commits and the GitHub merge subject as direct main history.

## Recovery rule

No release artifact, tag, or release was created manually. The recovery must
be source-controlled: bind eligibility to immutable `DRONE_COMMIT`, classify
only its first-parent mainline units, accept the existing default merge only
when its exact GitHub format and valid body title are both verified, and enforce
future squash-only merges with the PR title as the resulting commit title.
