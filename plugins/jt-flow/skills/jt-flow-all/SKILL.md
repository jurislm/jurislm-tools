---
name: jt-flow-all
description: >
  Use when the user wants to deliver every active OpenSpec change in sequence,
  work through the current OpenSpec change queue, or asks to "按照 OpenSpec
  changes 順序做完" or "依序處理全部 changes".
---

## Input

將使用者指定的目標 repo（未指定則使用目前所在 repo）與其中 active
`openspec/changes/` 作為輸入。`archive/`、隱藏項目及非 change 檔案不納入佇列。

**單一 change 不需要排隊**：若只有一個 active change，要直接使用同一 plugin 的
`jt-flow-one` Skill。

## CodeRabbit 授權承接

只有使用者明確點名／呼叫 `jt-flow-all`（包含 Skill picker、
`$jt-flow:jt-flow-all` 或文字指名）時，才可將該次目標 repository 的
CodeRabbit 授權 context 沿用到各 queue item 的 `jt-flow-one` 流程。此授權涵蓋：GitHub App
可能依既有 installation permissions 讀取待審 diff 以外的 repository 內容；以及
CodeRabbit CLI 在本機安全預檢後，將即將推送的 commit range 與明示 config 交給服務。
CLI 服務端仍可能使用 repository guidelines、learnings 或 history。

明確點名／呼叫本 Skill 即代表接受上述範圍，使用同一個 `preauthorized` consent
狀態沿用到各 item。若本 Skill 僅由一般意圖自動路由，必須在目前 item 依
`jt-flow-one` 把 CodeRabbit disclosure 納入 proposal 摘要，並以同一次 proposal
GO 取得 consent。不得把 consent 延後成 GO 後另一個正常停頓點；內部沿用 Skill
本身不是使用者同意，不得用來略過這個 gate。

## Phase 1 — 讀取 OpenSpec changes 既有順序

1. 確認目標 repository、GitHub remote 與 OpenSpec 已安裝。
2. 只讀取 active `openspec/changes/`，依該 repository 已記錄的既有順序建立 queue。
   目錄名稱已有序號或其他排序慣例時原樣沿用；**不得重新排序**或重新編號，也不得依
   issue 嚴重度、影響、急迫性、依賴或工作量改變順序。
3. 不掃描完整 GitHub issue backlog。只在處理當前 change 時，從該 change artifacts
   讀取已記錄的 tracking issue；缺少或不一致時交由該 item 的 `jt-flow-one` 流程依其
   approval gate 處理。
4. 開始前簡短列出將依序處理的 active changes，作為執行紀錄；這不是重新排序或新增
   queue GO gate。若使用者已要求執行，列出後直接進入第一項。

## Phase 2 — 由同一主代理逐項執行

依 OpenSpec changes 既有順序處理每個 queue item：

1. 由目前主代理在同一 task context 中載入並遵循 `jt-flow-one`，帶入該 item 的
   change identifier、proposal 路徑、該 change 已記錄的 issue identifier
   （如有）、目標 `<owner>/<repo>`、已核准範圍、proposal GO evidence
   （`verification-logs/proposal-go.md` 的路徑與對應 approval record）、
   OpenSpec 既有順序 context，以及 `codeRabbitAuthorization`
   context：只有明確呼叫 `jt-flow-all` 時才傳入 `preauthorized` 與
   `authorizationSource=explicit-jt-flow-all`；其他情況一律傳入
   `requires-disclosure`。不得建立或安排子代理處理 queue item，也不得只要求使用者
   自行改呼叫 `jt-flow-one`。
2. 各 item 的交付程序與 approval gates 全部以 `jt-flow-one` 為準，本 Skill 不重述。
   依既有順序開始 queue 不取代尚未取得的 per-item GO；只有
   `verification-logs/proposal-go.md` 內已記錄的明確 proposal GO evidence 之
   change identifier、proposal 路徑、目標 `<owner>/<repo>` 與核准範圍全部
   符合目前 item 時，才沿用該 GO，不得只因進入 queue 而重複詢問。任一欄不符或
   無法證實時，必須為目前 item 取得 GO；GO 後直接依 `jt-flow-one` 的 bounded
   例外契約執行到終態。
3. 每個 item 記錄為 `success`、`paused`、`blocked`、`failed` 或 `cancelled`。
   `paused` 不是終態，queue 必須停在該 item；`blocked`、`failed` 與 `cancelled`
   也停止 queue 並回報狀態，等待使用者決定是否繼續。
4. 已完成的 item 必須以 `success` 與 `jt-flow-one` 的驗證證據表示。僅在目前 item
   成功完成後，才依既有順序進入下一個 item；不得平行處理。

佇列清空後，回報每個 item 的終態與任何待決阻塞項目。

## Non-goals

- 不重複 `jt-flow-one` 的單一需求交付流程或其安全／審查規則。
- 不掃描完整 GitHub issue backlog、不做 issue triage、不重新排序 OpenSpec changes。
- 不為 queue item 建立子代理。
- 不建立 host-specific 的 Skill 呼叫 API。
- 不因 queue 已開始而繞過尚未完成的 individual change proposal GO，也不讓已記錄
  的明確 proposal GO 因 queue context 無故失效。
