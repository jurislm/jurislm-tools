## ADDED Requirements

### Requirement: Repo standards distinguish verified references from adoption targets

`repo-standards` SHALL identify `jurislm/entire` as the verified reference implementation for release delivery and monorepo CI/CD invariants. It MUST derive portable rules from current source facts, prevented failures, target-repo rules, and observable acceptance; it MUST NOT declare another repository compliant before that repository has completed its own required acceptance.

Every Release Please template SHALL require a trusted main-delivery `release-pr-auto-merge` validator. The validator contract MUST bind the candidate to the same delivery commit, validate the repository-specific closed artifact contract and SHA relationship, use a merge request with the validated head SHA, and prohibit manual merge fallback. It MUST describe no-candidate, newer-candidate-base, and a final main-tip change as successful no-op outcomes; every other discrepancy MUST fail closed. A template command that writes GitHub through Release Please MUST name an exact version selected by the target repository.

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

- **WHEN** an older validator observes no candidate, a candidate based on a descendant delivery, or a final main tip that differs from its triggering delivery
- **THEN** the documented validator contract exits successfully as a no-op
- **AND** the newer delivery remains the only delivery authorized to merge its candidate

#### Scenario: A template invokes Release Please

- **WHEN** a maintainer copies a Release Please command from a standard template
- **THEN** the command contains an explicit exact-version placeholder
- **AND** the target repository replaces it with one exact executable version before enabling the pipeline

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
