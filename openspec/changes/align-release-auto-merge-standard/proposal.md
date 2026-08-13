## Why

`entire` 已驗證「同一個 main delivery 授權 release PR 自動合併」的完整交付關係；jurislm-tools 與 repo-standards 仍有要求、模板與實作不同步的落差。這會讓版本 PR 仍依賴人工，且標準無法可靠地導入其他 repo。

## What Changes

- 為 jurislm-tools 的 trusted main Drone delivery 新增 source-controlled release PR validator 與 auto-merge pipeline；只有同一個 commit 的 validate 與 release 成功後才可合併候選。
- 為 Plugin artifact contract 驗證官方來源、branch、title／body marker、精確變更檔案、版本內容、base／head SHA、required-check clean 狀態與 GitHub branch-protection guard；CHANGELOG 只能新增一個 candidate version block。由 GitHub PR merge API 以剛驗證的 head SHA 合併，並要求 `main` 的 latest-base required checks 與管理員 enforcement，讓 GitHub 在 base 已前進時拒絕舊 candidate。無候選、較新 candidate delivery 接手、候選等待期間 main 已改變，或 GitHub 拒絕 stale candidate 且 reread 證實 main 已改變則成功 no-op；其他不安全或不一致的候選一律 fail closed。
- 讓 repo-standards 明定 entire 是唯一已驗證 reference repo；其他 repo 在實際驗收前僅屬待導入。
- 同步 canonical spec、所有 repo 類型模板（含 npm／MCP）、checklist 與 executable policy tests：Turborepo 必要性、固定 Release Please CLI 版本、release PR auto-merge、Turbo `--filter`／`--affected` 邊界，以及 affected 判定不確定時的完整驗證／部署。
- 修正 release eligibility 的來源判讀：Compare API 只用來取得已發布 tag 與不可變 `DRONE_COMMIT` 間的可到達提交；資格判斷只接受該 delivery 的 first-parent mainline 單位，不能把 PR side branch 的中間 `test` 提交當成 main 歷史。為回復已進入 main 的 GitHub default merge delivery，可在其格式與 body 的 Conventional Commit PR title 都嚴格驗證時使用該 title；未來一律以 squash merge 與 PR title 落地，避免再產生歧義。

## Non-Goals

- 不全域升級 ESLint、不改其他 repo 的 CI 或部署拓撲。
- 不把 entire 的 Coolify deploy 流程複製到 Plugin repo。
- 不保留人工合併 release PR 的 fallback。

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `ci-platform`：Drone release delivery 增加 trusted release PR auto-merge 與候選驗證契約。
- `docs-and-standards`：repo-standards 將 entire 的已驗證原則轉為可驗收且一致的組織規範。

## Impact

- Affected specs: `ci-platform`、`docs-and-standards`。
- Affected code:
  - New: `scripts/release-pr-auto-merge.mjs`、`scripts/release-pr-auto-merge.test.mjs`。
  - Modified: `.drone.yml`、`scripts/release-eligibility.mjs`、`scripts/release-eligibility.test.mjs`、`scripts/validate-drone-config.mjs`、`scripts/drone-ci-policy.test.mjs`、`plugins/repo-standards/skills/repo-standards/SKILL.md`、`plugins/repo-standards/skills/repo-standards/references/ci-workflow-templates.md`、`plugins/repo-standards/skills/repo-standards/references/new-repo-checklist.md`、`openspec/specs/docs-and-standards/repo-standards-detail.md`。
  - Removed: none.
- Tracking: Refs #215. The issue closes only after the real release delivery readback succeeds.
