## ADDED Requirements

### Requirement: Ordered queue delivery delegates to the single-request Skill
After the user confirms a ranked issue queue, the `jt-flow-all` Skill SHALL directly invoke `jt-flow-one` once for each ranked issue, passing the issue identifier, target repository, and queue-order context. A delegated run SHALL return `success`, `paused`, `blocked`, `failed`, or `cancelled`; only `success` SHALL permit invocation of the next item.

#### Scenario: Confirmed queue advances in order

- **WHEN** the user confirms a ranked queue containing multiple issues
- **THEN** `jt-flow-all` directly invokes `jt-flow-one` for the first item and advances only after that run reaches a terminal result

### Requirement: Single-request delivery workflow has one owner
The `jt-flow-all` Skill MUST NOT duplicate the single-request issue confirmation, proposal, worktree, implementation, review, merge, deployment, archive, or proposal-synchronization procedures. `jt-flow-one` SHALL remain the owner of those procedures for every delegated item.

#### Scenario: Queue Skill is inspected

- **WHEN** `jt-flow-all` is inspected after the queue-order confirmation
- **THEN** it contains delegation and ordered-progress rules rather than a duplicate end-to-end delivery procedure

### Requirement: Per-item gates remain effective
Queue-order confirmation SHALL NOT bypass any proposal or approval gate owned by the delegated `jt-flow-one` run. A delegated run that pauses for user input SHALL pause the queue at that item.

#### Scenario: Delegated item requires approval

- **WHEN** a delegated `jt-flow-one` run reaches its proposal approval gate
- **THEN** `jt-flow-all` waits at that item until the required approval is provided

### Requirement: Queue delegation preserves CodeRabbit consent
`jt-flow-all` SHALL pass `codeRabbitAuthorization=preauthorized` with `authorizationSource=explicit-jt-flow-all` only when the user explicitly invokes `jt-flow-all` and accepts its CodeRabbit disclosure. For all other queue invocations, it SHALL pass `codeRabbitAuthorization=requires-disclosure`, and the delegated `jt-flow-one` run SHALL apply its own disclosure and consent gate.

#### Scenario: Queue is invoked by general intent

- **WHEN** `jt-flow-all` is selected by general intent rather than an explicit user invocation
- **THEN** the delegated `jt-flow-one` item requires its normal CodeRabbit disclosure before external review
