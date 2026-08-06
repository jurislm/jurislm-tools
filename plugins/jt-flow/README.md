# jt-flow

使用 OpenSpec、GitHub Flow、TDD 與 review gates 完整交付單一需求，或以相依關係
派送 active OpenSpec changes 並序列化整合。

## 安裝

```bash
claude plugin install jt-flow@jurislm-tools
```

## Entry Skills

- `jt-flow-one`：單一需求的端到端交付流程。
- `jt-flow-all`：從已更新 remote snapshot 建立 dependency map，於可用容量內派送
  whole `READY` changes，並以單一 lane 整合。

本 plugin 不提供 `/jt-flow` 或 `/jt-flow-all` slash commands；請以自然語言觸發對應 Skill。

`jt-flow-one` 以 proposal GO 作為唯一正常停頓點：明確呼叫先授權 issue 與 OpenSpec
準備；GO 後即授權實作、push、PR、review finding 處置、merge、部署驗收、issue
關閉與歸檔，不再逐項確認。只有證據無法排除的目標歧義、重大範圍／架構／依賴／
production 風險變更、secret 或敏感 payload、缺少權限或平台強制 approval、未揭露
的破壞性 production mutation，以及高風險 rollback 才暫停。`jt-flow-all` 沿用可
證實且已記錄的 proposal GO，不因 queue context 重複詢問。
一般意圖自動路由尚未取得 CodeRabbit consent 時，資料範圍揭露會併入 proposal
摘要並由同一次 GO 確認，不延後成 PR 前的第二個正常停頓點。

## Dependency-aware queue policy

`jt-flow-all` 不使用 caller 的 dirty 或 stale worktree：它以乾淨、已 fetch/prune
的 remote `main` snapshot 盤點 active changes 與 open Issues。每個 active change 都
是完整的 delivery unit，並由 proposal 的 Delivery Relations 記錄 `Priority`、hard
與 acceptance dependencies、external blockers（`dispatch` 或 `integration` gate）、
affected areas、production targets、以及 primary/related Issue mapping；coordinator
從這些資料推導 reverse blockers 與可安全並行的候選項目。

每次後續 dispatch 或 integration-permit decision 前都重讀 remote main；SHA drift
會使整份 dependency snapshot 失效，必須從 clean snapshot 重新盤點 active changes、
Delivery Relations、reverse edges、descendants 與 eligibility。已經 `ACTIVE` 或
`INTEGRATION_READY` 的 item 也可能被 refreshed graph 重新分類。

缺漏、矛盾、cycle 或不可驗證的關係資料只讓該 item `BLOCKED`，並記錄修正 owner、
resume condition 與 descendants；有效但未解的條件是 `WAITING`。無關 `READY` items
仍可繼續；hard、acceptance-only 與 mixed hard/acceptance cycle 都是 invalid／
`BLOCKED`，且不會只派送同一 change 的部分 tasks。primary agent 是 coordinator 並
保留一個 agent slot；每個其餘可用 slot 只能交給一個 `READY` change 的
`jt-flow-one` owner。coordinator／owner 必須先比對 exact change、proposal、Issue、
repository、scope 與 durable GO；mismatch 在任何 fetch 或 worktree mutation 前回傳
`AWAITING_GO`。只有 `READY` item 才能 fetch／record remote-main SHA 並建立 isolated
worktree；無 delegation capacity 時套用相同規則循序執行。

`jt-flow-one` 完成 implementation、required tests、implementation quality review、
PR checks、external-review disposition 與 current HEAD readback 後，才回傳
`INTEGRATION_READY`。coordinator 一次只可核發一張 exact-SHA permit，其中
repository、change、item HEAD SHA、refreshed main SHA、required-check set、各 check
的 terminal-success result、current mergeability result 與 evidence readback time 都
必須完全相符。coordinator 在 grant 與 merge／production mutation 前一刻都要重讀；
pending、failed、unknown、stale 或 non-mergeable evidence 一律 fail closed。item HEAD
漂移需刷新整合證據；main drift 另須重建 dependency snapshot，但都不單因此要求新的
proposal GO。

permit 只有在同時證明 no merge、no production mutation、no derived downstream
pipeline began 時才可撤銷。一旦 merge、production mutation 或 downstream pipeline
開始，lane 保持占用，直到 downstream CI／deployment verified healthy，或系統已回復
known rollback state；未知狀態不得發新 permit。

