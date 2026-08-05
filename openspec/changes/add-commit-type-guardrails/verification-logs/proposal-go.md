# Proposal GO record

| 欄位 | 值 |
| --- | --- |
| approval status | **APPROVED** |
| change identifier | `add-commit-type-guardrails` |
| proposal 路徑 | `openspec/changes/add-commit-type-guardrails/proposal.md` |
| issue identifier | #181 |
| 目標 repository | `jurislm/jurislm-tools`（remote `origin`，fetch/push URL 一致） |
| GO 日期 | 2026-08-05（台灣時間） |
| CodeRabbit review 授權 | 已具備，來源為使用者明確點名呼叫本 Skill |

## GO 證據

使用者於本次工作階段以 Skill picker 明確呼叫 `/jt-flow:jt-flow-one`（args `1, 2, 3, 4`），
其後在提案展示訊息的回覆中第一項即為 `go`。該回覆對應本 change 的最終 proposal 修訂版，
即依使用者三項指正修正後的版本：branch protection 納入範圍、改為單一真相來源設計、
`DRONE_PULL_REQUEST_TITLE` 由推定改為實證。

依 `jt-flow-one` 契約，明確點名呼叫本 Skill（非一般意圖自動路由）即涵蓋本次流程對本
repository 使用 CodeRabbit GitHub App 與 CLI 的資料範圍，無需另行揭露後補確認。

## 已核准範圍

依 `proposal.md` 的 What Changes 全部七項：

1. `scripts/commit-types.mjs` 單一定義，加上對 `release-please-config.json` 與 `CLAUDE.md`
   的一致性測試
2. `scripts/validate-pr-title.mjs`，接入 `validate` pipeline
3. `scripts/validate-squash-subject.mjs`，於 push `main` 時執行
4. `release-please-config.json` 移除 `perf`／`refactor`／`style`／`test`
5. `squash_merge_commit_title` 設為 `PR_TITLE`
6. `main` 啟用 branch protection，required context 為 `continuous-integration/drone/pr`
7. 補正 1.33.2 的 `CHANGELOG.md` 段落與 GitHub Release notes

Non-goals 一併核准，其中最重要者：不重發 1.33.2 版號、不擴充允許清單至 `ci`／`refactor`、
不要求 PR review approvals、不將 CodeRabbit 設為 required context。

## ⚠️ 執行順序調整（GO 之後、實作之前）

使用者在同一則訊息追加「全部改用 bun」，構成一個獨立的新需求——jurislm-tools 目前為
npm + Node.js 工具鏈（證據見 `2026-08-05-pre-proposal-inventory.md` 第 4 節、
`package.json` 的 `engines` 欄位、`package-lock.json`）。

協調決定：**bun 遷移先行，本 change 後行**。理由是返工量。本 change 需新增三個 script 與
對應測試，而測試必然以當時的測試 runner 撰寫；若先於 bun 遷移完成，遷移時需重寫全部測試
（`node:test` 與 `bun:test` 的 import 路徑與斷言 API 不同）。兩者亦同時修改 `.drone.yml`，
並行會產生衝突。

此調整不改變本 change 的已核准範圍，僅改變執行時機。本 change 的 worktree 將於 bun 遷移
合併後，基於更新的 `origin/main` 建立。

bun 遷移本身依 `jt-flow-one` 流程另建 issue 與 proposal，並需取得其自身的 GO；本檔案不涵蓋
該 change。
