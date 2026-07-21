## ADDED Requirements

### Requirement: Unambiguous single-request delivery Skill name
The `jt-flow` plugin SHALL provide `skills/jt-flow-one/SKILL.md` as the discoverable entry point for a single end-to-end delivery request. The Skill frontmatter SHALL name it `jt-flow-one`, state natural-language trigger phrases, and direct issue-queue work to `jt-flow-all`.

#### Scenario: Single delivery request is routed

- **WHEN** a user asks to deliver one clearly scoped feature end to end
- **THEN** the `jt-flow-one` Skill is available as the workflow entry point

### Requirement: Retired overlapping single-request Skill name is absent
The `jt-flow` plugin MUST NOT provide `skills/jt-flow/SKILL.md` or present `jt-flow` as the single-request Skill in current marketplace metadata or repository documentation.

#### Scenario: Installed plugin is inspected

- **WHEN** the installed `jt-flow` plugin files and current documentation are inspected
- **THEN** the single-request workflow is named `jt-flow-one` and no `skills/jt-flow/SKILL.md` entry point exists
