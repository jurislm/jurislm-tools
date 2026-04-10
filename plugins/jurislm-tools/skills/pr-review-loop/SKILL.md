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
| `interval` | `3` | 每輪之間的等待時間（分鐘，純數字） |
| `loop` | `5` | 最大輪次，超過則停止並通知使用者 |
| `repo` | 當下 repo | `gh repo view --json nameWithOwner` 偵測 |
| `pr` | 當下 branch 的 PR | `gh pr view --json number` 偵測 |

---

## 每輪執行流程

**一輪的定義**：CI 通過（pass）後，完整執行 Step 1 ~ Step 6，才算完成一輪（`ROUND_COUNT += 1`）。CI 修正與等待屬於「前置準備」，不計入輪次。

Loop 開始前初始化一次（不在每輪重置）：

```bash
LAST_PUSH_TIME=""    # 每次 push 後更新，作為 feedback 篩選基準
ROUND_COUNT=0        # 計數「有效輪次」
PENDING_POLLS=0      # 計數前置等待的輪詢次數
MAX_PENDING_POLLS=30 # 搭配 TIME 參數，達上限時約等待 MAX_PENDING_POLLS * TIME 分鐘
SEEN_PENDING=false   # 超時情境判斷：false = 尚未觀察到 pending（或重置後 CI 未重新觸發）; true = CI 已觸發但長時間未完成
TIME=${interval:-3}  # 每輪輪詢間隔（分鐘）；呼叫時以 interval=N（小寫）傳入，skill 內部統一用 TIME（大寫，預設 3）
```

### 前置等待：確認 CI 通過後，才開始本輪

> 每次進入前置等待時，`PENDING_POLLS` 必為 0（CI pass 路徑、Step 2 預期外路徑返回前均已重置，或為首次初始化值）。

每輪開始前，持續用 `gh pr checks` 確認 CI 狀態，直到 CI 通過：

```bash
gh pr checks <PR> --repo <REPO>
```

| CI 狀態 | 做法 |
|---------|------|
| 仍有 `pending` / `in_progress` | 設 `SEEN_PENDING=true`（已確認 CI 觸發）；`PENDING_POLLS += 1`；若 `PENDING_POLLS >= MAX_PENDING_POLLS` → **停止，執行「前置等待超時」流程（依 `SEEN_PENDING` 判斷情境，見下方）**；否則等待 `TIME` 分鐘，重新執行 `gh pr checks` |
| 有 `failure` / `error` | 修正 CI 錯誤，commit + push；更新 `LAST_PUSH_TIME`，重置 `PENDING_POLLS=0`、`SEEN_PENDING=false`，**進入「CI failure 修正後等待新 CI 觸發」sub-loop（見下方說明）** |
| 全部 `pass` / `success` | **本輪正式開始**（記錄 `ROUND_START`，重置 `PENDING_POLLS=0`，`SEEN_PENDING=false`），進入 Step 1 |
| 無任何 check 項目（無 CI 設定） | **本輪正式開始**（記錄 `ROUND_START`），進入 Step 1 |

**CI failure 修正後等待新 CI 觸發的詳細子步驟**：
- **a.** 閱讀 CI 錯誤日誌，分析根本原因，修正後 `commit + push`
- **b.** 記錄 `LAST_PUSH_TIME`，重置 `PENDING_POLLS=0`、`SEEN_PENDING=false`
- **c.** 持續執行 `gh pr checks`（每次輪詢後等待 `TIME` 分鐘，`PENDING_POLLS += 1`），直到符合以下任一條件：
   - 出現至少一筆 `pending` / `in_progress`（設 `SEEN_PENDING=true`）→ 回到前置等待表格頂端繼續正常輪詢
   - 所有 check 均已完成（全部 pass 或有 failure）→ 直接進入前置等待表格對應分支（pass 列或 failure 列）繼續處理
   - `PENDING_POLLS >= MAX_PENDING_POLLS` **且 `SEEN_PENDING=false`**（此 sub-loop 結束時 `SEEN_PENDING` 仍為 `false`，即 push 後從未出現 pending）→ 觸發**情境 B** 超時

> **說明**：子步驟 c 的 `PENDING_POLLS` 計數延續自子步驟 b 重置後的值（初始為 0）。情境 B 超時的判斷條件（`SEEN_PENDING=false`）以「子步驟 c 結束時」的狀態為準，而非前置等待全程的 `SEEN_PENDING`——一旦子步驟 c 觀察到 pending（`SEEN_PENDING=true`），便回到表格頂端的正常輪詢流程，不再觸發情境 B。

