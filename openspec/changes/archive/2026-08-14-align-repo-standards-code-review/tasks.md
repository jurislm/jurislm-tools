## 1. Tracking and review contract

- [x] 1.1 Spectra-only tracking（Spectra-only change tracking）：讓本 repo 與 `repo-standards` 將 Spectra artifact 作為唯一變更追蹤紀錄，並以 `rg` 驗證不存在建立或依賴 GitHub Issue 的現行指示。
- [x] 1.2 Canonical PR review contract：讓 skill、command、checklist 與 references 指向 `CLAUDE.md`／`jt-flow-review-orchestration` 的 Skill-driven 審查流程，並以內容比對驗證不再把手動 `/code-review` 加 bot 視為標準。

## 2. Living documentation and validation

- [x] 2.1 Spectra-only change tracking：更新 `docs-and-standards` living specification 與 detail，使跨 repo 回填以 Delivery Relations 追蹤，並以 `spectra validate --changes align-repo-standards-code-review --strict` 驗證。
- [x] 2.2 Canonical PR review contract：更新 living documentation 的 review 契約與設定前置條件，並以 `spectra analyze align-repo-standards-code-review`、`npm run validate`、`claude plugin validate .` 與 `git diff --check` 驗證。

## 3. Review feedback corrections

- [x] 3.1 Spectra-only tracking and bootstrap：在 Skill、command、checklist 與 `docs-and-standards` delta 寫明未初始化 repo 先 `spectra init`，並以內容檢查驗證。
- [x] 3.2 Portable PR review contract：新增 packaged template，讓 Skill、command、checklist、CI／Copilot reference 都以目標 repo `CLAUDE.md` 為 canonical contract，並驗證不存在 source-only pointer。
- [x] 3.3 Remove GitHub Issue workflow surfaces — Explicit invocation authorizes Spectra preparation：移除 `jt-flow-one` 對 GitHub Issue external context 的流程，並以 authorization delta 與 policy test 驗證 Spectra artifacts 是唯一 current record。
- [x] 3.4 Proposal GO authorizes end-to-end delivery：將 `jt-flow-one` 的 GO、PR 與 archive 路徑改為不建立、引用或依賴 GitHub Issue，並以 authorization delta 與 policy test 驗證。
- [x] 3.5 Delegated items use the same checkpoint contract：讓 queue handoff 只傳 durable Spectra proposal GO evidence，不帶 GitHub Issue link，並以 authorization delta 驗證。
- [x] 3.6 Ordered queue delivery delegates to the single-request Skill：讓 `jt-flow-all` 只以 whole Spectra change dispatch，並以 queue delta 與 queue execution test 驗證。
- [x] 3.7 Active changes use Spectra delivery records before queueing：讓 queue eligibility 只讀 Spectra Delivery Relations，不讀或建立 GitHub Issue inventory，並以 queue delta 與 queue execution test 驗證。
- [x] 3.8 Per-item gates remain effective：讓 `AWAITING_GO` 與 `READY` 比對只綁定 change、proposal、repo、scope 與 durable evidence，並以 queue delta 驗證。
- [x] 3.9 Queue inventory uses refreshed remote truth：讓乾淨 remote snapshot 只建立 Spectra inventory，並以 queue delta 與 queue execution test 驗證。
- [x] 3.10 Proposals declare delivery relations：讓 queue relation metadata 不含 GitHub Issue mapping，並以 queue delta 驗證。
- [x] 3.11 全量驗證與 PR 處置：執行 strict validate、analyze、targeted test、`npm run validate`、`claude plugin validate .`、`git diff --check`；回覆並 resolve 每個已修正 review thread。
- [x] 3.12 Preserve dependency-cycle semantics：在 queue delta 保留 hard、acceptance-only 與 mixed cycle scenarios，確保移除 GitHub Issue mapping 不改變 cyclic graph 的 `BLOCKED` 結果。
- [x] 3.13 Align Proposal GO scope：將 `jt-flow` plugin、policy tests 與 living specifications 納入核准範圍與 Delivery Relations，移除不符實際變更的 exclusion。
- [x] 3.14 Normalize Spectra terminology：將 authorization、queue 與 task 的操作性變更追蹤術語統一為 Spectra，保留 `openspec/` 作為 artifact directory 名稱。
