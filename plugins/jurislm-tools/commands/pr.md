---
name: pr
description: 自動輪詢 PR 的 CI 狀態與 Bot Code Review feedback，分析並修正後合併。
argument-hint: "[interval=3m] [loop=5] [repo=current] [pr=current]"
---

Apply the `pr-review-loop` skill to monitor and resolve a pull request.

## Arguments

$ARGUMENTS

Parse the arguments as follows (all optional, use defaults if not provided):
- `interval`: interval between each round (e.g. `3m`, `5m`) — default: `3m`
- `loop`: maximum number of rounds — default: `5`
- `repo`: target GitHub repo in `owner/repo` format — default: current working directory's repo (`gh repo view --json nameWithOwner`)
- `pr`: PR number (e.g. `#12` or `12`) — default: current branch's open PR (`gh pr view --json number`)

## Delegation

Follow the `pr-review-loop` skill with the resolved parameters:
- Use the resolved `repo` and `pr` number for all `gh` commands
- Use `loop` as the maximum rounds limit
- Use `interval` as the wait duration between rounds
