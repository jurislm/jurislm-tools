---
name: pr-review-loop
version: 1.0.0
description: PR 開啟後自動輪詢 CI 狀態與 Bot Code Review feedback，分析合理建議並修正，達到指定輪次上限後停止，通過後自動合併。當使用者說「幫我看 PR review」、「等 CI 通過」、「自動處理 PR feedback」、「loop PR」時觸發。
argument-hint: "[time=3m] [loop=5] [repo=current] [pr=current]"
---

# PR Review Loop

PR 開啟後，自動輪詢 CI 與 Bot Code Review，分析 feedback 並修正，通過後合併。

---

## 執行參數

| 參數 | 預設值 | 說明 |
|------|--------|------|
| `time` | `3m` | 每輪之間的等待時間 |
| `loop` | `5` | 最大輪次，超過則停止並通知使用者 |
| `repo` | 當下 repo | `gh repo view --json nameWithOwner` 偵測 |
| `pr` | 當下 branch 的 PR | `gh pr view --json number` 偵測 |

---

## 每輪執行流程

Loop 開始前初始化一次（不在每輪重置）：

```bash
LAST_PUSH_TIME=""  # 每次 push 後更新，作為 feedback 篩選基準
```

每輪開始時記錄當前時間戳（第一輪 fallback 用）：

```bash
ROUND_START=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
```

### Step 1 — 優先：檢查 Merge Conflict

```bash
gh pr view <PR> --repo <REPO> --json mergeable,mergeStateStatus,baseRefName
```

- `CONFLICTING` → **立即解決衝突**（見下方衝突處理），commit + push，才繼續
- `BLOCKED` / `UNKNOWN` → 等待 CI，繼續
- `MERGEABLE` → 繼續

> ⚠️ 衝突必須優先處理。衝突未解決時 CI 可能無法觸發，Bot 也無法完整 review。

### Step 2 — 檢查 CI 狀態

```bash
gh pr checks <PR> --repo <REPO>
```

- 全部 pass → 繼續 Step 3
- 有 failure → 閱讀錯誤，分析並修正，commit + push
- 仍有 pending / in_progress → **跳過 Step 3 & Step 4，直接進入 Step 5 等待**（此輪不計入 `loop` 上限，避免 CI 執行時間過長耗盡輪次）
- 無任何 check 項目（repo 未設定 CI）→ 記錄為「無 CI 設定」，繼續 Step 3

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

### Step 5 — 等待 `time` 分鐘（讓 Bot 完成 re-review）

每輪結束時等待 `time`，讓 CI 執行完畢或 Claude Bot 完成 re-review（若本輪有 push，等待 Bot 重新 review；若本輪無修改，等待 CI 狀態更新）。

> Copilot 是否重新 review 取決於是否已啟用「Review new pushes」（見 Step 3 說明）。

### Step 6 — 檢查合併狀態

```bash
gh pr view <PR> --repo <REPO> --json reviewDecision,mergeable,statusCheckRollup
```

CI 全 pass 的判斷：
- `statusCheckRollup` **不為空**，且所有 item 的 `conclusion` 為 `SUCCESS`、`NEUTRAL` 或 `SKIPPED`（無任何 `FAILURE` / `TIMED_OUT` / `CANCELLED`）→ CI passed
- `statusCheckRollup` **為空陣列** → 搭配 Step 2 的判斷：若 `gh pr checks` 無任何項目（無 CI 設定），視為通過；若有項目但尚未回報結論，視為 pending，進入下一輪等待
- 仍有 `PENDING` / `IN_PROGRESS` → 進入下一輪（Step 2 已攔截，不應到達此處）

- `reviewDecision: APPROVED` + CI 全 pass → **執行合併**（見下方合併步驟）
- `reviewDecision: null`（無需 review 的 repo）+ CI 全 pass → **通知使用者「此 repo 無需 reviewer 核准，即將自動合併」，隨即執行合併**
- 仍有 `CHANGES_REQUESTED` 或 CI pending/failure → 進入下一輪

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

若達到最大輪次（`loop` 參數，預設 5）後 Bot 仍未核准：

1. 停止所有自動操作
2. 通知使用者：

```
⚠️ PR #<PR> 已達最大輪次（<loop> 輪）仍未獲得核准。
停止原因可能為：
- Bot feedback 持續回覆 needs changes（請檢查未解決的建議）
- CI 持續失敗（請檢查 CI 錯誤原因）
- 涉及需要人工判斷的設計決策

請手動檢查並處理後再繼續。
```

---

## 注意事項

- 每次 commit 前依 repo 規範執行測試與 lint（如 `bun test`、`npm test`、`pytest`、`go test` 等）
- 不可用 `--no-verify` 跳過 pre-commit hook
- 若 Bot 留言涉及安全問題（CRITICAL），立即修正，不可跳過
- PR 合併後確認相關下游分支已同步（依團隊分支策略）
