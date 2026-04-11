---
name: pr-review-loop
version: 2.0.0
description: PR 開啟後使用 Monitor tool 即時監控 CI，自動讀取 Bot Code Review feedback 並修正，通過後合併。當使用者說「幫我看 PR review」、「等 CI 通過」、「自動處理 PR feedback」、「loop PR」時觸發。
argument-hint: "[loop=5] [timeout=60] [repo=current] [pr=current]"
---

# PR Review Loop

PR 開啟後，使用 Monitor tool 即時監控 CI，讀取 Bot feedback 並修正，通過後合併。

---

## 前置需求

- Claude Code **v2.1.98+**（需支援 Monitor tool）
- gh CLI **2.x 近期版本**（需支援 `gh pr checks --watch`）；執行前可用 `gh pr checks --help | grep watch` 確認

---

## 執行參數

| 參數 | 預設值 | 說明 |
|------|--------|------|
| `loop` | `5` | 最大修正輪次，超過則停止並通知使用者 |
| `timeout` | `60` | Monitor 等待 CI 的最大時間（分鐘）；大型 E2E 測試等長時間 CI 應調高此值 |
| `repo` | 當下 repo | `gh repo view --json nameWithOwner` 偵測 |
| `pr` | 當下 branch 的 PR | `gh pr view --json number` 偵測 |

---

## 初始化（Loop 開始前執行一次）

```
ROUND_COUNT = 0            # 計數修正輪次
MAX_ROUNDS = <loop 參數值，預設 5>
MAX_WAIT_MINUTES = <timeout 參數值，預設 60>
LAST_PUSH_TIME = ""        # 每次 push 後更新，作為 feedback 篩選基準
CI_RAN = false             # 本輪是否實際執行過 CI checks
BRANCH = <從 gh pr view 取得當前 PR 的 headRefName>
```

---

## 前置檢查（每輪開始前）

確認 PR 存在且為開啟狀態：

```bash
gh pr view <PR> --repo <REPO> --json state,number,headRefName
```

- `state: OPEN` → 繼續；同時取得 `headRefName` 存為 `BRANCH`
- `state: MERGED` / `CLOSED` → 停止，通知使用者 PR 已關閉

檢查是否有合併衝突：

```bash
gh pr view <PR> --repo <REPO> --json mergeable
```

若 `CONFLICTING` → 立即執行「衝突處理」（見下方），commit + push，更新 `LAST_PUSH_TIME`；衝突解決後重新執行 `gh pr view --json mergeable` 確認 `CONFLICTING` 已清除。若仍為 `CONFLICTING`，停止並通知使用者手動介入。確認清除後繼續執行步驟一（Monitor CI）。

---

## 每輪執行流程

**一輪的定義**：CI 通過（或無 CI）+ 讀取 Bot feedback + 修正或確認跳過 = 一輪（`ROUND_COUNT += 1`）。

---

### 步驟一：Monitor CI

設定 `CI_RAN = false`。

先查是否有 CI checks 設定：

```bash
gh pr checks <PR> --repo <REPO>
```

**若無任何 check 項目**（命令回傳空或 `no checks reported`）：
- 跳過 Monitor，直接進入步驟二（`CI_RAN` 維持 `false`）

**若有 check 項目**：設定 `CI_RAN = true`，使用 Monitor tool 執行以下命令，**即時串流 CI 狀態**：

```bash
gh pr checks <PR> --repo <REPO> --watch
```

Monitor 會阻塞直到所有 checks 完成，將每行輸出串流回 Claude。

> **超時保護**：若 Monitor 已執行超過 `MAX_WAIT_MINUTES` 分鐘仍未完成，立即中斷並執行「CI 等待超時」通知（見下方）。

**根據輸出結果：**

| 結果 | 做法 |
|------|------|
| 全部 pass（exit 0） | 進入步驟二 |
| 有 failure（exit 非 0） | 進入「CI failure 修正」（見下方） |
| Monitor 本身失敗（gh CLI 錯誤、網路問題） | 等待 30 秒後重試一次；仍失敗則停止並通知使用者 |

> **注意**：push 後需等待約 30 秒，GitHub 才會為新 commit 建立 checks，再呼叫 Monitor。

**CI failure 修正**：

1. 從 Monitor 輸出讀取失敗的 check 名稱 `<CHECK_NAME>`
2. 查出對應的 failing workflow run id（加上 `--branch` 過濾確保精確）：

   ```bash
   gh run list --repo <REPO> --branch <BRANCH> --limit 10 --json databaseId,name,status,conclusion
   ```

   依 `<CHECK_NAME>` 篩選 `conclusion == "failure"` 的最新一筆，取其 `databaseId` 作為 `<run-id>`。

3. 取得詳細日誌：

   ```bash
   gh run view <run-id> --log-failed --repo <REPO>
   ```

4. 分析根本原因，修正後 commit + push；更新 `LAST_PUSH_TIME`
5. 等待 30 秒後重新執行步驟一（Monitor CI）

---

