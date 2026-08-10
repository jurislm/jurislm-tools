## Why

The current `jt-flow` contract makes a GitHub Issue and an OpenSpec change
co-equal prerequisites. That duplicates scope, design, task, and approval
context across two mutable records, adds issue search and synchronization work,
and makes queue eligibility depend on metadata that is not needed to deliver a
validated OpenSpec change. The intended flow is now `需求 → OpenSpec → GO →
實作 → PR`.

## What Changes

- Make an active OpenSpec change the sole required delivery and planning record.
- Treat GitHub Issues as optional external intake or discussion links, never as
  a creation, queue, GO, or archive prerequisite.
- Build `jt-flow-all` execution units from active OpenSpec changes and relation
  metadata; remove required Issue inventory and Issue mapping from handoff
  identity.
- Explicitly replace the Superpowers planning pipeline in `jt-flow-one` with
  OpenSpec artifacts while retaining the execution and verification skills.
- Remove obsolete jt-flow-specific `docs/superpowers/` planning documents and
  their stale archive references, while preserving unrelated plugin design
  records.

## Delivery Relations

- Priority: `mvp-critical`
- Hard dependencies: none
- Acceptance dependencies: none
- External blockers: `integration` — resolved on 2026-08-10 by archiving
  `convert-jt-flow-commands-to-skills` after its Skill catalog reload was
  verified and its delta was synchronized; its active Issue-queue wording no
  longer reintroduces a mandatory Issue queue.
- Affected areas: `plugins/jt-flow/**`, root `CLAUDE.md`, jt-flow policy tests,
  jt-flow OpenSpec deltas, and obsolete jt-flow planning records.
- Production targets: none

## Capabilities

### Modified Capabilities

- `jt-flow-authorization`
- `jt-flow-queue-delegation`
- `jt-flow-one-team-mode-dispatch`

## Non-goals

- Do not ban GitHub Issues when external intake, discussion, or stakeholder
  visibility benefits from one; an existing link may remain optional metadata.
- Do not change PR review, CI, merge, deployment, or production safety gates.
- Do not migrate or delete OpenSpec living specs or archived OpenSpec changes.
- Do not delete historical planning records for plugins other than `jt-flow`.

## Impact

This is a policy and documentation change across the `jt-flow` Skills, README,
repository guidance, living OpenSpec deltas, and policy tests. It has no runtime
application or dependency impact.
