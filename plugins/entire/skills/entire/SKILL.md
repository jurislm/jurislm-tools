---
name: entire
version: 1.0.0
description: >
  Use this skill when the user asks about Entire checkpoints, sessions, AI agent history,
  "list checkpoints", "explain checkpoint", "rewind checkpoint", "session recap",
  "entire doctor", "resume branch session", "attach session",
  "列出 checkpoint", "查看 checkpoint", "回退 checkpoint",
  "session 摘要", "診斷 entire", or anything related to Entire CLI session management.
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

## 重要提醒

- **`entire checkpoint search --json` 不可靠**（preview 功能），已排除在工具集之外。改用 `entire_checkpoint_list` + `entire_checkpoint_explain` 組合
- `ENTIRE_REPO_PATH` 環境變數設定預設 repo 路徑；或每次呼叫時傳入 `repo_dir` 參數
- `entire_checkpoint_rewind` 是 **destructive** 操作，會重寫 git history

## 環境需求

- `entire` CLI 已安裝且完成 `entire login`
- `ENTIRE_REPO_PATH` 已設定（`~/.zshenv`）
