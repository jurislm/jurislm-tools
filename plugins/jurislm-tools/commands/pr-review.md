---
name: pr-review
description: 使用 Monitor tool 即時監控 PR 的 CI 狀態與 Bot Code Review feedback，分析並修正後合併。
argument-hint: "[loop=5] [timeout=60] [repo=current] [pr=current]"
---

Apply the `pr-review` skill to monitor and resolve a pull request.

## Arguments

$ARGUMENTS

Parse the arguments as follows (all optional, use defaults if not provided):
- `loop`: maximum number of fix rounds — default: `5`
- `timeout`: maximum minutes to wait for CI via Monitor — default: `60`
- `repo`: target GitHub repo in `owner/repo` format — default: current working directory's repo (`gh repo view --json nameWithOwner`)
- `pr`: PR number (e.g. `#12` or `12`) — default: current branch's open PR (`gh pr view --json number`)
- `auto-merge`: explicit opt-in to allow merging when no human reviewer is present — default: `false`. Even with `true`, bot-only `COMMENTED` reviews **never** count as approval.

## Delegation

Follow the `pr-review` skill with the resolved parameters:
- Use the resolved `repo` and `pr` number for all `gh` commands
- Use `loop` as the maximum fix rounds limit
- Use `timeout` as the Monitor wait limit in minutes
- Pass `auto-merge` to the skill's "Definition of Done" decision logic

After the loop completes, classify the final state into one of: `READY_TO_MERGE`,
`AWAITING_HUMAN`, `NEEDS_USER_INTERVENTION`, or `ERROR`. **Only `READY_TO_MERGE`
permits auto-merge.** All other states require user action — report state and stop.
