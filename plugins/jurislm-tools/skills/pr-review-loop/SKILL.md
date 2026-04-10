---
name: pr-review-loop
version: 1.0.0
description: PR 開啟後自動輪詢 CI 狀態與 Bot Code Review feedback，分析合理建議並修正，Bot 核准且 CI 通過後自動合併；達到輪次上限仍未核准則停止並通知使用者介入。當使用者說「幫我看 PR review」、「等 CI 通過」、「自動處理 PR feedback」、「loop PR」時觸發。
argument-hint: "[interval=3] [loop=5] [repo=current] [pr=current]"
---

# PR Review Loop

PR 開啟後，自動輪詢 CI 與 Bot Code Review，分析 feedback 並修正，通過後合併。

---

## 執行參數

| 參數 | 預設值 | 說明 |
|------|--------|------|
| `interval` | `3` | 每輪 CI 輪詢間隔（分鐘，純數字） |
| `loop` | `5` | 最大輪次，超過則停止並通知使用者 |
| `repo` | 當下 repo | `gh repo view --json nameWithOwner` 偵測 |
| `pr` | 當下 branch 的 PR | `gh pr view --json number` 偵測 |

---

## 初始化（Loop 開始前執行一次，不在每輪重置）

```
LAST_PUSH_TIME = ""        # 每次 push 後更新，作為 feedback 篩選基準
ROUND_COUNT = 0            # 計數完整輪次
PENDING_POLLS = 0          # 計數 CI 輪詢次數（每次進入步驟一時為 0）
MAX_PENDING_POLLS = 30     # 輪詢上限，超過則超時（約 MAX_PENDING_POLLS × interval 分鐘）
SEEN_PENDING = false       # CI 是否曾出現 pending：false = 未觀察到；true = 已觸發但尚未完成
TIME = <interval 參數值，若未提供則預設 3>
```

---

## 每輪執行流程

**一輪的定義**：步驟一（CI 通過）完成後，執行步驟二與步驟三，才算完成一輪（`ROUND_COUNT += 1`）。CI 修正與等待不計入輪次。

---

### 步驟一：檢查 CI

持續執行 `gh pr checks <PR> --repo <REPO>`，直到 CI 進入最終狀態：

| CI 狀態 | 做法 |
|---------|------|
| `pending` / `in_progress` | 設 `SEEN_PENDING=true`；`PENDING_POLLS += 1`；若 `PENDING_POLLS >= MAX_PENDING_POLLS` → **停止，執行「CI 等待超時」（見下方）**；否則等待 `TIME` 分鐘，重新執行 `gh pr checks` |
| `failure` / `error` | **進入「CI failure 修正」sub-loop（見下方）** |
| 全部 `pass` / `success` | 重置 `PENDING_POLLS=0`、`SEEN_PENDING=false`；記錄 `ROUND_START`；進入步驟二 |
| 無任何 check 項目（無 CI 設定） | 若本輪有 push，等待 `TIME` 分鐘讓 Bot 完成 re-review；記錄 `ROUND_START`；進入步驟二 |

> **衝突優先**：每次進入步驟一前，先執行 `gh pr view <PR> --repo <REPO> --json mergeable`。若 `CONFLICTING` → 立即解決衝突（見「衝突處理」），commit + push，更新 `LAST_PUSH_TIME`；衝突未解決時 CI 可能無法觸發，Bot 也無法完整 review。

**CI failure 修正 sub-loop**：
- **a.** 閱讀 CI 錯誤日誌，分析根本原因，修正後 commit + push；更新 `LAST_PUSH_TIME`，重置 `PENDING_POLLS=0`、`SEEN_PENDING=false`
- **b.** 持續執行 `gh pr checks`（每次輪詢後等待 `TIME` 分鐘，`PENDING_POLLS += 1`），直到符合以下任一條件：
  - 出現 `pending` / `in_progress`（設 `SEEN_PENDING=true`）→ 回到步驟一表格頂端繼續正常輪詢
  - 所有 check 完成（全部 pass 或有 failure）→ 直接進入步驟一表格對應分支處理
  - `PENDING_POLLS >= MAX_PENDING_POLLS` 且 `SEEN_PENDING=false`（push 後 CI 從未觸發）→ **停止，執行「CI 等待超時」情境 B**

> 注：`PENDING_POLLS >= MAX_PENDING_POLLS` 時 `SEEN_PENDING` 必為 `false`（若為 `true` 則第一個條件已先觸發 sub-loop 退出），此組合在邏輯上不可達。

---

### 步驟二：讀 Bot Feedback

```bash
gh pr view <PR> --repo <REPO> --json comments,reviews
```

讀取來源：
- **GitHub Copilot** → `reviews` 欄位（formal review，含 `APPROVED` / `CHANGES_REQUESTED` 狀態）
- **Claude Bot** → `comments` 欄位（inline 留言）

篩選方式：只處理 `createdAt` 晚於 `LAST_PUSH_TIME` 的新留言。第一輪尚無 push 記錄時，以 `ROUND_START` 為 fallback，讀取所有留言。

> Copilot 預設**每個 PR 只 review 一次**。若要每次 push 都觸發重新 review，需 GitHub Team 方案 + Ruleset 啟用「Review new pushes」。未啟用時，Copilot 第一輪後不會再出現新 feedback。Claude Bot（`claude-code-review.yml` workflow）每次 push 後仍會觸發。

---

### 步驟三：修正或合併

查詢當前合併狀態：

```bash
gh pr view <PR> --repo <REPO> --json reviewDecision,statusCheckRollup
```

