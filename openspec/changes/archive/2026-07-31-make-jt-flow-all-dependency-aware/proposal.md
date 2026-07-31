## Why

`jt-flow-all` forces active OpenSpec changes through one serial queue: it ignores dependency and MVP priority, forbids item owners, and lets one blocked item stop unrelated work. A verified `jurislm/entire` audit found 13 local active changes but only 10 on refreshed `origin/main`, so the queue can be slow and wrong. Closes #175.

## What Changes

- **BREAKING**: replace immutable serial delivery with a dependency-aware ready work pool built from a clean snapshot of refreshed remote `main`.
- Inventory open Issues while keeping each whole active OpenSpec change as one execution unit; oversized changes wait for separately approved splits rather than partial-task scheduling.
- Require new or updated proposals to declare a compact `Delivery Relations` contract: priority, hard and acceptance dependencies, external blockers, affected areas, production targets, and primary/related Issues.
- Derive reverse `Blocks` and safe-parallel relationships instead of storing duplicate relationship lists.
- Reserve the primary agent as coordinator and use available remaining slots for independent item owners in isolated worktrees.
- Add explicit queue states through `INTEGRATION_READY`; waiting or blocked items affect only themselves and descendants.
- Serialize merge and production mutation with a permit bound to repo, change, item HEAD, refreshed main, and fresh checks while earlier work overlaps.
- Run one proposal overdesign review before dispatch and keep implementation quality review solely in `jt-flow-one`.
- Preserve per-item proposal GO, review consent, TDD, CI, deployment, and archive gates; quota exhaustion follows bounded skip behavior.

## Delivery Relations

- Priority: `mvp-critical`
- Hard dependencies: none
- Acceptance dependencies: none
- External blockers: none
- Affected areas: `plugins/jt-flow/**`, queue policy tests, jt-flow documentation
- Production targets: none
- Primary Issue: `jurislm/jurislm-tools#175`
- Related Issues: `jurislm/entire#855`, `#898`, `#825`, `#777`, `#778`, `#818`, `#843`, `#917`, `#785`, `#894`, `#774`, `#773`, `#965`

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `jt-flow-queue-delegation`: replace ordered one-at-a-time delegation with dependency-aware bounded dispatch and serialized integration.

## Impact

Affected plugin: `jt-flow` Skills, policy tests, documentation, and living OpenSpec spec. No runtime service, scheduler, database, host-specific API, external dependency, or manual release version is added.

## Non-goals

- Do not let queue approval bypass per-item proposal GO or review consent.
- Do not duplicate `jt-flow-one` implementation or code-review ownership in `jt-flow-all`.
- Do not implement a task scheduler, partially dispatch a change, execute product work, or automatically create changes for open Issues.
