## 1. Define and protect the review contract

- [x] 1.1 Add proposal, design, and delta-spec artifacts for portable bounded
  JT Flow reviews.
- [x] 1.2 Add a focused repository test that rejects `/code-review` and
  requires the local and external review budgets.

## 2. Update the published workflow

- [x] 2.1 Replace `/code-review` with change-batch-scoped
  `superpowers:requesting-code-review` in `jt-flow-one`.
- [x] 2.2 Limit CodeRabbit App and CLI to one combined effective review and
  Copilot to one review per PR or change.
- [x] 2.3 Synchronize the JT Flow README and repository guidance.
- [x] 2.4 Make the first CodeRabbit CLI invocation exhaust the fallback for
  every outcome, including errors and interruptions.

## 3. Verify

- [x] 3.1 Pass the focused policy test and `npm run validate`.
- [x] 3.2 Pass `claude plugin validate .` and strict OpenSpec validation.
- [x] 3.3 Record implementation verification evidence.
