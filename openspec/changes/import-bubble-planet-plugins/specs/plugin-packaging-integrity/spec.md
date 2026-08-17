# plugin-packaging-integrity delta

## MODIFIED Requirements

### Requirement: User-facing documentation follows repository sources of truth

Current documentation SHALL use `plugin@marketplace` installation identifiers,
describe every published plugin in the current marketplace inventory, and
document the GitHub Flow workflow. It SHALL NOT duplicate volatile MCP tool
counts across overview metadata when those values cannot be automatically
authoritative.

#### Scenario: Installation guidance is followed

- **WHEN** a user copies a plugin installation identifier from current
  documentation
- **THEN** the identifier names an existing marketplace entry in
  `plugin@jurislm-tools` form

#### Scenario: Marketplace inventory changes

- **WHEN** a plugin entry is added, removed, renamed, or repointed
- **THEN** repository validation detects structural divergence and current
  overview documentation is updated in the same change
