---
name: engineering-delivery
description: >
  一件工程案件的端到端交付 coordinator：以 Linear issue 為需求來源，走完 N0 前提 →
  需求分析 → 設計 → worktree → TDD 實作 → 本地審查 → PR → 外部審查 → 合併 →
  驗收 → 結案。指向一個 Linear issue 並要求交付即為完整授權。
  Use when the user asks to 做完這個 Linear issue、把這個需求做完、
  deliver this issue end to end.
---

## 輸入

一個 Linear issue。issue 是需求、範圍與驗收標準的唯一來源，不另建平行規劃文件。

## 授權契約

使用者指向一個 Linear issue 並要求交付，即授權走完整條鏈至合併與驗收，不逐項確認。
只有下列四類會停下，對應 `blocked.kind`：

| kind | 什麼情況 |
|---|---|
| `ambiguity` | 依 issue、codebase 與現有證據仍無法排除的真實歧義 |
| `authorization` | 超出 issue 範圍的重大架構變更、新外部依賴、新 production 風險、平台強制人工核准 |
| `access_config` | 缺少必要 credential 或 permission；具名依賴未安裝或未登入 |
| `risk` | 不可逆或破壞性 production mutation；工作樹有他人未提交變更；rollback 目標不明或涉 migration |

其餘一律走封閉迴圈：遇阻 → 查證 → 分析根因 → 修正 → 繼續。終止條件是目標達成，
不是「問題已釐清」。紀律與判別法見 `using-jt-workflow`，本 Skill 不重述。

## 節點

| 節點 | 完成條件 | 出口 |
|---|---|---|
| N0 前提 | `delivery-preflight` 回 `ok` | `ok` → N1 ／ 否則直接回傳其終態 |
| N1 需求分析 | 範圍與驗收標準明確 | 明確 → N2 ／ 真實歧義 → `halted/ambiguity` |
| N2 設計 | 方案定案 | 定案 → N3 ／ 需重大架構變更或新依賴 → `halted/authorization` |
| N3 工作樹 | 在專屬 feature 分支且工作區乾淨 | 就緒 → N4 ／ 當前為預設分支 → 先建分支再進 N4 ／ 有他人未提交變更 → `halted/risk` ／ 沿用分支有 commit 但查無已合併 PR → `halted/risk` |
| N4 實作 | 測試綠＋行為性驗收通過 | 通過 → N5 ／ 非預期行為 → 除錯後回 N4 |
| N5 本地審查 | 品質＋資安＋資料三面過 | 過 → N6 ／ 有 finding → 回 N4 |
| N6 開 PR | PR 存在且帶 Linear identifier | 建立 → N7 ／ 掃出 secret → 回 N4 清除後重來 |
| N7 外部審查 | PR 的 check 已到終態，且 `external-review-gate` 回終態 | `ok` 且 `needsCodeChange` 為真 → **回 N4** ／ `ok` 且為假 → N8 ／ `not_applicable` → N8 ／ `halted` → 回傳 |
| N8 合併 | `merge-gate` 回 `ok` | `ok` → 合併 → N9 ／ `halted` 且 `recoverableByCode` 為真 → **回 N4** ／ `halted` 且為假 → 回傳 ／ `not_applicable` → 回傳 |
| N9 驗收 | `acceptance-readback` 回 `ok` | `ok` → N10 ／ `halted` 且 `recoverableByCode` 為真 → **回 N4** ／ `halted` 且為假 → 回傳 |
| N10 結案 | Linear 已留完整記錄 | → `awaiting_owner_acceptance` |

**N7 的前置：先等 check 到終態。** 進入外部審查前，先監看 PR 上的 check 直到全部到達
終態（有背景監看工具就用）。`check` 尚未回報完畢時不要進 `merge-gate`——那時的
`mergeStateStatus` 必然是 `BLOCKED`（required check 缺席），會被誤判成需要改碼而回到
N4，白跑一輪並多燒一次外部審查額度。

**回頭邊的收斂保護**：N7／N8／N9 回到 N4 時，同一 `(issue, branch, 節點)` 連續第三次
回頭即 `halted/ambiguity`，`needed` 寫明反覆失敗的具體症狀。此計數器與
`external-review-gate` 的重查上限互相獨立，不共用。

## 各節點細則

### N1 需求分析

讀 issue 的標題、描述、留言與驗收標準。**先做範圍探索再做精確搜尋**——一開始就用
自己想得到的關鍵字去搜，只會找到自己已經想到的東西。接著進
`superpowers:brainstorming`，依它的分類決定要問多少。

### N3 工作樹

先判斷是否已在 linked worktree：

```bash
[ "$(git rev-parse --git-dir)" != "$(git rev-parse --git-common-dir)" ] && echo linked
```

兩條路徑都要 `git fetch <remote> <defaultBranch>`，且**動任何東西之前先無條件檢查
工作區**：

```bash
git status --porcelain     # 有輸出就停下回報
```

沿用時落後就 rebase；新建時用 `git worktree add --no-track -b <branch> ...`，不加
`--no-track` 會讓 `git status` 一路報 ahead／behind 預設分支。分支名為 Linear
identifier 加簡短 slug。

