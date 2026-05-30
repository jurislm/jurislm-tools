---
name: entire
version: 1.0.0
description: >
  This skill should be used when the user asks about Entire checkpoints, sessions, AI agent history,
  "list checkpoints", "explain checkpoint", "rewind checkpoint", "session recap",
  "entire doctor", "resume branch session", "attach session",
  "search checkpoint", "find past session", "search past work",
  "列出 checkpoint", "查看 checkpoint", "回退 checkpoint", "搜尋 checkpoint",
  "找過去的 session", "session 摘要", "診斷 entire", or anything related to Entire CLI session management.
argument-hint: "[action] [checkpoint-id/branch/session-id]"
---

# Entire CLI MCP 使用指南

透過 `@jurislm/entire-mcp` MCP 工具管理 Entire AI agent checkpoints 和 sessions。

## MCP 工具概覽（11 個工具）

### Checkpoint（4 個工具）

| 工具 | 說明 | 必要參數 |
|------|------|----------|
| `entire_checkpoint_list` | 列出所有 checkpoints（可靠，本地讀取）| — |
| `entire_checkpoint_explain` | 查看特定 checkpoint 完整 transcript + 摘要 | `checkpoint_id` |
| `entire_checkpoint_rewind_list` | 列出可用 rewind points | — |
| `entire_checkpoint_rewind` | ⚠️ 回退到指定 checkpoint commit（destructive）| `commit` |

### Session（2 個工具）

| 工具 | 說明 | 必要參數 |
|------|------|----------|
| `entire_session_list` | 列出所有 sessions（可靠，本地讀取）| — |
| `entire_session_info` | 查看特定 session 詳情 | `session_id` |

### Misc（5 個工具）

| 工具 | 說明 | 必要參數 |
|------|------|----------|
| `entire_recap` | 生成當前 session 工作摘要 | — |
| `entire_doctor` | 診斷 Entire 安裝和 repo 設定 | — |
| `entire_resume` | 切換到 branch 並恢復 session metadata | `branch` |
| `entire_attach` | 將未追蹤的 session 加入 checkpoint 系統 | `session_id` |
| `entire_labs_review` | ⚠️ 實驗性 code review（preview，不穩定）| — |

## 常見工作流程

### 查詢最近的 checkpoint 歷史
```
entire_checkpoint_list
→ 找到 checkpoint ID
entire_checkpoint_explain checkpoint_id="a3b2c4d5e6f7"
```

### 診斷問題
```
entire_doctor
```

### 查看 session 清單
```
entire_session_list
→ 找到 session ID（格式：YYYY-MM-DD-uuid）
entire_session_info session_id="2026-01-13-abc123..."
```

### 切換到另一個 branch 繼續工作
```
entire_resume branch="feature/auth"
→ 切換並恢復該 branch 的 session metadata
```

### 生成當前 session 摘要
```
entire_recap
→ 輸出本次 session 的工作摘要（適合 handoff 或記錄）
```

## 決策判斷：該用哪個工具？

### `entire_checkpoint_explain` vs `entire_session_info`

| 問題 | 用哪個 |
|------|--------|
| 「這個 checkpoint 做了什麼？」「給我看 transcript」 | `entire_checkpoint_explain` |
| 「這個 session 整體在幹嘛？」「列出所有工具使用」 | `entire_session_info` |
| 找某個決策或操作的時間點 | 先 `checkpoint_list` 看時間序，再 `checkpoint_explain` 看細節 |
| 找跨多個 session 的歷史 | `session_list` 過濾日期，再 `session_info` 看摘要 |

**規則**：checkpoint 是時間點快照，session 是整個工作週期。想知道「某個時刻發生了什麼」→ checkpoint；想知道「某段工作期間的全貌」→ session。

### `entire_checkpoint_rewind` 的使用時機

`entire_checkpoint_rewind` 會重寫 git history，使用前必須確認：

1. **確認 rewind 目標**：先 `entire_checkpoint_rewind_list` 看可用點，不要猜 commit hash
2. **確認無未提交的工作**：`git status` 確認 clean
3. **告知用戶後果**：rewind 後該 commit 之後的 git history 消失，無法透過 `git reflog` 恢復

**適合 rewind 的情境**：
- 實驗性操作讓 repo 進入壞狀態，需要回到乾淨基準點
- 用戶明確說「回到上一個 checkpoint」或「undo 這個 session」

**不適合 rewind 的情境**：
- 只是想「查看」過去的狀態 → 用 `checkpoint_explain` 即可，不需要 rewind
- 有未 push 的 commit 需要保留 → 先 `git push` 備份再決定

### `entire_attach` 的使用時機

當 Claude Code session 沒有被 Entire 自動追蹤時（通常是手動啟動的 session 或 agent subagent），用 `entire_attach` 把它加入 checkpoint 系統：

```
entire_attach session_id="2026-01-13-abc123..."
```

先用 `entire_session_list` 確認 session ID 格式是否符合（`YYYY-MM-DD-uuid`）。

## 常見錯誤排查

| 症狀 | 原因 | 解法 |
|------|------|------|
| 工具回傳空結果 | `ENTIRE_REPO_PATH` 未設或指向錯 repo | 傳入 `repo_dir` 參數，或確認 `~/.zshenv` 設定 |
| `entire_doctor` 回報 login 失敗 | `entire login` 未完成 | 請用戶執行 `entire login` |
| `entire_labs_review` 回傳錯誤 | preview 功能，不穩定 | 改用 `pr-review` skill |
| checkpoint list 為空 | Entire 未追蹤此 repo | 確認 Entire 已初始化（`entire doctor`）|

## 重要提醒

- **`entire checkpoint search --json` 不可靠**（preview 功能），已排除在工具集之外。改用 `entire_checkpoint_list` + `entire_checkpoint_explain` 組合
- `ENTIRE_REPO_PATH` 環境變數設定預設 repo 路徑；或每次呼叫時傳入 `repo_dir` 參數
- `entire_checkpoint_rewind` 是 **destructive** 操作，會重寫 git history
- `entire_labs_review` 是實驗性功能，不在正式工作流程中使用

## 環境需求

- `entire` CLI 已安裝且完成 `entire login`
- `ENTIRE_REPO_PATH` 已設定（`~/.zshenv`）

完整安裝步驟、環境變數設定與常見設定問題，見 `references/environment-setup.md`。
