## ADDED Requirements

### Requirement: Entry documents describe the supported branch model

The repository README and project CLAUDE guidance SHALL describe feature
branches opening pull requests directly to `main`, and SHALL state that the
repository does not maintain a `develop` branch.

#### Scenario: Contributor reads the README

- **WHEN** a contributor reads the README development workflow
- **THEN** the documented pull request target is `main`
- **AND** the README does not present `develop` as active or retained

#### Scenario: Agent reads project guidance

- **WHEN** an agent reads the project CLAUDE GitHub Flow section
- **THEN** the documented pull request target is `main`
- **AND** the guidance does not allow an active or retained `develop` branch

### Requirement: Documentation claims use independent evidence

The change SHALL validate repository documentation locally and SHALL verify the
remote branch-state claim through a separate GitHub readback.

#### Scenario: Local documentation validation succeeds

- **WHEN** the documentation changes are ready for completion
- **THEN** repository validation and native Claude plugin validation pass

#### Scenario: Remote branch claim is verified

- **WHEN** the change claims that `develop` is not maintained
- **THEN** the remote branch listing contains no `develop` head