**CI 全 pass 的判斷**：`statusCheckRollup` 所有 item 的 `conclusion` 為 `SUCCESS`、`NEUTRAL` 或 `SKIPPED`（無任何 `FAILURE` / `TIMED_OUT` / `CANCELLED`）；若 `statusCheckRollup` 為空陣列但步驟一確認無 CI 設定，視為通過。

| 狀態 | 做法 |
|------|------|
| `reviewDecision: APPROVED` + CI 全 pass | **執行合併**（見「合併步驟」） |
| `reviewDecision: null`（無需 reviewer 核准）+ CI 全 pass | 通知使用者「此 repo 無需 reviewer 核准，即將自動合併」，隨即**執行合併** |
| `CHANGES_REQUESTED` 或 CI failure | 根據 feedback 判斷是否修正（見下方）；修正後 commit + push，更新 `LAST_PUSH_TIME`；`ROUND_COUNT += 1`；若 `ROUND_COUNT < loop` → 回到步驟一；若 `ROUND_COUNT >= loop` → **停止，執行「超過輪次停止」** |
| CI pending（`statusCheckRollup` 有項目但尚未回報結論） | 重置 `PENDING_POLLS=0`、`SEEN_PENDING=false`，回到步驟一 |

**Feedback 判斷原則（不盲目接受）**：

| 情況 | 做法 |
|------|------|
| 建議合理（bug、安全問題、明確錯誤） | 修正，commit |
| 建議合理但屬風格偏好 | 評估是否符合專案規範，再決定 |
| 建議不合理（誤解需求、過度工程化） | 跳過，可在 PR 留言說明原因 |

---

## 衝突處理

```bash
# 1. 取得 base branch（從 PR 資訊動態取得，不假設是 main）
BASE=$(gh pr view <PR> --repo <REPO> --json baseRefName --jq '.baseRefName')

# 2. 確認衝突範圍
git fetch origin
git diff HEAD...origin/$BASE

# 3. rebase（優先）
git rebase origin/$BASE
# 若有衝突：手動解決 → git add → git rebase --continue

# 4. push
git push --force-with-lease
```

> 使用 `--force-with-lease`（非 `--force`）確保不覆蓋他人的推送。

---

## 合併步驟

```bash
gh pr merge <PR> --repo <REPO> --squash --delete-branch
```

或依 repo 規範選擇 `--merge` / `--rebase`。

---

## CI 等待超時

當 `PENDING_POLLS >= MAX_PENDING_POLLS`，CI 長時間未完成或未觸發：

1. **立即停止所有自動操作**
2. 取得 PR 作者：

```bash
PR_AUTHOR=$(gh pr view <PR> --repo <REPO> --json author --jq '.author.login')
```

3. 依 `SEEN_PENDING` 選擇通知情境：

**情境 A：CI 已觸發但長時間未完成**（`SEEN_PENDING=true`）

```
⚠️ PR #<PR> 的 CI 已持續 pending 超過 <PENDING_POLLS> 次輪詢（已等待約 <PENDING_POLLS × TIME> 分鐘（即 <PENDING_POLLS> 次 × <TIME> 分鐘/次，MAX_PENDING_POLLS=<MAX_PENDING_POLLS>，TIME=<TIME>）），可能為 Runner 故障或 workflow 超時，已停止等待。

請 @<PR_AUTHOR> 手動檢查：
- GitHub Actions Runner 是否正常運行
- CI workflow 是否有超時或設定問題
- 確認後請手動重跑 CI 或調整後重新觸發。
```

**情境 B：push 後 CI 長時間未觸發**（`SEEN_PENDING=false`）

```
⚠️ PR #<PR> 在修正並 push 後，CI 長時間未重新觸發（已等待約 <PENDING_POLLS × TIME> 分鐘（即 <PENDING_POLLS> 次 × <TIME> 分鐘/次，MAX_PENDING_POLLS=<MAX_PENDING_POLLS>，TIME=<TIME>）），可能為 workflow trigger 設定問題，已停止等待。

請 @<PR_AUTHOR> 手動檢查：
- GitHub Actions trigger 設定是否正確（on.push, on.pull_request）
- 是否有 branch filter 導致 workflow 未觸發
- 確認後請手動重跑 CI 或調整 trigger 設定後重新推送。
```

---

## 超過輪次停止

當 `ROUND_COUNT >= loop`，且 PR 仍未達到可合併狀態時：

1. **立即停止所有自動操作，不執行合併**
2. 取得 PR 作者：

```bash
PR_AUTHOR=$(gh pr view <PR> --repo <REPO> --json author --jq '.author.login')
```

3. 通知使用者介入：

```
⚠️ PR #<PR> 已達最大輪次（<loop> 輪）仍未獲得核准，已停止自動處理。

請 @<PR_AUTHOR> 手動檢查以下項目：
- Bot feedback 是否仍有 needs changes（是否有需要人工判斷的建議）
- CI 是否持續失敗（原因為何）
- 是否涉及設計決策需要人工介入

確認後請手動合併或調整後重新觸發。
```

> ⚠️ **重要**：達到輪次上限後，不可自行判斷合併。即使認為所有建議都已處理，仍須等待使用者確認才能合併。

---

## 注意事項

- 每次 commit 前依 repo 規範執行測試與 lint（如 `bun test`、`npm test`、`pytest`、`go test` 等）
- 不可用 `--no-verify` 跳過 pre-commit hook
- 若 Bot 留言涉及安全問題（CRITICAL），立即修正，不可跳過
- PR 合併後確認相關下游分支已同步（依團隊分支策略）
