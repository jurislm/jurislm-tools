---
name: pr-review
description: 使用 Monitor tool 即時監控 PR 的 CI 狀態與 Claude Bot Code Review feedback，分析並修正；若 Claude review 結論為可合併則執行合併。
argument-hint: "[loop=5] [timeout=60] [repo=current] [pr=current]"
---

Apply the `pr-review` skill to monitor and resolve a pull request.

## ⚠️ MUST READ FIRST

**Before doing anything**, read the entire `pr-review` skill body (the `pr-review` skill loaded by this plugin).

**Do not pattern-match from this command file alone.** The command file is a thin
delegation shim. The skill body contains the workflow rules that govern CI monitoring,
review reading, fix rounds, and merge conditions.

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

After the loop completes, report the final state based on the skill's ending conditions:
- Claude review 說可合併且已執行合併 → 完成
- 五輪結束仍有問題 → 停止，通知使用者剩餘問題清單
- CI 失敗無法自行修正 → 停止，通知使用者具體原因
- CI 超時或環境故障 → 停止，通知使用者
