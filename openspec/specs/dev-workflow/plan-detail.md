# Plan Plugin Detail

## Purpose

`plan` plugin 在動手寫程式前強制產出一份結構化的 Implementation Plan，並等待使用者確認才進行後續實作。

## 產物

| 產物 | 路徑 | 說明 |
|------|------|------|
| `/plan` command | `plugins/plan/commands/plan.md` | inline 執行入口（123 行） |
| `planner` agent | `plugins/plan/agents/planner.md` | 選擇性委派（model: opus，240 行） |

## 觸發條件

- 使用者輸入 `/plan <feature description>`
- 開始新功能、大型重構、多檔案修改、需求不明確時

## Command 行為

`/plan` command 預設 **inline 執行**，不使用 Task tool 或 subagent：

1. 重述需求（Requirements Restatement）
2. 拆解實作 Phases（Phase 1 → N，每 phase 含具體步驟、檔案路徑、風險評估）
3. 識別依賴關係
4. 評估複雜度（High / Medium / Low）
5. 展示計畫後 **停止等待確認**：`WAITING FOR CONFIRMATION: Proceed? (yes/no/modify)`

使用者回應選項：
- `yes` / `proceed` → 進入實作
- `modify: [changes]` → 修改後重新展示
- `different approach: [alternative]` → 替換方案

## Planner Agent（選擇性）

`planner` agent 只在 runtime 可找到 `subagent_type: planner` 時才委派。找不到時 command 繼續 inline，不回傳錯誤訊息。

agent 特性：
- 使用 Claude Opus（最深層推理）
- 工具限制：`["Read", "Grep", "Glob"]`（只讀，不修改程式碼）
- 產出格式與 command inline 相同

## Plan 輸出格式

```markdown
# Implementation Plan: [Feature Name]

## Requirements
## Architecture Changes
## Implementation Steps
  ### Phase 1: [Name]
    1. **[Step]** (File: path/to/file)
       - Action / Why / Dependencies / Risk
## Testing Strategy
## Risks & Mitigations
## Success Criteria
  - [ ] Criterion 1
```

## 不做什麼

- 不寫任何程式碼（直到確認後）
- 不執行 Bash 命令
- 不修改任何檔案

## 與其他 plugin 的關係

計畫確認後，建議順序：
1. `tdd-workflow` skill（執行 RED-GREEN-REFACTOR）
2. `/pr-review`（PR CI 監控與合併）

詳見 [dev-workflow-overview.md](./dev-workflow-overview.md)。
