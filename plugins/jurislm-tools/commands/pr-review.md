---
name: pr-review
description: 使用 Monitor tool 即時監控 PR 的 CI 狀態與 Bot Code Review feedback，分析並修正；**永遠不會在缺少人類 APPROVED 的情況下自動合併**。
argument-hint: "[loop=5] [timeout=60] [repo=current] [pr=current]"
---

Apply the `pr-review` skill to monitor and resolve a pull request.

## ⚠️ MUST READ FIRST

**Before doing anything**, read the entire `pr-review` skill body (the `pr-review` skill loaded by this plugin).

**Do not pattern-match from this command file alone.** The command file is a thin
delegation shim. The skill body contains critical safety rules that govern when
loop completion is allowed and when auto-merge is forbidden. Skipping the SKILL.md
has historically led to:
- Premature "review-loop complete" reports without human approval
- Treating bot `COMMENTED` reviews as approval
- Auto-merging PRs that only have bot reviews

If you cannot locate or read the SKILL.md, **stop and tell the user** instead of
guessing the workflow.

## Arguments

$ARGUMENTS

Parse the arguments as follows (all optional, use defaults if not provided):
- `loop`: maximum number of fix rounds — default: `5`
- `timeout`: maximum minutes to wait for CI via Monitor — default: `60`
- `repo`: target GitHub repo in `owner/repo` format — default: current working directory's repo (`gh repo view --json nameWithOwner`)
- `pr`: PR number (e.g. `#12` or `12`) — default: current branch's open PR (`gh pr view --json number`)
## Delegation

Follow the `pr-review` skill with the resolved parameters:
- Use the resolved `repo` and `pr` number for all `gh` commands
- Use `loop` as the maximum fix rounds limit
- Use `timeout` as the Monitor wait limit in minutes

After the loop completes, classify the final state into one of: `READY_TO_MERGE`,
`AWAITING_HUMAN`, `NEEDS_USER_INTERVENTION`, or `ERROR`. **Only `READY_TO_MERGE`
permits merging.** All other states require user action — report state and stop.
