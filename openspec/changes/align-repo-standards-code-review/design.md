## Context

`repo-standards` has stale review wording that conflicts with the current
`CLAUDE.md` and `jt-flow` contract. It also leaves GitHub Issues as a tracking
path even though this repository records a change only in Spectra artifacts.

## Goals / Non-Goals

**Goals:**

- Teach one portable review contract and one change-tracking record.
- Keep the installed target repository's `CLAUDE.md` as the operational review
  contract while retaining the reusable template and setup prerequisites in
  `repo-standards`.

**Non-Goals:**

- Change global review orchestration, CI, release, deployment, or external
  review service settings.

## Decisions

### Spectra-only tracking and bootstrap

The active Spectra change supplies the durable proposal, design, specification,
and task record. Before this record is required, `repo-standards` checks for
Spectra and initializes a target that lacks `openspec/` or `.spectra.yaml`.
Repository guidance and `jt-flow` direct follow-up adoption targets to the
change's Delivery Relations rather than creating or linking a GitHub Issue.

### Portable PR review contract

`repo-standards` will package a concise review-orchestration template. When a
target lacks that section, the skill writes it into the target's `CLAUDE.md`
and customizes the target-specific checks and delivery details. The target
`CLAUDE.md`, not an unreachable source-repository spec, is the canonical
contract for that target.

### Remove GitHub Issue workflow surfaces

`jt-flow-one`, `jt-flow-all`, their README, the root README, authorization
policy test, and living-spec deltas remove the optional Issue paths together.
This leaves Spectra artifacts and Delivery Relations as the sole current
planning, queue, and delivery record.

The queue delta retains the pre-existing hard, acceptance-only, and mixed
dependency-cycle scenarios. Removing Issue mapping changes only the tracking
source, not the `BLOCKED` outcome for a cyclic dependency graph.

## Risks / Trade-offs

- [Stale duplicated wording] → Package one concise template, make the target
  `CLAUDE.md` canonical, and search every entry point for source-only pointers.
- [Uninitialized target] → Require `spectra init` before a new target needs an
  active change.
- [Follow-up work becomes invisible] → Require active Spectra Delivery
  Relations to name affected adoption targets and their acceptance.

## Migration Plan

Remove current Issue workflow references, update the target-portable review
contract and bootstrap guidance, then validate the Spectra change and
documentation checks.

## Open Questions

None.
