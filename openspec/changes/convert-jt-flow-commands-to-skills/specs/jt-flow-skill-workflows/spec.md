## ADDED Requirements

### Requirement: Single-request delivery Skill
The `jt-flow` plugin SHALL provide `skills/jt-flow/SKILL.md` as the discoverable entry point for a single end-to-end delivery request. The Skill SHALL state natural-language trigger phrases and SHALL direct issue-queue work to the `jt-flow-all` Skill.

#### Scenario: Single delivery request is routed
- **WHEN** a user asks to deliver one clearly scoped feature end to end
- **THEN** the `jt-flow` Skill is available as the workflow entry point

### Requirement: Issue-queue delivery Skill
The `jt-flow` plugin SHALL provide `skills/jt-flow-all/SKILL.md` as the discoverable entry point for issue-queue ranking and sequential delivery. The Skill SHALL state natural-language trigger phrases and SHALL direct a single delivery request to the `jt-flow` Skill.

#### Scenario: Queue delivery request is routed
- **WHEN** a user asks to sort and process an issue backlog
- **THEN** the `jt-flow-all` Skill is available as the workflow entry point

### Requirement: Slash-command entry points are removed
The `jt-flow` plugin MUST NOT contain `commands/jt-flow.md` or `commands/jt-flow-all.md`, and current marketplace metadata and repository documentation MUST NOT present `/jt-flow` or `/jt-flow-all` as available commands.

#### Scenario: Installed plugin is inspected
- **WHEN** the installed `jt-flow` plugin files are enumerated
- **THEN** its two workflow entry points are `SKILL.md` files and no corresponding command files exist

### Requirement: Workflow content and dependencies are retained
The migrated Skills SHALL retain the existing workflows and their dependency on externally installed `superpowers:*` Skills. The conversion SHALL NOT alter release-managed version fields.

#### Scenario: Migrated Skill is reviewed
- **WHEN** either migrated Skill is compared with its prior command document
- **THEN** its workflow steps and external `superpowers:*` dependency remain present apart from invocation-format changes
