---
name: pr-review
description: 讀取 Claude code review 結果，若可合併則合併，若有問題則修正後重試，最多五輪。
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

### 第四步（can merge）：執行合併

確認 PR title 格式符合專案規範（如 `feat: xxx` / `fix: xxx`），然後執行 squash merge 並刪除 branch。

### 第四步（needs changes）：修正問題

逐一處理「問題與建議」清單中的每個問題。修正完成後，確認測試與 lint 通過，commit + push。輪次加一後回到第一步。

---

## 結束條件

| 情況 | 結果 |
|------|------|
| Claude review 說 can merge | 合併，完成 |
| 五輪結束後 Claude review 仍說 needs changes | 停止，通知使用者目前剩餘問題清單，請人工判斷 |
| CI 失敗且無法自行修正 | 停止，通知使用者具體失敗原因 |
| PR 已關閉或合併 | 停止 |
| CI 超時或環境故障 | 停止，通知使用者 |

---

## 注意事項

- 每次 commit 前必須確認測試與 lint 通過，不可用 `--no-verify` 跳過
- 若問題涉及設計決策或需求確認，不要自行猜測，停止並通知使用者
