# jt-flow-skill-workflows Specification

## Purpose
Define the discoverable `jt-flow-one` and `jt-flow-all` Skills and their
OpenSpec-based delivery relationship: one Skill owns a single whole-change
delivery, while the other builds a dependency-aware queue from active OpenSpec
changes and delegates each eligible whole change to `jt-flow-one`.
## Requirements
### Requirement: Single-request delivery Skill
The `jt-flow` plugin SHALL provide `skills/jt-flow-one/SKILL.md` as the discoverable entry point for a single end-to-end delivery request. The Skill SHALL state natural-language trigger phrases and SHALL direct active OpenSpec queue work to the `jt-flow-all` Skill.

#### Scenario: Single delivery request is routed
- **WHEN** a user asks to deliver one clearly scoped feature end to end
- **THEN** the `jt-flow-one` Skill is available as the workflow entry point

### Requirement: OpenSpec queue delivery Skill
The `jt-flow` plugin SHALL provide `skills/jt-flow-all/SKILL.md` as the discoverable entry point for ranking and sequential delivery of active OpenSpec changes. The Skill SHALL state natural-language trigger phrases, derive queue eligibility from active changes and Delivery Relations, and SHALL directly delegate each confirmed whole change to the `jt-flow-one` Skill.

#### Scenario: OpenSpec queue delivery request is routed
- **WHEN** a user asks to sort and process active OpenSpec changes
- **THEN** the `jt-flow-all` Skill is available as the workflow entry point

### Requirement: Slash-command entry points are removed
The `jt-flow` plugin MUST NOT contain `commands/jt-flow.md` or `commands/jt-flow-all.md`, and current marketplace metadata and repository documentation MUST NOT present `/jt-flow` or `/jt-flow-all` as available commands.

#### Scenario: Installed plugin is inspected
- **WHEN** the installed `jt-flow` plugin files are enumerated
- **THEN** its two workflow entry points are `SKILL.md` files and no corresponding command files exist

### Requirement: Workflow content and dependencies are retained
The migration SHALL retain the single-request delivery workflow in `jt-flow-one`, the active OpenSpec change inventory, Delivery Relations, prioritization, ordering, and delegation workflow in `jt-flow-all`, and their dependency on externally installed `superpowers:*` Skills. A later change MAY move duplicated per-item delivery procedures from `jt-flow-all` to direct `jt-flow-one` delegation. The conversion SHALL NOT alter release-managed version fields.

#### Scenario: Migrated Skill is reviewed
- **WHEN** either migrated Skill is compared with its prior command document
- **THEN** `jt-flow-one` retains the single-request delivery workflow, `jt-flow-all` retains queue orchestration and direct delegation, and their external `superpowers:*` dependency remains present
