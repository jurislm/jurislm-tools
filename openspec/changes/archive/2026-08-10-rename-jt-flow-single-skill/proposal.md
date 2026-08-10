## Why

The `jt-flow` plugin and its single-request Skill currently have the same displayed name, which makes intent routing and Skill selection ambiguous in Codex. Renaming the Skill now preserves the plugin identity while making the single-request entry point distinct.

## What Changes

- **BREAKING**: rename the single-request Skill from `jt-flow` to `jt-flow-one`.
- Rename its Skill directory and update all current sibling-Skill references.
- Update plugin metadata, marketplace descriptions, repository documentation, and living OpenSpec requirements.
- Preserve the `jt-flow` plugin name, `jt-flow-all` Skill name, workflow behavior, and release-managed versions.

## Capabilities

### New Capabilities

- `jt-flow-single-skill-naming`: Provides an unambiguous discoverable name for the single-request delivery Skill.

### Modified Capabilities

- None.

## Impact

Affected plugin: `jt-flow`; its `SKILL.md` paths, marketplace-facing descriptions, repository documentation, and Skill workflow contract. No runtime code, external dependency, or version field changes.

## Non-goals

- Do not rename the `jt-flow` plugin or the `jt-flow-all` queue Skill.
- Do not alter either workflow's steps or its `superpowers:*` dependency.
- Do not provide a compatibility alias for the retired `jt-flow` Skill name.
