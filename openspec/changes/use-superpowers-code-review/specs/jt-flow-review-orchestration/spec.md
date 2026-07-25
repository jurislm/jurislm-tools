# JT Flow Review Orchestration

## ADDED Requirements

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
external reviewer.

#### Scenario: CodeRabbit App produces a review

- **WHEN** the CodeRabbit GitHub App produces a real review
- **THEN** the workflow does not invoke the CodeRabbit CLI or request another
  CodeRabbit review

#### Scenario: CodeRabbit App cannot produce a review

- **WHEN** the CodeRabbit GitHub App cannot produce a real review
- **THEN** the workflow may invoke the CodeRabbit CLI once as fallback

#### Scenario: External findings are fixed

- **WHEN** CodeRabbit or Copilot findings cause a later code push
- **THEN** the workflow verifies the fixes without requesting or waiting for
  another review from that external reviewer
