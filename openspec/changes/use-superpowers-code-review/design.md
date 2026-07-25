# Design: Portable bounded JT Flow reviews

## Context

The single-request workflow currently combines a portable Superpowers Skill
with an unavailable `/code-review` command. CodeRabbit already has App and CLI
fallback rules, but its limits are described per channel rather than as one
effective external review. Copilot has a quota exception but no explicit
one-review budget.

## Decisions

### Use Superpowers for local review

`superpowers:requesting-code-review` becomes the sole local review mechanism.
A changed-code batch is the code produced since the most recent local review.
Each completed batch may receive one review. Accepted findings that change code
create a new batch, so that updated code may receive one more review. Without
an intervening code change, the local review may not repeat.

`superpowers:receiving-code-review` remains the protocol for evaluating and
handling findings; it does not create another review.

### Share one effective CodeRabbit budget

The GitHub App remains preferred and the CLI remains fallback. Together they
may produce one effective review per PR or change. Repository auto-review is
disabled, and the workflow explicitly requests the App exactly once, preventing
later pushes from starting another review. If the App produces a real review,
the CLI is not called. If that sole App request reaches a terminal outcome
without a real review, the CLI may be called once. That first invocation
exhausts the fallback whether it returns a real review, an error, or an
interruption; it is never retried. After either channel produces a real review,
fixes and later pushes do not restart CodeRabbit. A real App review with
missing, stale, or unverifiable SHA metadata still consumes the budget; record
that coverage limitation and verify final `HEAD` locally instead of requesting
another App or CLI review.

### Limit Copilot to one review

Each PR or change may receive one Copilot review. Fixes and later pushes do not
request or wait for another. The existing quota-exhaustion exception remains.

### Verify final code without restarting external reviewers

Tests, behavioral acceptance, CI, mergeability, and resolved review threads
verify the final `HEAD`. External reviewers are not iterative test runners.

## Rejected Alternatives

- Keep `/code-review`: unavailable in the current cross-runtime Skill catalog.
- Run every reviewer after each fix: increases latency and external usage
  without replacing final verification.
- Remove external reviewers: exceeds the requested scope.
