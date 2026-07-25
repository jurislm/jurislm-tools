# Change: Use portable bounded reviews in JT Flow

Closes #156

## Why

`jt-flow-one` requires `/code-review`, but that command is not an available
Skill in the shared Claude Code and Codex runtime contract. The workflow also
needs explicit review budgets so external services do not review every fix and
push repeatedly.

## What Changes

- Replace `/code-review` with `superpowers:requesting-code-review` as the local
  code-review mechanism.
- Allow one local Superpowers review for each completed batch of code changes.
- Limit CodeRabbit to one effective review across its App and CLI channels for
  each PR or change.
- Limit Copilot to one review for each PR or change.
- Preserve CodeRabbit disclosure, consent, secret scanning, and fallback
  boundaries.
- Protect the workflow contract with repository tests.

## Impact

Affected plugin: `jt-flow`, specifically the `jt-flow-one` Skill, its README,
repository guidance, and review-policy validation. No release-managed version,
plugin identity, or queue ownership changes.

## Non-goals

- Remove CodeRabbit or Copilot.
- Count `superpowers:receiving-code-review` as another reviewer.
- Reintroduce any retired command entry point.