Dispatch 前的獨立 proposal overdesign review 只檢查 scope 與 MVP 適切性；
`jt-flow-one` 是 implementation quality review 的唯一 owner，`jt-flow-all` 不會
複製程式碼審查。外部 reviewer quota exhausted 時記錄 bounded skip 後繼續，不會永久
block item 或 queue。

`jt-flow-one` 執行一開始會偵測一次「團隊模式」（Agent Teams）是否可用：先判斷
是否為 `jt-flow-all` 委派的 nested 執行（有 → 不可用，Agent Teams 沒有 nested
team），否則同時檢查 `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` 且
`SendMessage`／`TaskCreate`／`TaskList` 三個 tool 可用。可用時，三工具研究與
code review 這兩處 2+ 平行角度派工，各自改為派一個具名 wrapper agent（`model:
sonnet`，tool allowlist 需含 `Workflow`，如 `general-purpose`；內部仍照舊
呼叫 Workflow tool，不拆解取代），可隨時 `SendMessage` 追加指示；不可用時
（Codex、未開旗標、nested 執行）完全不變。

## Dependencies

完整流程需要 OpenSpec repo-local `opsx:*` Skills、另行安裝的 `superpowers:*` Skills，
以及獨立安裝並登入的 CodeRabbit CLI。`coderabbit` 是 Claude Code 與 Codex 共用的
外部執行檔，不由任何 host plugin 提供。

只點名、呼叫或路由到 `jt-flow-all` 不構成 CodeRabbit consent。只有 durable evidence
證明使用者已看過完整 disclosure 並明確同意，才可傳
`codeRabbitAuthorization=preauthorized` 與
`authorizationSource=explicit-coderabbit-consent`；其餘情況一律傳
`codeRabbitAuthorization=requires-disclosure`，交由 `jt-flow-one` 把揭露併入同一次
proposal GO。明確呼叫 `jt-flow-one` 的直接授權契約仍以該 Skill 為準。
GitHub App 依既有 installation permissions 取用 review context，
CLI 以明確的 base／review type 選擇已掃描的本機 change set，但仍可能依 CodeRabbit
設定使用 code guidelines、learnings 或 codebase history；完整免重複確認規則、
預檢與安全邊界以各 Skill 內的「CodeRabbit 審查預先授權」為準。
預檢會掃描所有即將推送的新 commit／tree／blob，不只最終 aggregate diff；歷史中
曾出現的 secret 必須從將推送的 objects 清除並重新掃描。

CodeRabbit GitHub App 與 CodeRabbit CLI 是兩個獨立管道；任一管道 rate-limited
不代表另一管道不可用。兩者都適用於 Claude Code 與 Codex，但 GitHub App 與 CLI
合計最多一次有效 review；`.coderabbit.yaml` 停用 auto-review，由流程明確要求
一次 App review。只有該要求進入成功、失敗或受限終態且沒有真實 review，才能
改走 CLI fallback；任一管道成功產出後就停止 fallback。

Review 完成以每項 finding 已採納修正或記錄不採納理由為準，不要求 CodeRabbit
回傳零 finding。Copilot 每個 PR／變更最多一次 review。CodeRabbit 或 Copilot
finding 的修正與後續 push 都不得重新啟動外部 review。

本地 review 使用 `superpowers:requesting-code-review`：整個 PR／change 全程
最多 3 次，第一次在實作準備好時執行，之後每次 finding 修正變更程式碼最多
再 2 次；第 3 次跑完後即使仍有新 finding 也不再重跑，沒有程式碼變更也不得
重跑。`superpowers:receiving-code-review` 只負責核實 findings，不是額外的
review。GitHub Copilot 額度用完即略過；CodeRabbit GitHub App／PR bot 的唯一
要求進入終態且無法產出時轉 CodeRabbit CLI，CLI 無法產出時記錄限制並結束
CodeRabbit 管道。Codex 每個 PR／變更最多一次 review，純自動觸發、不主動
要求也不等待 Codex，也不套用 CodeRabbit 的授權規則，但依賴 Codex 帳號設定
「審查觸發條件＝開啟 PR」這個非 repo 內可驗證的人工前置確認；貼出來的
finding 一律照 `superpowers:receiving-code-review` 核實，不因多跑一次就
忽略內容。

## Version

版本由根目錄 Release Please 設定集中管理，不得在 plugin manifest 手動修改。
