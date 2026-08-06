# JT Flow Review Orchestration

## Purpose

Define portable, bounded local and external code-review orchestration for
`jt-flow-one`.

## Requirements

### Requirement: Local review is portable and change-batch scoped

The `jt-flow-one` Skill SHALL use `superpowers:requesting-code-review` as its
local code reviewer and MUST NOT depend on `/code-review`. A completed batch of
code changes SHALL permit at most one local review. Accepted findings that
change code create a new batch that MAY receive one new local review.

#### Scenario: Accepted findings change code

- **WHEN** a local review finding is accepted and its fix changes code
- **THEN** the updated code is a new batch that may receive one Superpowers
  review

#### Scenario: No code changed after review

- **WHEN** the current code has already received its local review and no code
  changed afterward
- **THEN** the workflow does not repeat the local review

### Requirement: Review findings are independently evaluated

The workflow SHALL apply `superpowers:receiving-code-review` to findings before
implementation and SHALL NOT count that finding-handling protocol as another
review.

#### Scenario: A reviewer returns a suggestion

- **WHEN** any local or external reviewer returns a finding
- **THEN** the workflow verifies the finding against the codebase before
  accepting or rejecting it

### Requirement: External reviewers have one effective review budget

CodeRabbit SHALL produce at most one effective review, across its GitHub App
and CLI channels combined, for a PR or change. Copilot SHALL produce at most
one review for a PR or change. Fixes and later pushes MUST NOT restart either
external reviewer. CodeRabbit auto-review SHALL be disabled and the workflow
SHALL explicitly request the App at most once.

A real review is a CodeRabbit App or CLI result that completes code analysis
and submits review findings, including a result with zero actionable findings.
A trigger
acknowledgement, pending or in-progress state, skipped response, error,
interruption, rate limit, quota limit, or other unavailable response is not a
real review. A terminal outcome is either a submitted real review or an
explicit final skipped, failed, errored, interrupted, rate-limited,
quota-limited, or unavailable response. A trigger acknowledgement, pending
state, or in-progress state is not terminal.

#### Scenario: CodeRabbit App review is requested

- **WHEN** the PR is ready for external review
- **THEN** auto-review is disabled and the workflow requests the App once
- **AND** later pushes do not automatically or explicitly request another review

#### Scenario: CodeRabbit App produces a review

- **WHEN** the CodeRabbit GitHub App produces a real review
- **THEN** the workflow does not invoke the CodeRabbit CLI or request another
  CodeRabbit review

#### Scenario: CodeRabbit App cannot produce a review

- **WHEN** the sole CodeRabbit GitHub App request reaches a terminal outcome
  without producing a real review
- **THEN** the workflow may invoke the CodeRabbit CLI once as fallback

#### Scenario: CLI fallback returns no review

- **WHEN** the CodeRabbit CLI is invoked and returns no real review because of
  an error, interruption, rate limit, or any other outcome
- **THEN** that invocation exhausts the fallback and the workflow does not
  invoke the CLI again

#### Scenario: App review SHA cannot be verified

- **WHEN** the CodeRabbit GitHub App produces a real review whose SHA metadata
  is missing, stale, or cannot be verified against current `HEAD`
- **THEN** the review consumes the CodeRabbit budget, the workflow records the
  coverage limitation, and neither the App nor CLI is invoked again

#### Scenario: External findings are fixed

- **WHEN** CodeRabbit or Copilot findings cause a later code push
- **THEN** the workflow verifies the fixes without requesting or waiting for
  another review from that external reviewer
