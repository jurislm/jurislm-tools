## Why

Closes #187. `jt-flow-one`'s review budgets are inconsistent: the local
`superpowers:requesting-code-review` mechanism has no total ceiling — any
accepted finding that changes code starts a new batch eligible for another
review, so it can run indefinitely — while CodeRabbit and Copilot are already
capped at one effective review per PR/change. Codex (`chatgpt-codex-connector`,
already installed org-wide) is not integrated into `jt-flow-one` at all despite
already reviewing PRs automatically in this repository.

## What Changes

- Cap local Superpowers review at 3 total runs per PR/change (1st run + up to
  2 reruns triggered by accepted-finding code changes); no 4th run even if new
  findings appear, relying on tests/CI/PR review instead. A review still never
  repeats when no code changed since the last one.
- Add Codex as a third external reviewer, capped at one review per PR/change,
  contingent on the account-level "審查觸發條件" setting reading 開啟 PR (a
  manual, one-time environment precondition, not a repo-committed file).
  Codex gets no active trigger action and no CodeRabbit-style
  pre-authorization/disclosure gate, since `jt-flow-one` never causes it to
  read repository data. Any review it posts — expected or an unexpected extra
  one — is still evaluated via the existing `receiving-code-review` rule.
- CodeRabbit's and Copilot's existing one-review-per-PR rules, triggers, and
  authorization text are unchanged.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `jt-flow-review-orchestration`: replaces the unbounded local-review batch
  requirement with a 3-run ceiling, and extends the external-reviewer budget
  requirement to include Codex under the constraints above.

## Non-goals

- Changing CodeRabbit's or Copilot's existing trigger or authorization rules.
- Integrating `openai/codex-action` (the separate self-hosted GitHub Actions
  variant of Codex review).
- Building a repository-committed mechanism to verify or force the Codex
  "審查觸發條件" account setting — documented as a manual precondition.

## Impact

Affected plugin: `jt-flow`, specifically `jt-flow-one`'s `SKILL.md`, its
`README.md`, repository `CLAUDE.md` guidance, the `jt-flow-review-orchestration`
living spec, and `scripts/jt-flow-review-policy.test.mjs`. No release-managed
version, plugin identity, or `jt-flow-all` queue-contract changes.
