---
name: entire
description: 管理 Entire AI agent checkpoints 和 sessions — 列出、查看、回退 checkpoint，生成 session 摘要，診斷 Entire 安裝
argument-hint: "[action] [checkpoint-id/branch/session-id]"
---

Load the `entire` skill and follow its instructions.

## 主要操作

| 操作 | 說明 | 範例 |
|------|------|------|
| `list` | 列出所有 checkpoints | `/entire list` |
| `explain <id>` | 查看 checkpoint 完整 transcript | `/entire explain a3b2c4d5` |
| `rewind <commit>` | 回退到指定 checkpoint（⚠️ destructive）| `/entire rewind a3b2c4d5` |
| `recap` | 生成當前 session 工作摘要 | `/entire recap` |
| `doctor` | 診斷 Entire 安裝與 repo 設定 | `/entire doctor` |
| `resume <branch>` | 切換到 branch 並恢復 session | `/entire resume feature/auth` |
| `sessions` | 列出所有 sessions | `/entire sessions` |

## 快速參考

- **查看過去做了什麼** → `explain <checkpoint-id>`
- **回到之前狀態** → `rewind <commit>`（先 `list` 確認目標）
- **產生工作摘要** → `recap`
- **修復安裝問題** → `doctor`
