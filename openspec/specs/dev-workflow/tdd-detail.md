# TDD Detail

## Purpose

描述 `tdd` plugin（shim）與 `tdd-workflow` plugin（執行引擎）的設計邊界，以及 `tdd-guide` agent 的角色。

## 產物

| 產物 | 路徑 | 說明 |
|------|------|------|
| `/tdd` command（shim） | `plugins/tdd/commands/tdd.md` | legacy 入口，委派給 tdd-workflow skill |
| `tdd-guide` agent | `plugins/tdd/agents/tdd-guide.md` | TDD specialist（model: sonnet，119 行） |
| `tdd-workflow` skill | `plugins/tdd-workflow/skills/tdd-workflow/SKILL.md` | 執行引擎（auto-activate，209 行） |
| test-patterns reference | `plugins/tdd-workflow/skills/tdd-workflow/references/test-patterns.md` | Vitest / Playwright / mock patterns |
| common-mistakes reference | `plugins/tdd-workflow/skills/tdd-workflow/references/common-mistakes.md` | 反模式與最佳實踐 |

## tdd command（shim）的角色

`/tdd` command 是一個 **legacy shim**，不含 TDD 執行邏輯：

```
/tdd <description>
  → 委派給 tdd-workflow skill（canonical 邏輯）
  → 委派給 tdd-guide agent（可選）
```

command 存在原因：使用者肌肉記憶（`/tdd`）。TDD 邏輯的唯一維護點是 `tdd-workflow` skill，不是此 command。

## tdd-workflow skill（執行引擎）

**Auto-activate 觸發條件**：
- 寫新功能或修 bug 時
- 重構現有程式碼時
- 使用者明確要求「write tests first」/ 「TDD 開發」/ 「RED GREEN REFACTOR」

**7 步執行流程**：

| 步驟 | 動作 | Git checkpoint |
|------|------|---------------|
| 1 | 寫 User Journey（As a [role]...） | — |
| 2 | 生成 test cases（describe/it） | — |
| 3 | 執行測試 → 確認 **RED**（必要 gate） | `test: add reproducer for <feature>` |
| 4 | 寫最小實作 | — |
| 5 | 執行測試 → 確認 **GREEN** | `fix: <feature>` |
| 6 | Refactor（移除重複、改善命名） | `refactor: clean up after <feature>` |
| 7 | Coverage check（目標 80%+） | — |

**RED gate 規則**（不可跳過）：
- 測試必須實際編譯並執行
- 失敗原因必須是業務邏輯 bug / 未實作，不是語法錯誤或環境問題
- 僅寫完測試但未執行不算 RED

## tdd-guide agent

`tdd-guide` agent 是可選的委派路徑，適合使用者需要全程 guided 時：
- 工具：`["Read", "Write", "Edit", "Bash", "Grep"]`（可寫入程式碼）
- model: sonnet

tdd-guide agent 在文件內參照 `tdd-workflow` skill 作為 mocking pattern 來源，不重複定義 TDD 步驟。

**v1.8 Eval-Driven 擴充**（tdd-guide agent 特有）：
1. 定義 capability + regression evals（在實作前）
2. 執行 baseline，記錄 failure signatures
3. 實作最小修改
4. 回報 pass@1 和 pass@3
5. Release-critical paths 需達到 pass^3 穩定性才可 merge

## 覆蓋率要求

| 程式碼類型 | 最低覆蓋率 |
|---------|---------|
| 一般程式碼 | 80% |
| 金融計算 | 100% |
| 認證邏輯 | 100% |
| 核心業務邏輯 | 100% |

## 與其他 plugin 的關係

詳見 [dev-workflow-overview.md](./dev-workflow-overview.md)。

前置：`/plan` 確認後開始 TDD  
後置：TDD 完成 commit + push → `/pr-review`