### 步驟二：讀取 Bot Feedback

**僅當 `CI_RAN = true` 時**，等待 30 秒讓 Bot 完成 review（CodeRabbit、GitHub Copilot 等可能有延遲）。若 `CI_RAN = false`（無 CI），直接讀取，不需等待。

```bash
gh pr view <PR> --repo <REPO> --json comments,reviews
```

讀取來源：
- **GitHub Copilot** → `reviews` 欄位（formal review，含 `APPROVED` / `CHANGES_REQUESTED` 狀態）
- **Claude Bot / CodeRabbit** → `comments` 欄位（inline 留言）

篩選方式：只處理 `createdAt` 晚於 `LAST_PUSH_TIME` 的新留言。第一輪尚無 push 記錄時，讀取所有留言。

---

### 步驟三：修正或合併

查詢合併狀態：

```bash
gh pr view <PR> --repo <REPO> --json reviewDecision,statusCheckRollup
```

**CI 全 pass 的判斷**：
- 若 `CI_RAN = true`：步驟一 Monitor 完成且 exit 0 即視為通過
- 若 `CI_RAN = false`（無 CI 設定）：`statusCheckRollup` 為空，視為通過

| 狀態 | 做法 |
|------|------|
| `reviewDecision: APPROVED` + CI 全 pass | **執行合併**（見「合併步驟」） |
| `reviewDecision: null`（無需 reviewer 核准）+ CI 全 pass | 通知使用者「此 repo 無需 reviewer 核准，即將自動合併」，隨即**執行合併** |
| `CHANGES_REQUESTED` 或有需修正的 Bot feedback | 根據 feedback 判斷（見下方）；`ROUND_COUNT += 1`；若 `ROUND_COUNT < MAX_ROUNDS` → 回到步驟一；否則 → **停止，執行「超過輪次停止」** |

**Feedback 判斷原則（不盲目接受）**：

| 情況 | 做法 |
|------|------|
| 建議合理（bug、安全問題、明確錯誤） | 修正，commit + push，更新 `LAST_PUSH_TIME`；本輪計入 `ROUND_COUNT` 後進入下一輪 |
| 建議合理但屬風格偏好 | 評估是否符合專案規範，再決定是否修正 |
| 建議不合理（誤解需求、過度工程化） | 跳過；可在 PR 留言說明原因；**無論是否修正，本輪均計入 `ROUND_COUNT`**；若無其他阻擋項，直接嘗試合併 |

> **重要**：即使決定跳過所有 feedback，`ROUND_COUNT` 仍必須累加，避免同一輪 feedback 被無限重新處理。若所有 feedback 已處理或跳過，且 CI 通過，應嘗試合併而非繼續迴圈。

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

---

## 合併步驟

```bash
gh pr merge <PR> --repo <REPO> --squash --delete-branch
```

或依 repo 規範選擇 `--merge` / `--rebase`。

---

## CI 等待超時

當 Monitor 執行超過 `MAX_WAIT_MINUTES` 分鐘仍未完成時：

1. **立即中斷 Monitor，停止所有自動操作**
2. 取得 PR 作者：

```bash
PR_AUTHOR=$(gh pr view <PR> --repo <REPO> --json author --jq '.author.login')
```

3. 通知使用者（依實際狀況選擇描述）：

**CI 已觸發但長時間未完成**（Monitor 啟動時 checks 存在，但超過 `MAX_WAIT_MINUTES` 仍 in_progress）：

```
⚠️ PR #<PR> 的 CI 已持續超過 <MAX_WAIT_MINUTES> 分鐘未完成，可能為 Runner 故障或 workflow 超時，已停止等待。

請 @<PR_AUTHOR> 手動檢查：
- GitHub Actions Runner 是否正常運行
- CI workflow 是否有超時或設定問題
- 若 CI 確實需要更長時間，可用 timeout 參數調高等待上限後重新觸發

確認後請手動重跑 CI 或調整後重新觸發。
```

**push 後 CI 未觸發**（步驟一查到 checks 存在，但 Monitor 立即返回空輸出且 CI 仍未出現）：

```
⚠️ PR #<PR> 在 push 後，CI 長時間未重新觸發，可能為 workflow trigger 設定問題。

請 @<PR_AUTHOR> 手動檢查：
- GitHub Actions trigger 設定是否正確（on.push, on.pull_request）
- 是否有 branch filter 導致 workflow 未觸發

確認後請手動重跑 CI 或調整 trigger 設定後重新推送。
```

---

## 超過輪次停止

當 `ROUND_COUNT >= MAX_ROUNDS`，且 PR 仍未達到可合併狀態時：

1. **立即停止所有自動操作，不執行合併**
2. 取得 PR 作者：

```bash
PR_AUTHOR=$(gh pr view <PR> --repo <REPO> --json author --jq '.author.login')
```

3. 通知使用者介入：

```
⚠️ PR #<PR> 已達最大修正輪次（<MAX_ROUNDS> 輪）仍未獲得核准，已停止自動處理。

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
