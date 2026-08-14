## 1. Tracking and review contract

- [x] 1.1 Spectra-only tracking（Spectra-only change tracking）：讓本 repo 與 `repo-standards` 將 Spectra artifact 作為唯一變更追蹤紀錄，並以 `rg` 驗證不存在建立或依賴 GitHub Issue 的現行指示。
- [x] 1.2 Canonical PR review contract：讓 skill、command、checklist 與 references 指向 `CLAUDE.md`／`jt-flow-review-orchestration` 的 Skill-driven 審查流程，並以內容比對驗證不再把手動 `/code-review` 加 bot 視為標準。

## 2. Living documentation and validation

- [x] 2.1 Spectra-only change tracking：更新 `docs-and-standards` living specification 與 detail，使跨 repo 回填以 Delivery Relations 追蹤，並以 `spectra validate --changes align-repo-standards-code-review --strict` 驗證。
- [x] 2.2 Canonical PR review contract：更新 living documentation 的 review 契約與設定前置條件，並以 `spectra analyze align-repo-standards-code-review`、`npm run validate`、`claude plugin validate .` 與 `git diff --check` 驗證。
