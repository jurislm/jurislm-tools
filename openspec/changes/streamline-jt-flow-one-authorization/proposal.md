# Change: Streamline JT Flow authorization

Closes #170

## Why

`jt-flow-one` promises end-to-end delivery but leaves several normal delivery
actions without a single explicit authorization contract. Agents can therefore
pause again for push, PR, merge, deployment verification, or archive after the
user already approved the proposal, making the workflow unnecessarily
interruptive.

## What Changes

- Make proposal approval the sole normal-path user checkpoint.
- Define proposal GO as authorization to continue through implementation,
  push, PR, review disposition, merge, deployment verification, and archive.
- Replace broad or ambiguous pause language with a bounded exception contract.
- Pause only when evidence cannot resolve the target, the approved architecture
  or scope materially changes, or a secret, permission, platform approval,
  destructive production action, or rollback risk requires user input.
- Apply the same contract to `jt-flow-all` delegated items.
- Add repository tests that protect the authorization contract.

## Impact

Affected plugin: `jt-flow`, specifically `jt-flow-one`, `jt-flow-all`, their
documentation, workflow specifications, and validation tests. CodeRabbit
disclosure, secret scanning, and review-budget rules remain unchanged.

## Non-goals

- Remove the proposal approval gate.
- Pre-authorize repository creation, branch-model migration, secret handling,
  production rollback, or another materially expanded scope.
- Weaken CI, code review, mergeability, deployment, or archive verification.
