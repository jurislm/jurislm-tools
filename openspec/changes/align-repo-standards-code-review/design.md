## Context

`repo-standards` has stale review wording that conflicts with the current
`CLAUDE.md` and `jt-flow` contract. It also leaves GitHub Issues as a tracking
path even though this repository records a change only in Spectra artifacts.

## Goals / Non-Goals

**Goals:**

- Teach one review contract and one change-tracking record.
- Keep operational review detail in its canonical `CLAUDE.md` and `jt-flow`
  sources while retaining repository setup prerequisites in `repo-standards`.

**Non-Goals:**

- Change global review orchestration, CI, release, deployment, or external
  review service settings.

## Decisions

### Spectra-only tracking

The active Spectra change supplies the durable proposal, design, specification,
and task record. Repository guidance will direct follow-up adoption targets to
the change's Delivery Relations rather than creating a GitHub Issue.

### Canonical PR review contract

`repo-standards` will point to the existing `CLAUDE.md` and
`jt-flow-review-orchestration` contract instead of maintaining a competing
manual-review procedure. It will retain only the setup conditions that a
repository must configure for that contract.

## Risks / Trade-offs

- [Stale duplicated wording] → Search every repo-standards entry point and
  retain one canonical operational pointer.
- [Follow-up work becomes invisible] → Require active Spectra Delivery
  Relations to name affected adoption targets and their acceptance.

## Migration Plan

Close the mistakenly created Issue, remove its reference from the active
proposal, update the local rule and plugin guidance, then validate the
Spectra change and documentation checks.

## Open Questions

None.
