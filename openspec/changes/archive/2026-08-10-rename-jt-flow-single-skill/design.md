## Context

The installed `jt-flow` plugin exposes a single-request Skill also named `jt-flow`, alongside `jt-flow-all`. The overlapping plugin and Skill names are ambiguous in the Skills interface. This rename is tracked by issue #152 and updates the living contract.

## Goals / Non-Goals

**Goals:**

- Expose the single-request workflow as `jt-flow-one`.
- Keep queue-to-single and single-to-queue routing accurate.
- Make all current marketplace and repository references consistent.

**Non-Goals:**

- Change the plugin name, workflow behavior, dependency set, or release-managed versions.
- Maintain a `jt-flow` Skill alias.

## Decisions

### Rename the directory and frontmatter together

Move `skills/jt-flow/SKILL.md` to `skills/jt-flow-one/SKILL.md` and change its frontmatter name to `jt-flow-one`. Keeping filesystem discovery and displayed metadata aligned avoids an ambiguous or stale entry point.

### Update current references atomically

Update the queue Skill, metadata, README, project guidance, and this change's delta specification in one implementation change. This avoids routing users to the retired name.

### Do not add a compatibility alias

An alias would preserve the ambiguity the change removes and could make the installed marketplace expose two names for one workflow.

## Risks / Trade-offs

- [Existing prompts mention the retired name] → Document the breaking rename in marketplace-facing descriptions and changelog through the normal release process.
- [A reference is missed] → Use repository-wide searches and structural validation after the rename.

## Migration Plan

1. Rename the Skill directory and frontmatter.
2. Update cross-references, metadata, documentation, and OpenSpec delta.
3. Validate JSON, OpenSpec, version synchronization, file layout, and references.

Rollback is a revert of the implementation commit.

## Open Questions

None.
