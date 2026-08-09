## Context

OpenSpec already contains the versioned proposal, design, requirements, tasks,
verification evidence, and dependency metadata used to decide whether a change
is ready. The current workflow separately searches, edits, labels, assigns, and
closes a GitHub Issue, then requires that Issue identity in proposal GO and
queue handoff records. This makes the workflow shallow at its external
interface: callers must understand two records that overlap in purpose.

## Decision

Make the OpenSpec change the deep module and canonical interface:

`需求 → OpenSpec change → proposal GO → implementation → PR → archive`

GitHub Issue becomes an optional adapter for external intake or discussion. If
a request starts from an Issue, the proposal may link it, but the workflow does
not create, search, update, close, or require one. A missing Issue must never
block a valid change.

The OpenSpec artifacts are the only planning pipeline for `jt-flow-one`; it
does not invoke the Superpowers planning pipeline that would create a parallel
`docs/superpowers/` record. TDD, debugging, review, and completion verification
remain scoped execution controls rather than planning records.

Queue identity is the exact change identifier, proposal path, target
repository, approved scope, durable proposal GO evidence, and dependency
snapshot. Optional external links are descriptive metadata, not eligibility
fields. The queue therefore inventories active OpenSpec changes and their
Delivery Relations; unrelated open Issues are outside the execution graph.

The delegated team-mode contract uses the same OpenSpec-only identity. Review,
CI, merge, deployment, and archive gates remain unchanged; only Issue coupling
is removed.

## Migration

Update the two Skills, plugin README, repository guidance, living OpenSpec
delta specs, and policy tests together. At sync or archive, apply the exact
team-mode requirement delta and manually update the team-mode living-spec
Purpose from Step 5 to Phase 4: Purpose text is outside the requirement-delta
syntax. Before moving the change to archive, verify that
`rg -n 'Step 5 code-review dispatch' openspec/specs/jt-flow-one-team-mode-dispatch/spec.md`
has no output, then rerun the focused authorization-policy test and strict
OpenSpec validation. Delete only obsolete jt-flow
`docs/superpowers/` planning files, retain unrelated plugin design records,
and remove stale references from archived OpenSpec prose.

## Risks and mitigations

- External stakeholders may still need Issues: preserve optional links and PR
  references when supplied.
- Existing queue tests may encode Issue coupling: update them to assert
  OpenSpec-derived identity and explicit absence of Issue prerequisites.
- The active conversion change still has Issue-queue wording: its declared
  integration blocker must be reconciled before this change is integrated.
- OpenSpec delta validation must pass before the change is integrated.
