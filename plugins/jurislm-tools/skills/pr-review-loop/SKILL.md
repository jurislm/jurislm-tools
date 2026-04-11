---
name: pr-review-loop
description: PR 開啟後使用 Monitor tool 即時監控 CI，自動讀取 Bot Code Review feedback 並修正，通過後合併。當使用者說「幫我看 PR review」、「等 CI 通過」、「自動處理 PR feedback」、「loop PR」時觸發。
argument-hint: "[loop=5] [timeout=60] [repo=current] [pr=current]"
---

# PR Review Loop

PR 開啟後，使用 Monitor tool 即時監控 CI，讀取 Bot feedback 並修正，通過後合併。

---

## 前置需求

- Claude Code **v2.1.98+**（需支援 Monitor tool）
- gh CLI **2.x 近期版本**（需支援 `gh pr checks --watch`）；執行前可用 `gh pr checks --help | grep watch` 確認。若不支援，**立即停止**並通知使用者升級 gh CLI，不可繼續執行（步驟一會靜默失敗）

---

## 執行參數

| 參數 | 預設值 | 說明 |
|------|--------|------|
| `loop` | `5` | 最大修正輪次，超過則停止並通知使用者 |
| `timeout` | `60` | Monitor 等待 CI 的最大時間（分鐘）；大型 E2E 測試等長時間 CI 應調高此值 |
| `repo` | 當下 repo | `gh repo view --json nameWithOwner` 偵測 |
| `pr` | 當下 branch 的 PR | `gh pr view --json number` 偵測 |

---

## 搭配 `/loop` 使用

本 skill 有兩種執行模式：

| 模式 | 指令 | 行為 |
|------|------|------|
| **直接執行** | `/jt:pr-review` | Claude 在單次 session 中同步執行所有輪次，狀態保留在工作記憶 |
| **外部 loop** | `/loop /jt:pr-review` | `/loop` 管理迭代，每個 tick 重新執行本 skill 一輪 |

無論哪種模式，skill 內部都以 Monitor tool 等待 CI 事件（Monitor 即 `/loop` 動態排程的核心機制），不靠靜態 polling。

> **提示**：需要在輪次間釋放 context、或希望長時間掛在背景監控時，使用 `/loop /jt:pr-review`；需要一次性處理 PR 並明確控制輪次上限時，直接執行 `/jt:pr-review loop=N`。
>
> **`/loop` 模式的狀態生命週期**：`ROUND_COUNT`、`CI_RAN`、`LAST_PUSH_TIME` 等狀態變數僅存於當次工作記憶，**不跨 tick 保留**。因此 `loop=N` 參數在 `/loop` 模式下無效（每個 tick 均重新初始化 `ROUND_COUNT = 0`）；`loop` 參數只對直接執行模式有作用。

---

## 初始化（Loop 開始前執行一次）

```
ROUND_COUNT = 0            # 計數修正輪次
MAX_ROUNDS = <loop 參數值，預設 5>
MAX_WAIT_MINUTES = <timeout 參數值，預設 60>
LAST_PUSH_TIME = $(date -u +%Y-%m-%dT%H:%M:%SZ)  # skill 啟動時間為初始值；每次 push 後更新
CI_RAN = false             # 本輪是否實際執行過 CI checks
BRANCH = ""                # 從前置檢查取得 headRefName 後賦值
```

---

## 前置檢查（每輪開始前）

確認 PR 狀態、取得 branch 名稱、並檢查合併衝突（單次 API 呼叫）：

```bash
gh pr view <PR> --repo <REPO> --json state,number,headRefName,mergeable
```

- `state: OPEN` → 繼續；取得 `headRefName` 存為 `BRANCH`
- `state: MERGED` / `CLOSED` → 停止，通知使用者 PR 已關閉

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

Monitor 以**背景任務**方式執行，將每行輸出作為事件串流回 Claude；Claude 可在事件到達時繼續處理其他邏輯（如超時判斷）。所有 checks 完成後 Monitor 自動退出，Claude 收到結束通知。

> **超時保護**：若 Monitor 已執行超過 `MAX_WAIT_MINUTES` 分鐘仍未完成，使用 `TaskStop` tool 中斷任務，然後執行「CI 等待超時」通知（見下方）。Monitor 啟動時會回傳 8 字元的 task ID（如 `bncmjylb5`），將此 ID 傳入 `TaskStop` 的 `id` 參數即可中斷。

**根據輸出結果：**

