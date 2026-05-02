# PR Review Detail

## Purpose

描述 `pr-review` plugin 的自動化 PR 審查與合併流程，包含最多 5 輪的 CI 監控、Claude bot review 解讀、問題修正與 squash merge。

## 產物

| 產物 | 路徑 | 說明 |
|------|------|------|
| `pr-review` skill | `plugins/pr-review/skills/pr-review/SKILL.md` | 執行邏輯（137 行） |
| `/pr-review` command | `plugins/pr-review/commands/pr-review.md` | 入口 command（41 行） |
| notification-templates reference | `plugins/pr-review/skills/pr-review/references/notification-templates.md` | 通知訊息模板 |

## 執行參數

| 參數 | 預設值 | 說明 |
|------|--------|------|
| `loop` | 5 | 最大修正輪次 |
| `timeout` | 60 | 等待 CI 的最大時間（分鐘） |
| `repo` | 當下 repo | 目標 repo |
| `pr` | 當下 branch 的 PR | 目標 PR 編號 |

## 5 輪循環流程

```
for round in 1..5:
  1. 確認 PR 仍開啟（否則停止）
  2. Monitor CI → 等待所有 checks 完成
     - CI 失敗且可修正 → 修正 + commit + push → 重新開始本輪
     - CI 失敗且無法判斷 → 停止通知使用者
     - CI 超時（> timeout 分鐘） → 停止
  3. 等 15 秒（GitHub 傳播），讀取 Claude bot 最新 review
     - 找不到 review → 每 30 秒重試，最多 3 次（共 90 秒）→ 若仍無則停止
  4a. Review 結論 = 可合併 → squash merge + delete branch → 結束
  4b. Review 結論 = 需修正 → 讀取問題清單 → 逐一修正 → commit + push → 下一輪

if 5 輪後仍未合併 → 停止，列出剩餘問題清單，請使用者手動判斷
```

## CI 失敗類型判斷

| 失敗類型 | 判斷依據 | 處理方式 |
|---------|---------|---------|
| TypeScript 錯誤 | log 含 `error TS\d+:` | 讀錯誤訊息修正型別 |
| ESLint 錯誤 | log 含 `@typescript-eslint/` | 按規則修正，禁止 `eslint-disable` |
| Vitest 測試失敗 | log 含 `FAIL  src/...test.ts` | 先確認測試正確，再修程式碼 |
| Build 失敗 | log 含 `next build failed` | 多為 import path / 環境變數 |
| Merge conflict | GitHub UI 顯示衝突 | `git fetch && git rebase origin/main` |
| 環境問題 | `ECONNREFUSED` / `503` | 不修程式碼，停止通知使用者 |
| Coverage 下降 | coverage < 80% | 補測試，不可降低 threshold |

## Claude Review 結論解讀

不依賴固定詞語，理解整體語意：

| 語意 | 動作 |
|------|------|
| "LGTM" / "可以合併" / "No issues" / "✅ Approved" | 進行 squash merge |
| "建議調整" / "Found N issues" / 列出 file:line | 進入修正流程 |
| "Consider..." / 模糊建議 / 未明說 block | 停止，貼出 review 給使用者判斷 |

## Edge Cases

| 情況 | 處理 |
|------|------|
| PR base branch 不是 main | 合併目標永遠是 PR 設定的 base branch |
| Stacked PRs（依賴未合併的上游 PR） | 確認上游狀態，若未合併停下通知使用者 |
| Force-push 後 review 過期 | 等待 reviewer trigger，最多等 timeout |
| 有人類 reviewer（Claude 認為可合併但人類留 comment） | 停下讓使用者判斷 |

## 不做什麼

- 不使用 `--no-verify` 跳過 hooks
- 不猜測設計決策或需求確認
- 不主動 force-push（除非 `--force-with-lease` 且已通知使用者）
- Squash merge commit message 沿用 PR title（確認符合 `feat:/fix:/...` 格式）

## 與其他 plugin 的關係

前置：TDD 完成後 commit + push，PR 開啟  
詳見 [dev-workflow-overview.md](./dev-workflow-overview.md)。
