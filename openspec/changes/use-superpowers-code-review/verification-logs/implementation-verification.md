# Implementation Verification

Date: 2026-07-25（台灣時間）

## TDD evidence

- `node --test scripts/jt-flow-review-policy.test.mjs` failed 3／3 before the
  workflow documents changed. Failures identified the existing
  `/code-review` dependency and missing local／external review budgets.
- The same focused command passed 3／3 after the minimal workflow update.

## Final verification

| Command | Result |
|---|---|
| `npm run validate` | PASS：36 tests, plugin repository validation, version synchronization at `1.32.3`, and Markdown lint |
| `claude plugin validate .` | PASS：marketplace manifest validation |
| `openspec validate use-superpowers-code-review --strict` | PASS：change is valid |
| ``rg -n '`/code-review`' CLAUDE.md plugins/jt-flow`` | PASS：no current JT Flow references |

## Contract evidence

- `jt-flow-one` uses `superpowers:requesting-code-review` once per completed
  code-change batch and permits another local review only after code changes.
- `superpowers:receiving-code-review` evaluates findings and is not counted as
  another reviewer.
- CodeRabbit App and CLI share one effective review budget per PR or change.
- Copilot has one review budget per PR or change.
- External finding fixes and later pushes use tests, acceptance, CI,
  mergeability, and resolved threads instead of restarting external review.
