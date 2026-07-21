# plugin-packaging-integrity Specification

## Purpose

Define the repository invariants that keep published plugins secure, structurally valid, cross-runtime compatible, and accurately documented.

## Requirements

### Requirement: Credential-bearing MCP launchers are immutable
Every local MCP launcher that receives a credential or API secret SHALL reference its npm package with an exact semantic version and MUST NOT use `@latest`, a range, or an unversioned package reference.

#### Scenario: Repository launcher validation succeeds
- **WHEN** the repository integrity check inspects the Coolify, Hetzner, and Langfuse MCP launchers
- **THEN** each launcher resolves to the exact package version approved in the repository revision

#### Scenario: Mutable dependency is introduced
- **WHEN** a credential-bearing MCP launcher uses `@latest`, a version range, or no version
- **THEN** repository validation fails and identifies the launcher

### Requirement: Marketplace structure remains cross-runtime compatible
The repository SHALL retain one canonical `.claude-plugin` marketplace whose local entries resolve to plugin folders with matching manifest names, and the released marketplace SHALL remain installable by Claude Code and discoverable through Codex's supported Claude-marketplace compatibility path.

#### Scenario: Structural marketplace validation runs
- **WHEN** repository validation reads every marketplace entry
- **THEN** each source path exists and the entry name, folder name, and plugin manifest name match

#### Scenario: Installed marketplace is accepted by both runtimes
- **WHEN** behavioral acceptance is performed with the native Claude and Codex plugin commands
- **THEN** Claude validation succeeds and Codex lists the `jurislm-tools` marketplace without a duplicate Codex-specific manifest tree

### Requirement: Pull requests enforce repository quality
Pull requests that change marketplace, plugin, script, workflow, or documentation content SHALL run an aggregate validation command covering JSON parsing, release-version synchronization, marketplace integrity, immutable MCP dependencies, and Markdown lint.

#### Scenario: Valid repository change is proposed
- **WHEN** CI evaluates a pull request whose repository artifacts satisfy every quality check
- **THEN** the aggregate validation job succeeds

#### Scenario: Invalid repository artifact is proposed
- **WHEN** CI encounters malformed JSON, version drift, a broken marketplace path or name, a mutable credential-bearing package, or a Markdown violation
- **THEN** the aggregate validation job fails with evidence identifying the violated invariant

### Requirement: User-facing documentation follows repository sources of truth
Current documentation SHALL use `plugin@marketplace` installation identifiers, describe the nine published plugins and GitHub Flow workflow, and SHALL NOT duplicate volatile MCP tool counts across overview metadata when those values cannot be automatically authoritative.

#### Scenario: Installation guidance is followed
- **WHEN** a user copies a plugin installation identifier from current documentation
- **THEN** the identifier names an existing marketplace entry in `plugin@jurislm-tools` form

#### Scenario: Marketplace inventory changes
- **WHEN** a plugin entry is added, removed, renamed, or repointed
- **THEN** repository validation detects structural divergence and current overview documentation is updated in the same change

### Requirement: Review findings have evidence-backed dispositions
The change SHALL preserve a verification record mapping every original review finding to a verified fix, a disproven premise, or a stale external state, and SHALL NOT mutate files solely to satisfy a finding contradicted by live runtime evidence.

#### Scenario: Remediation is reviewed
- **WHEN** an original finding is evaluated during implementation verification
- **THEN** its disposition cites a repeatable command or repository source and only verified defects produce implementation changes
