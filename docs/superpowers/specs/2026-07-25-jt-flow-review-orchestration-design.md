# JT Flow Review Orchestration Design

## Goal

Make `jt-flow-one` portable across Claude Code and Codex by removing the
unavailable `/code-review` command and using
`superpowers:requesting-code-review` as the local code-review mechanism.
Prevent external review services from repeatedly reviewing every pushed fix.

## Review Policy

### Local Superpowers review

`superpowers:requesting-code-review` is the only mandatory local code-review
mechanism. Run it after the implementation is ready for review. When accepted
findings cause another batch of code changes, run it once more for that updated
code. Each completed batch of code changes permits at most one Superpowers
review; a review without intervening code changes must not be repeated.

All findings are handled with `superpowers:receiving-code-review`. That Skill is
a finding-evaluation protocol and does not count as another review.

### CodeRabbit review

CodeRabbit may produce at most one effective review for the entire PR or
change. Keep auto-review disabled and explicitly request the GitHub App once.
Only after that request reaches a successful, failed, or limited terminal
outcome without a real review may the CLI be used once as the fallback. As soon
as either channel produces a real review, the CodeRabbit review budget is
consumed: do not invoke, trigger, or wait for another CodeRabbit review after
fixes or later pushes.

The existing disclosure, consent, secret scanning, App scope, CLI scope, and
untrusted-feedback rules remain unchanged.

### GitHub Copilot review

GitHub Copilot may produce at most one review for the entire PR or change.
After that review arrives, do not request or wait for another Copilot review
after fixes or later pushes. If quota exhaustion prevents the single review,
record the external limit and continue under the existing exception.

## Review Sequence

1. Run one local Superpowers review for the current completed code batch.
2. Verify every finding before accepting or rejecting it.
3. If accepted findings change code, verify the fixes and run one new local
   Superpowers review for that new code batch.
4. Push and open the PR after the local review cycle has no unresolved accepted
   findings.
5. Obtain at most one CodeRabbit review and at most one Copilot review for the
   PR, applying their existing availability and fallback rules.
6. Verify and resolve external findings. Fixes do not restart either external
   reviewer.
7. Use tests, behavioral acceptance, CI, mergeability, and resolved review
   threads to verify the final `HEAD`.

## Owned Documentation

Update these living sources together:

- `plugins/jt-flow/skills/jt-flow-one/SKILL.md`
- `plugins/jt-flow/README.md`
- repository `CLAUDE.md`
- the relevant living OpenSpec specification
- repository validation tests that enforce the review budgets and prohibit
  `/code-review`

`jt-flow-all` remains a queue orchestrator and continues delegating review
ownership to `jt-flow-one`.

## Validation

- A repository test fails while `/code-review` remains in current JT Flow
  documentation.
- A repository test fails if the local Superpowers review no longer permits one
  review per changed code batch.
- A repository test fails if CodeRabbit or Copilot can be reviewed repeatedly
  within the same PR or change.
- `npm run validate` passes.
- `claude plugin validate .` passes.

## Non-goals

- Removing CodeRabbit or Copilot.
- Changing CodeRabbit authorization or payload-safety boundaries.
- Treating `superpowers:receiving-code-review` as an additional reviewer.
- Reintroducing retired command surfaces.
