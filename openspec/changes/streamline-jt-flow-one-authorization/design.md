# Design: One normal JT Flow checkpoint

## Context

The workflow has one explicit proposal GO but also contains conditional and
ambiguous authorization language throughout its lifecycle. Some conditions are
real safety boundaries; others leave ordinary end-to-end actions open to
repeated confirmation. The Skill needs a positive authorization contract that
distinguishes normal continuation from exceptional user-input requirements.

## Decisions

### Direct invocation authorizes preparation

An explicit `jt-flow-one` invocation authorizes repository-scoped discovery,
creation or update of the tracking issue, and creation or update of OpenSpec
artifacts. These actions prepare the proposal but do not authorize
implementation before proposal GO.

When search returns multiple candidates, the agent uses code, issue, proposal,
and request evidence to choose only if one candidate is unambiguously the
closest semantic match. Genuine unresolved ambiguity remains an exception and
requires user selection.

### Proposal GO authorizes the complete delivery chain

Proposal GO authorizes implementation, commits, push, PR creation, review
requests already disclosed by the Skill, and finding disposition only after
every accepted finding is fixed and verified or every rejected finding retains
a concrete recorded reason. It then authorizes merge, deployment verification,
issue closure, and archive. Normal progression does not ask again for merge or
archive authorization.

For an intent-routed run without CodeRabbit preauthorization, the proposal
summary contains the existing App and CLI disclosure. The same proposal GO
records both proposal approval and CodeRabbit consent. A resumed historical
proposal with no verifiable consent record treats external transmission consent
as a missing permission exception rather than silently inferring it.

### Use one bounded exception contract

After proposal GO, pause only for an observable exception:

- target repository, issue, proposal, or intended behavior remains genuinely
  ambiguous after evidence-based resolution;
- implementation requires a material scope expansion, architecture replacement,
  new external dependency, or new production risk outside the approved
  proposal;
- secret or sensitive payload is detected;
- required credentials, permissions, or a platform-enforced approval are
  missing;
- an irreversible or destructive production mutation was not described by the
  approved proposal;
- rollback or recovery has database, schema, data-loss, or unclear-target risk.

Ordinary implementation details, test fixes, reviewer finding fixes, push, PR,
merge, deployment observation, issue closure, and archive are not exceptions.

### Preserve external-review boundaries

The existing CodeRabbit consent, payload scanning, and one-effective-review
budget remain intact. Explicit Skill invocation still carries the documented
CodeRabbit authorization; intent-based routing still needs its existing
disclosure. This change removes redundant workflow confirmations, not external
data safeguards.

### Delegated queue items inherit the same lifecycle

`jt-flow-all` queue-order approval does not replace a missing per-item proposal
GO. Once an item receives proposal GO, its delegated `jt-flow-one` run proceeds
to a terminal result without normal-path pauses. Existing active proposals that
already received an explicit GO do not need a second GO solely because they are
delegated.

Proposal GO is persisted immediately in the change's
`verification-logs/proposal-go.md`, binding the change identifier, proposal
path, repository, issue, approved scope, approval evidence, and review-consent
state. Queue handoff passes both these fields and the evidence path to
`jt-flow-one`; matching is therefore durable across task contexts rather than
depending on conversational memory.

## Rejected Alternatives

- Remove every pause: unsafe when the target, scope, credentials, secrets, or
  destructive production action genuinely requires user judgment.
- Keep merge authorization project-dependent: preserves the ambiguity causing
  repeated interruption and contradicts end-to-end delivery.
- Treat queue-order approval as approval of every unreviewed proposal: combines
  prioritization and solution approval into one overly broad decision.

## Testing

A focused repository test will assert the positive authorization contract,
the single normal proposal gate, automatic post-GO continuation, and the
bounded exception categories, including reuse of an already recorded proposal
GO when an active proposal enters `jt-flow-all`, durable GO recording, and
complete queue handoff fields. It will also reject the old project-dependent
merge-authorization wording.