⚠️ **`git log` 只能判斷有沒有 commit，不能判斷是否已合併**——squash merge 不會讓原始
commit 成為預設分支的祖先。是否已交付一律以該分支的 PR 狀態為準。

一次執行只擁有一個 feature worktree；要看其他分支內容用 `git show <branch>:<path>`。

### N4 實作

`superpowers:test-driven-development` 驅動 Red → Green → Refactor。非預期行為先
`superpowers:systematic-debugging`。段落完成後做行為性驗收，並用
`superpowers:verification-before-completion` 看到實際輸出才宣稱完成。

- **驗證指令一律取自目標 repo 自己宣告的定義**，不憑記憶拼工具子指令；查不到就先查。
- **commit 後覆核實際落入的檔案清單是否等於預期範圍**，差集當場處置並記入 `notes`。
- 與本次交付無關的新問題在 Linear 另開 issue，不在本 worktree 處理。

### N5 本地審查

`superpowers:requesting-code-review`，findings 依 `superpowers:receiving-code-review`
逐項核實。**橫向把關**：改動觸及使用者資料、憑證、外部輸入、權限時必須納入資安審查；
觸及 schema、migration、查詢時必須納入資料審查。觸及而未納入，本節點不算完成。

### N6 開 PR

push 前掃 `<remote>/<defaultBranch>..HEAD` 的**每一個 commit**，不只最終 aggregate
diff——secret 若在某個 commit 加入、後續 commit 刪除，aggregate diff 是乾淨的，但
push 仍會把那個 commit 推上去。發現即回 N4，從所有將推送的 commit 清除、處理憑證
輪替、重新掃描後才 push。PR 標題或內文帶 Linear identifier。

### N7–N9

分別調用 `external-review-gate`、`merge-gate`、`acceptance-readback`，依上表出口分流。
合併本身用 `superpowers:finishing-a-development-branch`。合併授權已包含在最初的交付
授權裡，gate 全綠即合併，不再詢問。

## 回傳

內部 Skill 回 internal result（`status`／`stage`／`payload`／`findings[]`／`blocked`／
`recoverableByCode`／`notes[]`）。本 coordinator 收到後補上案件層欄位，組成 envelope：

| 欄位 | 型別 | 必填 | 說明 |
|---|---|---|---|
| `status` | `ok` \| `halted` \| `not_applicable` \| `awaiting_owner_acceptance` | 是 | `awaiting_owner_acceptance` 只由 N10 產生 |
| `stage` | string | `halted` 時必填 | 節點代號 |
| `issue` | string \| null | 是（值可為 `null`） | Linear identifier。正常案件必須有值；只有 Release Please 版號 PR 允許 `null` |
| `branch` | string \| null | N3 之後必填 | N0–N2 尚未建立分支時為 `null` |
| `pr` | string \| null | 否 | 尚未開 PR 時為 `null` |
| `evidence[]` | `{ kind, ref, summary }` | 否 | `kind` ∈ `test` \| `runtime` \| `ci` \| `deploy` |
| `findings[]` | `{ source, severity, disposition }` | 否 | `severity` ∈ `critical` \| `high` \| `medium` \| `low`；`disposition` ∈ `fixed` \| `rejected`（附理由）\| `deferred`（附去向） |
| `blocked` | `{ kind, what, needed }` | `halted` 時必填 | `blocked.needed` 必須是給人看的下一步 |
| `notes[]` | string | 否 | 服務端限制、hook 造成的範圍外變動、未自動化的觀察 |

**內部 Skill 不填寫案件層欄位**（`issue`／`branch`／`pr`／`evidence[]`），那是本
coordinator 的責任。

**`findings[]` 只在處置完成後才回傳。** `disposition` 記錄的是已經發生的結果，不是待辦
清單，所以沒有 `pending` 這個值——一個關卡若還沒把 finding 處置完，它就還沒到終態，不會
把 `findings[]` 交出來。哪些 severity 只能是哪些 disposition，由發出 finding 的關卡自己
規定（外部審查見 `external-review-gate`）。

## 重跑

**重跑不是從頭再做一遍。**帶副作用的節點（N3 建分支、N6 開 PR、N8 合併）與案件記錄，
一律以 `(issue, branch, 節點)` 為冪等鍵：先讀該鍵既有的副作用——既有分支、既有 PR、既有
Linear 留言——存在且內容未變就跳過，不重建。N0–N2 沒有帶副作用的動作，冪等鍵在 N3 之後
才完整。無副作用的關卡（`delivery-preflight`、`merge-gate`）是純查證，天然可重跑。

完整的分層規則與案件記錄的去重標記見 `references/case-record.md`。

## 案件記錄

見 `references/case-record.md`。

## 合併後出現的版號 PR

Release Please 這類版號 PR 不對應任何 Linear issue，因此不會從 N0 進入本 graph。它由
目標 repo 自己 source-controlled 的 validator 處理；本流程對它只做一件事：**監看終態
後回報**。沒有自動合併就回報現況，讓 validator 重試，不要自己動手。目標 repo 沒有這種
validator 時同樣不自行合併，回報現況交由使用者決定。

## 不適用情境

瑣碎修改（單行 typo、單一檔案小修）流程從簡，但仍要在 feature 分支內動手。
