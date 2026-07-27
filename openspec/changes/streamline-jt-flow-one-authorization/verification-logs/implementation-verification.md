# Implementation verification

Date: 2026-07-27

## TDD evidence

The focused authorization policy test was added before the Skill changes.
Its baseline run contained five tests, all of which failed because the
published policy lacked:

- a positive explicit-invocation contract;
- proposal-GO authorization for the complete delivery chain;
- one bounded post-GO exception list;
- reuse of a recorded proposal GO in queue execution;
- synchronized one-checkpoint documentation.

After the minimal Skill and documentation changes, the same focused command
passed all five tests. Local review then identified the intent-routed
CodeRabbit consent interaction; a sixth regression test was added before that
fix and failed, then passed after consent was folded into proposal GO.

## Pressure-scenario evidence

Three read-only agent scenarios were run before and after the Skill change.

| Scenario | Baseline | Updated policy |
| --- | --- | --- |
| All merge gates pass after proposal GO | Asked again because merge authorization depended on unspecified project rules | Merges directly with no remaining ambiguity |
| Review finding fixed and all gates green | Push could continue, but merge could ask again; architecture or scope was undefined | Pushes and merges directly unless a bounded material exception is present |
| Previously approved proposal enters `jt-flow-all` | Asked for another per-item GO because no approval carry-forward was defined | Reuses the recorded GO for the same proposal |

## Validation evidence

- `node --test scripts/jt-flow-authorization-policy.test.mjs`: 6 tests passed,
  0 failed.
- `npm run validate`: 48 tests passed, plugin repository validation passed,
  version synchronization reported `1.32.5`, and Markdown lint passed.
- `claude plugin validate .`: marketplace validation passed.
- `openspec validate streamline-jt-flow-one-authorization --strict`: change is
  valid.
- `git diff --check`: exited successfully.

## Scope checks

- CodeRabbit disclosure, secret-scanning, App-to-CLI fallback, and review
  budgets remain unchanged.
- No release-managed version was edited.
- `jt-flow-all` still contains queue coordination only; it references the
  `jt-flow-one` lifecycle instead of duplicating it.
- The old project-dependent merge-authorization sentence was removed.

## Local review disposition

- Important finding accepted: intent-routed CodeRabbit consent could otherwise
  conflict with the bounded post-GO exception list. The existing disclosure was
  moved into the proposal summary so the same GO records both approvals; an
  old proposal without verifiable consent remains a missing-permission
  exception.
- Minor finding accepted: the focused test now positively checks the merge-gate
  paragraph and rejects broader project-policy or repeat-approval wording,
  instead of excluding only the original sentence verbatim.

## CodeRabbit CLI review disposition

The sole App request reached a rate-limit terminal outcome, so one authenticated
CLI fallback reviewed the complete committed change and returned 12 findings.
The fallback is exhausted and will not be rerun.

Accepted and fixed:

- Parse and enforce exactly six top-level bounded-exception bullets.
- Scope merge reauthorization checks to normalized policy text.
- Require the queue policy itself to reuse GO only when change identifier,
  proposal path, repository, and approved scope match the current item.
- Add public-document contradiction checks for merge and consent.
- Add the missing new-external-dependency condition to the delta spec.
- State queue reuse explicitly in the design's testing section.
- Require accepted findings to be fixed and verified and rejected findings to
  retain concrete reasons before merge.
- Replace vague review-disposition wording in the implementation plan.
- Clarify that the initial five tests passed before the sixth consent test was
  added during local review.
- Make explicit `jt-flow-all` invocation one consent state and remove wording
  that could imply a second consent gate.

Rejected with reason:

- Do not add worktree creation to the plan's final GitHub Flow step. The plan
  was written inside an already-created and verified feature worktree; creating
  a worktree after implementation would reverse the required lifecycle.
