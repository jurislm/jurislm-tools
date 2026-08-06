## MODIFIED Requirements

### Requirement: Local review is portable and change-batch scoped

The `jt-flow-one` Skill SHALL use `superpowers:requesting-code-review` as its
local code reviewer and MUST NOT depend on `/code-review`. Local review SHALL
run at most 3 times total for the entire PR or change: an initial run once the
implementation is ready for review, plus at most 2 further runs, each
triggered only by an accepted finding that changed code. After the 3rd run,
no further local review SHALL occur even if new findings appear; the workflow
MUST rely on tests, CI, and PR review instead. A review MUST NOT be repeated
when no code changed since the last run, regardless of how many of the 3 runs
remain.

#### Scenario: Accepted findings change code within the run limit

- **WHEN** a local review finding is accepted and its fix changes code, and
  fewer than 3 local reviews have run so far
- **THEN** the updated code may receive one more Superpowers review

#### Scenario: No code changed after review

- **WHEN** the current code has already received its local review and no code
  changed afterward
- **THEN** the workflow does not repeat the local review

#### Scenario: Run limit reached with new findings still present

- **WHEN** the local review has already run 3 times for the PR or change and a
  finding from the 3rd run is accepted and changes code
- **THEN** the workflow does not run a 4th local review and instead relies on
  tests, CI, and PR review to catch further issues

### Requirement: External reviewers have one effective review budget

CodeRabbit SHALL produce at most one effective review, across its GitHub App
and CLI channels combined, for a PR or change. Copilot SHALL produce at most
one review for a PR or change. Codex SHALL be treated as budgeted at one
review for a PR or change, contingent on the Codex account or organization
"審查觸發條件" (review trigger condition) setting being configured to review
only on PR open; this setting lives outside the repository and MUST be
confirmed as a manual precondition rather than verified by the workflow
itself. Fixes and later pushes MUST NOT restart CodeRabbit or Copilot. The
workflow SHALL NOT send an explicit trigger to Codex and SHALL NOT wait for a
Codex review; whatever Codex posts automatically is what the workflow
receives. CodeRabbit auto-review SHALL be disabled and the workflow SHALL
explicitly request the App at most once. Codex SHALL NOT be subject to the
CodeRabbit pre-authorization and disclosure contract, because the workflow
takes no action that causes Codex to read or receive repository data.

A real review is a CodeRabbit App or CLI result, a Copilot result, or a Codex
result that completes code analysis and submits review findings, including a
result with zero actionable findings. A trigger acknowledgement, pending or
in-progress state, skipped response, error, interruption, rate limit, quota
limit, or other unavailable response is not a real review. A terminal outcome
is either a submitted real review or an explicit final skipped, failed,
errored, interrupted, rate-limited, quota-limited, or unavailable response. A
trigger acknowledgement, pending state, or in-progress state is not terminal.

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

- **WHEN** CodeRabbit, Copilot, or Codex findings cause a later code push
- **THEN** the workflow verifies the fixes without requesting or waiting for
  another review from that external reviewer

#### Scenario: Codex trigger-condition precondition is confirmed

- **WHEN** the workflow is about to rely on Codex's one-review budget for a
  repository
- **THEN** it treats the account or organization "審查觸發條件" setting
  reading review-on-open as a confirmed manual precondition rather than a
  repository-verifiable fact

#### Scenario: Codex posts more than one review despite the precondition

- **WHEN** Codex posts a review beyond the expected single one for a PR or
  change
- **THEN** the workflow still evaluates the additional findings through
  `superpowers:receiving-code-review` rather than ignoring them, and does not
  treat the extra review as license to actively request or wait for Codex
