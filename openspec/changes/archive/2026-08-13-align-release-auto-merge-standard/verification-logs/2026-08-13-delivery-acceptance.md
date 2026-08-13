# Delivery acceptance — 2026-08-13

## Source-controlled recovery delivery

| Event | Readback |
| --- | --- |
| Recovery source PR | #217 (`fix(release): recover mainline delivery eligibility`) squash-merged at `2026-08-13T09:02:48Z` as `7ea5754eff8a18b686258172deb88d4d55e559ff`, with sole parent `3197ce9df8312d23f303405740e63132ef3e8326`. |
| Push delivery | GitHub webhook delivery `3836719566174568400` returned HTTP `200` at `2026-08-13T09:02:52.236Z`. |
| Drone build #107 | Push delivery for `7ea5754…` succeeded. Its `validate`, `release` (`github-release` then `release-pr`), and `release-pr-auto-merge` pipelines all exited `0`. |
| Candidate | Release Please opened #218, `chore(main): release 1.38.0`, from `release-please--branches--main`. |
| Non-interactive merge proof | Build #107 `merge-release-pr` log recorded `Merged release-please Release PR #218.` The candidate merged at `2026-08-13T09:03:53Z`; no human merged the release PR. |
| Release commit | #218 landed as single-parent squash commit `d851365282f524d7dbcadcc756096f401aa4e89c` with subject `chore(main): release 1.38.0`. |
| Follow-up build | Drone build #109, the push delivery for `d851365…`, succeeded; `validate`, `release` (`github-release` and safe release-pr skip), and `release-pr-auto-merge` all exited `0`. |
| Published release | GitHub tag and release `v1.38.0` target `d851365…`, published at `2026-08-13T09:04:08Z`; it is neither draft nor prerelease. |
| Tracking | #215 was closed at `2026-08-13T09:05:33Z` with the delivery evidence. |

## Acceptance conclusion

The recovery was source-controlled and followed the protected PR path. No manual
Release Please write command, manual release-PR merge, tag creation, or GitHub
release creation was used as a fallback. This completes task 4.2.

## Archive handling

Spectra 2.3.1 correctly read this worktree's change status, but its mutating
`task done` operation addressed a separate same-named change in another
worktree. To avoid a cross-worktree archive mutation, the completed artifacts
and synced living specs are archived through a source-controlled Git move from
this verified worktree rather than invoking the unsafe CLI mutation.
