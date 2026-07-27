# jt-flow

使用 OpenSpec、GitHub Flow、TDD 與 review gates 完整交付單一需求或依序處理 issue queue。

## 安裝

```bash
claude plugin install jt-flow@jurislm-tools
```

## Entry Skills

- `jt-flow-one`：單一需求的端到端交付流程。
- `jt-flow-all`：依 active OpenSpec changes 的既有順序逐項交付。

本 plugin 不提供 `/jt-flow` 或 `/jt-flow-all` slash commands；請以自然語言觸發對應 Skill。

`jt-flow-one` 以 proposal GO 作為唯一正常停頓點：明確呼叫先授權 issue 與 OpenSpec
準備；GO 後即授權實作、push、PR、review finding 處置、merge、部署驗收、issue
關閉與歸檔，不再逐項確認。只有證據無法排除的目標歧義、重大範圍／架構／依賴／
production 風險變更、secret 或敏感 payload、缺少權限或平台強制 approval、未揭露
的破壞性 production mutation，以及高風險 rollback 才暫停。`jt-flow-all` 沿用可
證實且已記錄的 proposal GO，不因 queue context 重複詢問。
一般意圖自動路由尚未取得 CodeRabbit consent 時，資料範圍揭露會併入 proposal
摘要並由同一次 GO 確認，不延後成 PR 前的第二個正常停頓點。

## Dependencies

完整流程需要 OpenSpec repo-local `opsx:*` Skills、另行安裝的 `superpowers:*` Skills，
以及獨立安裝並登入的 CodeRabbit CLI。`coderabbit` 是 Claude Code 與 Codex 共用的
外部執行檔，不由任何 host plugin 提供。

明確點名／呼叫任一 Entry Skill，也代表使用者預先授權在該次流程指定的
repository 範圍內使用 CodeRabbit GitHub App，以及
CodeRabbit CLI 備援；僅由一般意圖自動路由
不構成預先授權。GitHub App 依既有 installation permissions 取用 review context，
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

本地 review 使用 `superpowers:requesting-code-review`：每批程式碼變更最多一次，
finding 修正造成新一批程式碼變更時可再 review 一次；沒有程式碼變更不得重跑。
`superpowers:receiving-code-review` 只負責核實 findings，不是額外的 review。
GitHub Copilot 額度用完即略過；CodeRabbit GitHub App／PR bot 的唯一要求進入
終態且無法產出時轉 CodeRabbit CLI，CLI 無法產出時記錄限制並結束 CodeRabbit
管道。

## Version

版本由根目錄 Release Please 設定集中管理，不得在 plugin manifest 手動修改。
