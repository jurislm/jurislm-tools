## Why

`jt-flow` is installed but exposes only `commands/` artifacts. Codex loads and presents `SKILL.md` artifacts, so the single-request and queue workflows are unavailable through its Skill interface.

## What Changes

- Convert the existing single-request workflow into a `jt-flow` Skill.
- Convert the existing queue workflow into a `jt-flow-all` Skill.
- **BREAKING**: remove `/jt-flow` and `/jt-flow-all` slash-command entry points.
- Update `jt-flow` marketplace metadata and repository documentation to describe the plugin as Skill-based.

## Capabilities

### New Capabilities

- `jt-flow-skill-workflows`: Provides two discoverable Skill entry points for single-request and issue-queue end-to-end delivery workflows.

### Modified Capabilities

- None.

## Impact

Affected plugin: `jt-flow`. The command content is migrated from `plugins/jt-flow/commands/` to `plugins/jt-flow/skills/`; plugin metadata, marketplace description, and current architecture documentation change. The existing external `superpowers:*` dependency remains unchanged.

## Non-goals

- Do not alter the delivery or queue workflow steps beyond replacing slash-command references with Skill-oriented guidance.
- Do not bundle or change the external `superpowers` dependency.
- Do not change plugin or marketplace version numbers manually.
