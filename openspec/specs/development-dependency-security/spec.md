# Development Dependency Security

## Purpose

Define how the repository remediates development-only npm vulnerabilities,
proves the resulting dependency tree is clean, and communicates any toolchain
compatibility constraints to contributors.

## Requirements

### Requirement: Development dependency findings are remediated through supported upgrades

The repository SHALL remediate known development dependency vulnerabilities by
upgrading the owning direct dependency to an upstream-supported version. The
remediation MUST NOT rely on `npm audit fix --force` or transitive dependency
overrides when a compatible direct upgrade is available.

#### Scenario: Compatible direct upgrade is available

- **WHEN** all audit findings trace to a direct development dependency and a
  fixed release supports the repository's Node.js baseline
- **THEN** the direct dependency and its lockfile closure are upgraded without
  changing production or plugin runtime dependencies

#### Scenario: Existing lock retains a vulnerable compatible resolution

- **WHEN** the direct upgrade still resolves a vulnerable transitive version
  even though a fixed version satisfies the upstream dependency range
- **THEN** the repository refreshes only that transitive lock resolution
  without adding it as a direct dependency or an override

### Requirement: Full audit verifies the remediated dependency tree

The repository MUST run the full npm audit after dependency installation and
MUST record zero known vulnerabilities before the remediation is accepted.

#### Scenario: Remediation verification succeeds

- **WHEN** dependencies are installed from the updated lockfile
- **THEN** `npm audit --json` reports zero info, low, moderate, high, critical,
  and total vulnerabilities

### Requirement: Existing repository validation remains compatible

The dependency remediation MUST preserve the existing Markdown lint contract
and MUST pass the repository's test, structural validation, version-sync,
Markdown lint, native plugin validation, and OpenSpec strict validation.

#### Scenario: Updated lint toolchain is validated

- **WHEN** the upgraded dependency tree is installed on Node.js `>=22.22.2`
- **THEN** `npm run validate`, `claude plugin validate .`, and strict OpenSpec
  validation all complete successfully without weakening lint rules or scope

#### Scenario: Node.js compatibility is evaluated

- **WHEN** the direct dependency and its locked transitives declare different
  Node.js 22 engine floors
- **THEN** the repository records the highest effective minimum and verifies
  both the local and CI-selected Node.js versions meet it

### Requirement: Effective Node.js compatibility is contributor-visible

The repository MUST declare the effective supported Node.js range
`^22.22.2 || ^24.15.0 || >=26.0.0` in root package metadata and MUST mirror that
exact range in contributor-facing README and CLAUDE validation guidance.

#### Scenario: Contributor installs dependencies

- **WHEN** a contributor prepares to run `npm ci` or repository validation
- **THEN** the root package metadata and setup documentation identify the exact
  supported Node.js range before installation

### Requirement: Dependency changes remain narrowly scoped

The committed package diff MUST contain only the direct lint dependency update
and the transitive lockfile changes required by that update. It MUST NOT alter
release-managed versions or unrelated dependencies.

#### Scenario: Package diff is reviewed

- **WHEN** the dependency update is ready to commit
- **THEN** reviewers can verify from `package.json` and `package-lock.json` that
  no unrelated package, lockfile root metadata, or release-managed version
  changed
