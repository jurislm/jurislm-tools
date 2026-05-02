# Dev Workflow Overview

## Purpose

說明 `plan`、`tdd`、`tdd-workflow`、`pr-review` 四個 plugin 的設計邊界與呼叫關係，避免因三個重疊的 plugin 造成維護者混淆。

## 四個 Plugin 的邊界

| Plugin | 角色 | 主要產物 | 自動觸發？ |
|--------|------|---------|---------|
| plan | 計畫生產者 | `/plan` command + `planner` agent | 否（手動） |
| tdd | TDD 入口（shim） | `/tdd` command + `tdd-guide` agent | 否（手動） |
| tdd-workflow | TDD 執行引擎 | `tdd-workflow` skill | 是（auto-activate） |
| pr-review | PR 自動化 | `pr-review` skill + `/pr-review` command | 否（手動） |

## 呼叫流程

```
使用者描述需求
  ↓
/plan  →  planner agent（model: opus）
  │         產出：Implementation Plan（Phases + Risks + Success Criteria）
  ↓ 使用者確認 ✓
/tdd   →  tdd command（shim）→  tdd-workflow skill（auto-activate）
  │         + tdd-guide agent（model: sonnet）
  │         執行：RED → GREEN → REFACTOR → Coverage check
  ↓ commit + push → PR opened
/pr-review  →  pr-review skill
              Monitor CI → Read Claude review → Fix → Merge（最多 5 輪）
```

## plan plugin

`/plan` command 預設 **inline 執行**（不呼叫 Task tool 或任何 subagent），使用者可直接在 plugin 安裝後執行，無需 agent 文件存在。

`planner` agent 是**選擇性加速路徑**，只有在本地 runtime 已暴露 `subagent_type: planner` 時才可委派。無法找到 agent 時，command 繼續 inline 規劃，不回傳錯誤。

**產出格式**：`# Implementation Plan: [Feature Name]` 含 Requirements / Architecture Changes / Implementation Steps（Phases）/ Testing Strategy / Risks & Mitigations / Success Criteria。

計畫完成後必須等待使用者明確確認（`yes` / `proceed`）才可進入下一階段。**不主動執行任何程式碼修改。**

## tdd plugin（shim）

`/tdd` command 是 **legacy shim**，其職責是：
1. 委派給 `tdd-workflow` skill（canonical TDD 邏輯所在）
2. 委派給 `tdd-guide` agent（可選，model: sonnet）

`tdd` command 本身不含 TDD 執行邏輯，邏輯集中在 `tdd-workflow` skill。shim 的存在原因：向後相容性（使用者習慣輸入 `/tdd`）。

## tdd-workflow skill（執行引擎）

`tdd-workflow` skill 是唯一維護 TDD 執行邏輯的地方，採 **auto-activate**：當使用者在寫新功能、修 bug、重構時自動載入，不需手動呼叫。

執行步驟：
1. 寫 User Journey
2. 生成 test cases（describe/it 格式）
3. 執行測試 → 確認 **RED**（必要 gate，不可跳過）
4. 寫最小實作
5. 執行測試 → 確認 **GREEN**
6. Refactor
7. Coverage check（目標 80%+）

Git checkpoint commit 規則：
- RED 確認後：`test: add reproducer for <feature>`
- GREEN 確認後：`fix: <feature>`
- Refactor 完成後：`refactor: clean up after <feature>`

三個 commit 必須在目前 active branch 上可追蹤（不計其他分支的歷史）。

## pr-review skill

`pr-review` skill 在 PR 開啟後執行，最多 5 輪循環：

```
確認 PR 狀態
  → Monitor CI（等待所有 checks 完成）
  → 讀取 Claude bot review（最多等 90 秒，若無則停止）
  → 若可合併 → squash merge + delete branch
  → 若需修正 → 讀取問題清單 → 逐一修正 → commit + push → 下一輪
```

終止條件：合併成功 ／ 五輪後仍有問題 ／ CI 環境故障 ／ PR 已關閉。

**不使用 `--no-verify`**，不主動 force-push（除非 `--force-with-lease` 且已通知使用者）。

## 設計決策：為何是三個分開的 plugin？

| 理由 | 說明 |
|------|------|
| 可選安裝 | 使用者可以只安裝 `plan` 而不需要 `tdd`，或只安裝 `pr-review` |
| 功能邊界清晰 | `plan` 是靜態產物（不執行程式碼）；`tdd-workflow` 是執行引擎；`pr-review` 是 CI 整合 |
| auto-activate 衝突 | `tdd-workflow` 設計為 auto-activate skill，若與 `plan` 合併會在不適當時機觸發 |
| shim 相容性 | `tdd` command 作為 shim 存在，若合併進 `tdd-workflow` 會打破已安裝使用者的肌肉記憶 |

## Detail Specs

- [plan-detail.md](./plan-detail.md)
- [tdd-detail.md](./tdd-detail.md)
- [pr-review-detail.md](./pr-review-detail.md)
