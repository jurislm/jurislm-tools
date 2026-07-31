## Why

`jt-flow-all` duplicates the single-request delivery workflow that `jt-flow-one` already owns. This creates two sources of truth for issue, proposal, implementation, review, deployment, and archive behavior.

## What Changes

- Make `jt-flow-all` retain only repository preflight, multi-issue inventory, prioritization, and ordered orchestration.
- After the user confirms the queue order, have `jt-flow-all` directly invoke `jt-flow-one` once per ranked issue and wait for its terminal result before continuing.
- Remove the duplicated single-request delivery phases from `jt-flow-all`.
- Carry CodeRabbit authorization context only from an explicit `jt-flow-all` invocation; otherwise preserve the delegated Skill's disclosure and consent gate.
- Before queueing an active OpenSpec change without an issue, obtain approval to create its tracking issue and record the `Tracks:#<n>` relationship.

## Capabilities

### New Capabilities

- `jt-flow-queue-delegation`: Provides ordered multi-issue orchestration by directly delegating each issue to the single-request Skill.

### Modified Capabilities

- None.

## Impact

Affected plugin: `jt-flow`, specifically `plugins/jt-flow/skills/jt-flow-all/SKILL.md`. `jt-flow-one` becomes the sole owner of the end-to-end delivery workflow. No plugin identity, dependency, or release-managed version changes.

## Non-goals

- Do not change `jt-flow-one` workflow semantics or its proposal and approval gates.
- Do not add or permit parallel issue delivery; process one ranked issue at a time and wait for its terminal result.
- Do not change queue ranking criteria or create a host-specific Skill invocation mechanism.
