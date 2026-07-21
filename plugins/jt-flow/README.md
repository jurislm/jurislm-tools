# jt-flow

使用 OpenSpec、GitHub Flow、TDD 與 review gates 完整交付單一需求或依序處理 issue queue。

## 安裝

```bash
claude plugin install jt-flow@jurislm-tools
```

## Entry Skills

- `jt-flow`：單一需求的端到端交付流程。
- `jt-flow-all`：盤點、排序並依序交付多個 issues。

本 plugin 不提供 `/jt-flow` 或 `/jt-flow-all` slash commands；請以自然語言觸發對應 Skill。

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

CodeRabbit GitHub App 與 CodeRabbit CLI 是兩個獨立管道；任一管道 rate-limited
不代表另一管道不可用。兩者都適用於 Claude Code 與 Codex。

Review 完成以每項 finding 已採納修正或記錄不採納理由為準，不要求 CodeRabbit
回傳零 finding。需要覆核修正後 HEAD 時，CLI 最多自動執行第二輪；不得為追求
零 finding 無上限重跑，除非使用者明確要求。

Review 順序固定為：先以 `superpowers:requesting-code-review` 自查並執行
`/code-review`；GitHub Copilot 額度用完即略過；CodeRabbit GitHub App／PR bot
額度或 rate limit 用完即轉 CodeRabbit CLI；CLI 額度或 rate limit 用完即停止等待、
記錄限制並結束 CodeRabbit 管道。Superpower 首輪已完成，不因 CLI 受限而重跑。

## Version

版本由根目錄 Release Please 設定集中管理，不得在 plugin manifest 手動修改。
