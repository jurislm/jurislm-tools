# media-workflow-plugins Specification

## ADDED Requirements

### Requirement: The three media-workflow plugins are first-class marketplace entries

The `jurislm-tools` marketplace SHALL provide independent entries named
`ai-audio-analysis`, `suno-audio-download`, and `minimax-design`. Each entry
MUST resolve to a local `plugins/<name>` directory whose `.claude-plugin/plugin.json`
manifest has the same name.

#### Scenario: Marketplace inventory is inspected

- **WHEN** the marketplace JSON is read
- **THEN** all three media-workflow names and local sources are present
- **AND** each source directory and manifest exists
- **AND** no duplicate `.codex-plugin` marketplace tree is required

#### Scenario: A media-workflow plugin is installed

- **WHEN** a user installs one of the three names with the
  `plugin@jurislm-tools` form
- **THEN** the identifier resolves to the corresponding local marketplace entry

### Requirement: Audio workflow contracts are preserved

The imported `ai-audio-analysis` and `suno-audio-download` plugins SHALL retain
their source Skills' evidence boundaries, local-file verification requirements,
and explicit blocked or partial result states.

#### Scenario: The audio Skills are read

- **WHEN** the two Skill files are compared with their source package files
- **THEN** their operational contracts and required sub-Skill references remain
  present

### Requirement: MiniMax workflow references remain self-contained

The `minimax-design` plugin SHALL retain its multimodal Skill, all referenced
official-guide snapshots, source manifest, desktop workflow, pressure scenarios,
and reference-completeness test under one Skill directory.

#### Scenario: MiniMax reference completeness is checked

- **WHEN** `test_reference_completeness.py` is run from the imported Skill tree
- **THEN** every declared reference and required provenance marker resolves
  without relying on the source cache path

### Requirement: Imported plugins are documented with repository installation identifiers

Each imported plugin SHALL have a README documenting its exact
`<plugin>@jurislm-tools` installation identifier, purpose, and source or
dependency boundary where applicable.

#### Scenario: Plugin README identifiers are validated

- **WHEN** the repository integrity checker extracts installation identifiers
- **THEN** each imported plugin README contains only its matching identifier
