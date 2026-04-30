---
name: pr-review
version: 1.0.0
description: >
  This skill should be used when the user asks to "review PR", "merge PR", "處理 PR review",
  "PR 自動合併", "讀取 code review 結果並修正", "PR review loop", "monitor CI and merge",
  "address Claude bot review", "fix PR comments and merge", or wants to monitor CI status,
  read Claude bot review feedback, fix issues iteratively, and merge when ready (up to 5 rounds).
argument-hint: "[loop=5] [timeout=60] [repo=current] [pr=current]"
---

# PR Review Loop

## 這個技能做什麼

指令下達後，進入一個最多五輪的循環：

1. 等待 CI 跑完（包含 Claude code review）
2. 完整閱讀 Claude review 內容，理解結論意圖
3. 若 review 認為可以合併 → 執行合併，結束
4. 若 review 認為有問題需要修正 → 讀取問題清單，逐一修正，commit + push，進入下一輪
5. 五輪結束後仍未通過 → 停止並通知使用者手動處理

---

## 執行參數

| 參數 | 預設值 | 說明 |
|------|--------|------|
| `loop` | `5` | 最大修正輪次 |
| `timeout` | `60` | 等待 CI 的最大時間（分鐘） |
| `repo` | 當下 repo | 目標 repo |
| `pr` | 當下 branch 的 PR | 目標 PR 編號 |

---

## 每一輪的步驟

### 第一步：確認 PR 狀態

確認 PR 仍為開啟狀態且沒有 merge 衝突。若 PR 已關閉或已合併，停止並通知使用者。若有衝突，先解決衝突（rebase），再繼續。

### 第二步：等待 CI 完成並處理失敗

使用 Monitor tool 即時監控 CI，等到所有 checks 全部結束。

- 若 CI 在 `timeout` 分鐘內**全部通過** → 進入第三步
- 若 CI 有 checks **失敗**（非超時）→ 分析失敗原因：
  - 讀取失敗 check 的 logs，判斷是什麼問題（typecheck 錯誤、lint 錯誤、測試失敗、merge 衝突、環境問題等）
  - 若是可以修正的代碼問題 → 進行修正，commit + push，輪次加一，回到第一步
  - 若是環境問題或無法自行判斷的問題 → 停止並通知使用者，說明具體失敗原因
- 若 CI 超過 `timeout` 分鐘**仍未完成** → 停止並通知使用者

### 第三步：讀取 Claude review 結論

CI 完成後等待約 15 秒讓 GitHub 傳播，再讀取 PR comments。找到 Claude bot 最新貼出的 review comment，**完整閱讀內容，理解其意圖**：

- 若結論表達「可以合併、通過、沒有問題」→ 進入合併步驟
- 若結論表達「有問題、需要修正、建議調整」→ 讀取問題清單，進入修正步驟

不要只比對特定詞語，要理解整份 review 的意思。

**若找不到 Claude review comment**（bot 尚未發布、傳播延遲、未設定為 reviewer）：
- 每隔 30 秒重試一次，最多重試 3 次（共等待約 90 秒）
- 3 次後仍無 review → 停止並通知使用者，說明找不到 Claude review，請確認 bot 是否已設定為 reviewer

### 第四步（can merge）：執行合併

確認 PR title 格式符合專案規範（如 `feat: xxx` / `fix: xxx`），然後執行 squash merge 並刪除 branch。

### 第四步（needs changes）：修正問題

逐一處理「問題與建議」清單中的每個問題。修正完成後，確認測試與 lint 通過，commit + push。輪次加一後回到第一步。

---

## 結束條件

| 情況 | 結果 |
|------|------|
| Claude review 結論為可合併 | 合併，完成 |
| 五輪結束後 Claude review 仍有問題 | 停止，通知使用者目前剩餘問題清單，請人工判斷 |
| CI 失敗且無法自行修正 | 停止，通知使用者具體失敗原因 |
| PR 已關閉或合併 | 停止 |
| CI 超時或環境故障 | 停止，通知使用者 |

---

## Common CI failure patterns

判斷 CI 失敗類型並決定如何處理：

| 失敗類型 | 判斷方式 | 處理 |
|---------|---------|------|
| TypeScript 錯誤 | Log 含 `error TS\d+:` 或 `Type '...' is not assignable` | 讀錯誤訊息，修正型別後重 push |
| ESLint 錯誤 | Log 含 `error  ...  @typescript-eslint/...` | 讀規則名稱，按規則修正；不可加 `eslint-disable` 繞過 |
| Vitest 測試失敗 | Log 含 `FAIL  src/...test.ts` | 讀 expected/received，先確認測試是對的，再修代碼 |
| Build 失敗 | Log 含 `next build failed` 或 `Module not found` | 多半是 import path 或環境變數，不是設計問題 |
| Merge conflict | GitHub UI 顯示 "This branch has conflicts" | `git fetch && git rebase origin/main` 解衝突 → push |
| 環境問題 | Log 含 `Connection refused` / `ECONNREFUSED` / `503` | 不要修代碼，停止並告訴使用者 |
| Coverage 下降 | Vitest coverage report 顯示 < 80% | 補測試（可參考 tdd-workflow skill），不可降低 threshold |

## Interpreting Claude review conclusions

Claude bot review 的結論不會用統一詞彙，要理解整體語意。常見模式：

**可合併（執行第四步：合併）：**
- "LGTM" / "Looks good to me"
- "可以合併" / "建議合併"
- "No issues found" / "沒發現問題"
- "✅ Approved"

**需要修正（執行第四步：修正）：**
- "建議調整" / "需要修正"
- "Found N issues" / "發現以下問題"
- 列出明確的 file:line 位置與建議

**模糊或中立（不要猜，停下來問）：**
- "Consider..." / "考慮..."（建議性，非必要）
- 只列風險但沒明說 block
- 提到 "但需要 confirm" / "需要確認"

模糊情況：合併與修正都不對，停下並把 review 內容貼給使用者判斷。

## Edge cases

- **PR base branch 不是 main**：例如 feature → develop → main 的兩段式流程。合併目標永遠是 PR 設定的 base branch，不要假設是 main。
- **Stacked PRs**：當前 PR 依賴另一個未合併的 PR。先確認上游 PR 狀態，若未合併，停下來通知使用者。
- **Force-push 後 review 過期**：若有新 commit 但 Claude bot 還沒重跑 review，等待 reviewer trigger。最多等 timeout 後若仍無新 review 則停下。
- **Multiple reviewers**：Claude bot 不是唯一 reviewer。若有人類 reviewer 留 comment 但 Claude 認為可合併，停下來讓使用者判斷。

## 注意事項

- 每次 commit 前必須確認測試與 lint 通過，不可用 `--no-verify` 跳過
- 若問題涉及設計決策或需求確認，不要自行猜測，停止並通知使用者
- 不要主動 force-push（除非用 `--force-with-lease` 且已通知使用者）
- Squash merge 後 commit message 沿用 PR title，確認 PR title 符合 `feat:/fix:/...` 格式
