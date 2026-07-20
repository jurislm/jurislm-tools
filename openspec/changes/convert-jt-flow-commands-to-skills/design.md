## Context

`jt-flow` presently contains two complete workflow documents in `commands/`, one for a single request and another for an issue queue. Its plugin metadata and marketplace entry describe those documents as slash-command entry points. Codex instead discovers Skill artifacts at `skills/<name>/SKILL.md` and presents them in its available-Skills interface.

## Goals / Non-Goals

**Goals:**

- Expose the two existing workflows as independently discoverable Skills.
- Preserve each workflow's substantive steps and its `superpowers:*` dependency.
- Remove the two slash-command entry points and all current documentation that advertises them.

**Non-Goals:**

- Change the underlying delivery workflow, the queue-ranking policy, or the external dependency set.
- Provide command aliases or a backwards-compatibility shim.
- Manually change any release-managed version.

## Decisions

### One Skill per current command

**Decision: two command artifacts → two Skill artifacts.** Create `skills/jt-flow/SKILL.md` for the single-request flow and `skills/jt-flow-all/SKILL.md` for the queue flow. This preserves separate intent routing and avoids embedding two invocation modes in one oversized Skill.

### Convert invocation syntax into trigger guidance

**Decision: `$ARGUMENTS` and slash-command references → natural-language Skill triggers and sibling-Skill references.** Each new frontmatter description will identify its use cases, while the prose will refer to `jt-flow` or `jt-flow-all` as Skills.

### No compatibility layer

**Decision: remove `commands/` outright.** The user requested slash-command removal.

## Risks / Trade-offs

- [Existing users type slash commands] → Document this as a breaking change; no alias remains.
- [A migrated document accidentally changes workflow semantics] → Preserve the complete body and limit edits to invocation format and cross-entry references.
- [Codex displays an older cached version] → Reload the locally mounted marketplace after merge and verify both Skills are listed.

## Migration Plan

1. Create the two `SKILL.md` files and remove the two command files.
2. Update plugin metadata, marketplace description, and current architecture documentation.
3. Validate JSON and release-version synchronization.
4. Reload the marketplace and verify the two Skills are listed without slash commands.

Rollback is a revert of the feature commit.

## Open Questions

None.
