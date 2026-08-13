## ADDED Requirements

### Requirement: Repo standards distinguish verified references from adoption targets

`repo-standards` SHALL identify `jurislm/entire` as the verified reference implementation for release delivery and monorepo CI/CD invariants. It MUST derive portable rules from current source facts, prevented failures, target-repo rules, and observable acceptance; it MUST NOT declare another repository compliant before that repository has completed its own required acceptance.

Every Release Please template, including npm／MCP templates, SHALL require a trusted main-delivery `release-pr-auto-merge` validator. The validator contract MUST bind the candidate to the same delivery commit, validate the repository-specific closed artifact contract and SHA relationship, validate required-check clean state and GitHub latest-base protection for the automation credential without a human release-PR approval gate, then use GitHub's PR merge API with the validated head SHA. It MUST prohibit direct ref updates and manual merge fallback, describe no-candidate, newer-candidate-base, a waiting candidate superseded by a changed main tip, and GitHub rejection of a stale candidate as successful no-op outcomes; every other discrepancy MUST fail closed. Each target MUST record and enforce a merge mode compatible with its delivery-subject guard; for Conventional Commit Release Please repositories the safe default is squash-only with the PR title as the squash commit title. A template command that writes GitHub through Release Please MUST name an exact version selected by the target repository.

#### Scenario: A repository adopts the delivery standard

- **WHEN** a repository is configured from the delivery standard
- **THEN** its design records source fact, prevented failure, local rule, and observable acceptance
- **AND** it remains an adoption target until those acceptance checks succeed
- **AND** it does not claim that copying `entire` topology alone establishes compliance

#### Scenario: A Release Please candidate is invalid

- **WHEN** a candidate has a wrong artifact set, contents, source, base SHA relationship, head SHA, mergeability state, or API response
- **THEN** the documented validator contract rejects it
- **AND** no manual merge path is documented as a recovery mechanism

#### Scenario: A newer delivery supersedes older automation

- **WHEN** an older validator observes no candidate, a candidate based on a descendant delivery, or a rejected protected PR merge followed by proof that main differs from its triggering delivery
- **THEN** the documented validator contract exits successfully as a no-op
- **AND** the newer delivery remains the only delivery authorized to merge its candidate

#### Scenario: A template invokes Release Please

- **WHEN** a maintainer copies a Release Please command from a standard template
- **THEN** the command contains an explicit exact-version placeholder
- **AND** the target repository replaces it with one exact executable version before enabling the pipeline

#### Scenario: An npm or MCP repository adopts a release template

- **WHEN** an npm package or MCP server enables Release Please
- **THEN** it skips only deploy-specific gating
- **AND** it still configures the trusted release PR auto-merge validator and its observable acceptance

#### Scenario: A target selects its delivery merge mode

- **WHEN** a repository enables a Conventional Commit release eligibility guard
- **THEN** it records and readbacks a merge mode that preserves one validated mainline delivery title
- **AND** it uses squash-only with the pull-request title as the squash title unless it documents and tests an equivalent target-specific representation

### Requirement: Monorepo standards require Turborepo and safe scoped execution

Every JurisLM monorepo SHALL use Turborepo with a root `turbo.json` and Turbo-owned cross-workspace scripts. Standards SHALL define `--filter` as an explicit workspace selection and `--affected` as a change-derived selection that requires a trustworthy Git base and head.

A standard using `--affected` MUST require full validation or full deployment when its Git range or affected query cannot be established. Turbo task inputs SHALL cover every source, configuration, and test file read by the underlying command so cached success cannot hide a relevant change.

#### Scenario: A repository selects explicit workspaces

- **WHEN** a CI gate has a known fixed workspace boundary
- **THEN** the standard uses Turbo `--filter` to name that boundary
- **AND** the gate runs the task for the selected workspaces

#### Scenario: A repository selects affected workspaces

- **WHEN** a CI gate has a verified Git base and head and uses change-derived routing
- **THEN** the standard permits Turbo `--affected`
- **AND** the gate records the source of its Git range

#### Scenario: Affected routing cannot be trusted

- **WHEN** the Git range is unavailable or the affected query errors
- **THEN** the standard requires full validation or full deployment
- **AND** it does not report an unaffected success

#### Scenario: A cached lint task reads test files

- **WHEN** a lint command reads files under a test directory
- **THEN** the Turbo lint task inputs include that test directory
- **AND** a test-file change invalidates the cached lint result
