---
name: pr-review-loop
version: 1.0.0
description: PR 開啟後自動輪詢 CI 狀態與 Bot Code Review feedback，分析合理建議並修正，最多 5 輪，通過後自動合併。當使用者說「幫我看 PR review」、「等 CI 通過」、「自動處理 PR feedback」、「loop PR」時觸發。
argument-hint: "[time=3m] [loop=5] [repo=current] [pr=current]"
---

# PR Review Loop

PR 開啟後，自動輪詢 CI 與 Bot Code Review，分析 feedback 並修正，通過後合併。

---

## 執行參數

| 參數 | 預設值 | 說明 |
|------|--------|------|
| `time` | `3m` | 每輪之間的等待時間 |
| `loop` | `5` | 最大輪次，超過則停止並通知 Terry |
| `repo` | 當下 repo | `gh repo view --json nameWithOwner` 偵測 |
| `pr` | 當下 branch 的 PR | `gh pr view --json number` 偵測 |

---

## 每輪執行流程

### Step 1 — 優先：檢查 Merge Conflict

```bash
gh pr view <PR> --json mergeable,mergeStateStatus
```

- `CONFLICTING` → **立即解決衝突**（見下方衝突處理），commit + push，才繼續
- `BLOCKED` / `UNKNOWN` → 等待 CI，繼續
- `MERGEABLE` → 繼續

> ⚠️ 衝突必須優先處理。衝突未解決時 CI 可能無法觸發，Bot 也無法完整 review。

### Step 2 — 檢查 CI 狀態

```bash
gh pr checks <PR>
```

- 全部 pass → 繼續 Step 3
- 有 failure → 閱讀錯誤，分析並修正，commit + push
- 未觸發 → 回到 Step 1 再確認是否有衝突

### Step 3 — 閱讀 Bot Feedback

```bash
gh pr view <PR> --repo <REPO> --comments
gh pr reviews <PR> --repo <REPO>
```

讀取來源：
- **GitHub Copilot** 的 code review 留言
- **Claude Bot** 的 code review 留言

> **第一輪必讀**；後續若有新留言才重讀。

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
```

### Step 5 — 等待 `time` 分鐘

等待 CI 重新跑、Bot 重新 review（依 `time` 參數，預設 3 分鐘）。

### Step 6 — 檢查合併狀態

```bash
gh pr view <PR> --json reviewDecision,mergeable
```

- `reviewDecision: APPROVED` + CI 全 pass → **執行合併**（見下方合併步驟）
- 仍有 `CHANGES_REQUESTED` 或 CI pending → 進入下一輪

---

## 衝突處理

```bash
# 1. 確認衝突範圍
git fetch origin
git diff HEAD...origin/main

# 2. rebase（優先）或 merge
git rebase origin/main
# 若有衝突：手動解決 → git add → git rebase --continue

# 3. push
git push --force-with-lease
```

> 使用 `--force-with-lease`（非 `--force`）確保不覆蓋他人的推送。

---

## 合併步驟

```bash
gh pr merge <PR> --squash --delete-branch
```

或依 repo 規範選擇 `--merge` / `--rebase`。

---

## 超過 5 輪停止

若第 5 輪結束後 Bot 仍未核准：

1. 停止所有自動操作
2. 通知 Terry Chen：

```
⚠️ PR #<PR> 已達最大輪次（5 輪）仍未獲得核准。
請手動檢查以下項目：
- 未解決的 Bot feedback
- CI 失敗原因
- 是否有需要人工判斷的設計決策
```

---

## 注意事項

- 每次 commit 前確認 `npm test` / `npm run lint` 通過（依 repo 規範）
- 不可用 `--no-verify` 跳過 pre-commit hook
- 若 Bot 留言涉及安全問題（CRITICAL），立即修正，不可跳過
- PR 合併後確認 develop branch 已同步