**CI 通過後，本輪正式開始**（對應表格「全部 pass」列）：

```bash
ROUND_START=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
```

> 前置等待只有在 CI 通過後才會離開。CI failure 在此階段修正，不計入 `ROUND_COUNT`；CI pending 也不計入 `ROUND_COUNT`。  
> 若 Step 1（衝突解決）或 Step 4（Bot feedback 修正）產生新的 push，CI 會重新觸發，後續輪次將再次經過前置等待。

### 前置等待超時

當 `PENDING_POLLS >= MAX_PENDING_POLLS`，CI 長時間未完成或未觸發：

1. **立即停止所有自動操作**
2. 取得 PR 作者：

```bash
PR_AUTHOR=$(gh pr view <PR> --repo <REPO> --json author --jq '.author.login')
```

3. 依 `SEEN_PENDING` 選擇通知情境（`false` = CI 從未觸發；`true` = CI 觸發後卡住）：

**情境 A：一般 pending 輪詢超時**（`SEEN_PENDING=true`，CI 已觸發但長時間未完成）

```
⚠️ PR #<PR> 的 CI 已持續 pending 超過 <PENDING_POLLS> 次輪詢（已等待約 <PENDING_POLLS × TIME> 分鐘（即 <PENDING_POLLS> 次 × <TIME> 分鐘/次，MAX_PENDING_POLLS=<MAX_PENDING_POLLS>，TIME=<TIME>）），可能為 Runner 故障或 workflow 超時，已停止等待。

請 @<PR_AUTHOR> 手動檢查：
- GitHub Actions Runner 是否正常運行
- CI workflow 是否有超時或設定問題
- 確認後請手動重跑 CI 或調整後重新觸發。
```

**情境 B：CI failure 修正 push 後未觸發超時**（`SEEN_PENDING=false`，push 後 CI 長時間未出現新的 pending）

```
⚠️ PR #<PR> 在修正並 push 後，CI 長時間未重新觸發（已等待約 <PENDING_POLLS × TIME> 分鐘（即 <PENDING_POLLS> 次 × <TIME> 分鐘/次，MAX_PENDING_POLLS=<MAX_PENDING_POLLS>，TIME=<TIME>）），可能為 workflow trigger 設定問題，已停止等待。

請 @<PR_AUTHOR> 手動檢查：
- GitHub Actions trigger 設定是否正確（on.push, on.pull_request）
- 是否有 branch filter 導致 workflow 未觸發
- 確認後請手動重跑 CI 或調整 trigger 設定後重新推送。
```

---

### Step 1 — 優先：檢查 Merge Conflict

```bash
gh pr view <PR> --repo <REPO> --json mergeable,mergeStateStatus,baseRefName
```

- `CONFLICTING` → **立即解決衝突**（見下方衝突處理），commit + push，更新 `LAST_PUSH_TIME`，才繼續
- `BLOCKED` / `UNKNOWN` → 等待 CI，繼續
- `MERGEABLE` → 繼續

> ⚠️ 衝突必須優先處理。衝突未解決時 CI 可能無法觸發，Bot 也無法完整 review。

### Step 2 — 確認 CI 通過

```bash
gh pr checks <PR> --repo <REPO>
```

> 前置等待已確保 CI 通過後才進入本輪，此步驟為最終確認。

| CI 結果 | 做法 |
|---------|------|
| 全部 pass | 繼續 Step 3 |
| 無任何 check 項目（無 CI 設定） | 視為通過，繼續 Step 3 |
| 仍有 `pending` / `in_progress`（預期外） | Step 1 **衝突解決** push 可能觸發新 CI；**重置 `PENDING_POLLS=0`、`SEEN_PENDING=false`**，回到「前置等待」重新等待 CI 完成 |
| 有 failure（預期外） | 前置等待已確保 CI 通過，此處出現 failure 可能原因：① Step 1 衝突解決產生了新 push，CI 重新觸發並失敗（Step 1 push 時已更新 `LAST_PUSH_TIME`）；② CI 本身不穩定（flaky test）；無論何種原因，**重置 `PENDING_POLLS=0`、`SEEN_PENDING=false`**，回到前置等待表格頂端（前置等待的 failure 列將負責修正或重新等待）|

### Step 3 — 閱讀 Bot Feedback（每輪必做）

```bash
gh pr view <PR> --repo <REPO> --json comments,reviews
```