| 結果 | 做法 |
|------|------|
| 全部 pass（exit 0） | 進入步驟二 |
| 有 failure（exit 非 0） | 進入「CI failure 修正」（見下方） |
| Monitor 啟動後 **90 秒**內無任何輸出（`CI_RAN = true`） | CI 未觸發，執行「CI 等待超時」情境 B（見下方）；若確認 CI 已觸發只是 runner 冷啟動較慢，可直接重新執行 skill |
| Monitor 本身失敗（gh CLI 錯誤、網路問題） | 等待 30 秒後重試一次；仍失敗則停止並通知使用者 |

> **exit code 語義**：`gh pr checks --watch` 在所有 check 狀態為 `pass`、`SKIPPED` 或 `NEUTRAL` 時 exit 0；只要有任一 check 為 `failure` 或 `error` 即 exit 非 0。`SKIPPED`/`NEUTRAL` 視為通過，不觸發 CI failure 修正。

> **注意**：push 後需等待約 30 秒，GitHub 才會為新 commit 建立 checks，再呼叫 Monitor。

**CI failure 修正**：

1. 從 Monitor 輸出讀取失敗的 check 名稱作為參考
2. 用當前 commit SHA 精確鎖定失敗的 workflow run（避免 check 名稱與 workflow 名稱格式不符的問題）：

   ```bash
   HEAD_SHA=$(gh pr view <PR> --repo <REPO> --json headRefOid --jq '.headRefOid')
   gh run list --repo <REPO> --branch <BRANCH> --limit 10 \
     --json databaseId,name,headSha,conclusion \
     | jq --arg sha "$HEAD_SHA" '[.[] | select(.headSha == $sha and .conclusion == "failure")]'
   ```

   取第一筆的 `databaseId` 作為 `<run-id>`。（若同一 commit 有多個 failed workflow，先修第一筆；相關失敗通常在根本原因修復後一起消失。若下一輪 CI 仍有失敗，再重複此流程。）

3. 取得詳細日誌：

   ```bash
   gh run view <run-id> --log-failed --repo <REPO>
   ```

4. 分析根本原因，修正後 commit + push；更新 `LAST_PUSH_TIME`
5. **等待 30 秒**（讓 GitHub 為新 commit 建立 checks），然後**回到前置檢查**（重新確認 PR 狀態與 merge 衝突），再進入步驟一

---

### 步驟二：讀取 Bot Feedback

Bot review（如 `claude-review`）以 CI check 形式執行；步驟一 Monitor 等待所有 checks 完成時已包含 bot review check。Monitor exit 0 後，等待 **10–15 秒**（GitHub webhook 傳播延遲），再讀取 feedback：

```bash
gh pr view <PR> --repo <REPO> --json comments,reviews
```

讀取來源：
- **GitHub Copilot** → `reviews` 欄位（formal review，含 `APPROVED` / `CHANGES_REQUESTED` 狀態）
- **Claude Bot / CodeRabbit** → `comments` 欄位（inline 留言）

篩選方式：只處理 `createdAt` 晚於 `LAST_PUSH_TIME` 的新留言（`LAST_PUSH_TIME` 初始值為 skill 啟動時間，確保第一輪不會讀入歷史舊留言）。

> **注意（GitHub Copilot）**：Copilot 預設每個 PR 只 review 一次。第二輪後不會有新的 Copilot `reviews` feedback；若 `reviews` 為空，視為無新 review，不影響合併判斷。若需每次 push 都觸發 Copilot 重新 review，需 GitHub Team 方案並在 Ruleset 啟用「Review new pushes」。

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
| `CHANGES_REQUESTED` 或有需修正的 Bot feedback | 根據 feedback 判斷（見下方）；修正後 commit + push，更新 `LAST_PUSH_TIME`；**等待 30 秒**（讓 GitHub 建立新 checks）；`ROUND_COUNT += 1`；若 `ROUND_COUNT < MAX_ROUNDS` → **回到前置檢查**（重新確認 PR 狀態與 merge 衝突），再進入步驟一；否則 → **停止，執行「超過輪次停止」** |

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

# 4. push（--force-with-lease 確保不覆蓋遠端其他人的 push；若 lease 失敗代表有人在你之後 push，需先 pull 再處理）
git push --force-with-lease
```

---

## 合併步驟

執行前確認 PR title 符合專案 commit message 規範（如 `feat: xxx` / `fix: xxx`）；squash merge 預設以 PR title 作為 commit message，title 格式直接影響 Release Please 版本 bump。

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

**push 後 CI 未觸發**（步驟一 `gh pr checks` 確認有 check 項目（`CI_RAN = true`），但 Monitor 啟動後 **90 秒**內未收到任何輸出，視為 CI 未觸發）：

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