讀取來源：
- **GitHub Copilot** → `reviews` 欄位（formal review，含 `APPROVED` / `CHANGES_REQUESTED` 狀態）
- **Claude Bot** → `comments` 欄位（inline 留言）

篩選方式：以**上一輪 push 時間**（`LAST_PUSH_TIME`）作為過濾基準，只處理 `createdAt` 晚於 `LAST_PUSH_TIME` 的新留言。
第一輪尚無 push 記錄時，改用 `ROUND_START` 作為 fallback，讀取所有留言。

> **注意 — Copilot 重新 review 的前提條件**：
> Copilot 預設**每個 PR 只 review 一次**。若要每次 push 都觸發重新 review，需要：
> 1. **GitHub Team 方案**（私人 repo 的 Ruleset 需要付費方案）
> 2. Ruleset 中啟用 **「Review new pushes」** 選項（非預設）
>
> 若未啟用，Copilot 在第一輪後不會再出現新 feedback，可跳過等待 Copilot 重新 review。
> Claude Bot（`claude-code-review.yml` workflow）則每次 push 後仍會觸發。

### Step 4 — 分析與修正

**不盲目接受 Bot 建議**，每條建議須經過判斷：

| 情況 | 做法 |
|------|------|
| 建議合理（bug、安全問題、明確錯誤） | 修正，commit |
| 建議合理但屬風格偏好 | 評估是否符合專案規範，再決定 |
| 建議不合理（誤解需求、過度工程化） | 跳過，可在 PR 留言說明原因 |

修正完畢後：

```bash
git add <files>
git commit -m "fix: <描述>"
git push
LAST_PUSH_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")  # 記錄 push 時間，供下一輪 feedback 篩選使用
```

### Step 5 — 等待 `interval` 分鐘（即 `TIME` 內部變數，讓 Bot 完成 re-review）

每輪結束時等待 `TIME` 分鐘，讓 CI 執行完畢或 Claude Bot 完成 re-review（若本輪有 push，等待 Bot 重新 review；若本輪無修改，等待 CI 狀態更新）。

> Copilot 是否重新 review 取決於是否已啟用「Review new pushes」（見 Step 3 說明）。

### Step 6 — 檢查合併狀態

```bash
gh pr view <PR> --repo <REPO> --json reviewDecision,mergeable,statusCheckRollup
```

CI 全 pass 的判斷：
- `statusCheckRollup` **不為空**，且所有 item 的 `conclusion` 為 `SUCCESS`、`NEUTRAL` 或 `SKIPPED`（無任何 `FAILURE` / `TIMED_OUT` / `CANCELLED`）→ CI passed
- `statusCheckRollup` **為空陣列** → 搭配 Step 2 的判斷：若 `gh pr checks` 無任何項目（無 CI 設定），視為通過；若有項目但尚未回報結論，視為 pending，**重置 `PENDING_POLLS=0`、`SEEN_PENDING=false`**，回到「前置等待」（此路徑在 Step 5 等待期間 CI 被新 push 觸發、但 Step 6 查詢時尚未回報 conclusion 時可能出現）

- `reviewDecision: APPROVED` + CI 全 pass → **執行合併**（見下方合併步驟）
- `reviewDecision: null`（無需 review 的 repo）+ CI 全 pass → **通知使用者「此 repo 無需 reviewer 核准，即將自動合併」，隨即執行合併**
- 仍有 `CHANGES_REQUESTED` 或 CI failure → 本輪完成，`ROUND_COUNT += 1`，判斷是否繼續：
  - `ROUND_COUNT < loop` → 回到「前置等待」開始下一輪
  - `ROUND_COUNT >= loop` → **停止，執行「超過輪次停止」流程（見下方）**

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

## 超過 `loop` 輪停止

當有效輪次（`ROUND_COUNT`）達到 `loop` 上限，且 PR **仍未達到可合併狀態**時：

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

> ⚠️ **重要**：達到輪次上限後，**不可自行判斷合併**。即使認為所有建議都已處理，仍須等待使用者確認才能合併。

---

## 注意事項

- 每次 commit 前依 repo 規範執行測試與 lint（如 `bun test`、`npm test`、`pytest`、`go test` 等）
- 不可用 `--no-verify` 跳過 pre-commit hook
- 若 Bot 留言涉及安全問題（CRITICAL），立即修正，不可跳過
- PR 合併後確認相關下游分支已同步（依團隊分支策略）
