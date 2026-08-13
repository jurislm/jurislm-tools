## Why

`entire` 已驗證「同一個 main delivery 授權 release PR 自動合併」的完整交付關係；jurislm-tools 與 repo-standards 仍有要求、模板與實作不同步的落差。這會讓版本 PR 仍依賴人工，且標準無法可靠地導入其他 repo。

## What Changes

- 為 jurislm-tools 的 trusted main Drone delivery 新增 source-controlled release PR validator 與 auto-merge pipeline；只有同一個 commit 的 validate 與 release 成功後才可合併候選。
- 為 Plugin artifact contract 驗證官方來源、branch、title／body marker、精確變更檔案、版本內容、base／head SHA、mergeability 與最新 main tip；不安全或不一致的候選一律 fail closed，而無候選、較新 candidate delivery 接手或驗證期間 main 已改變則成功 no-op。
- 讓 repo-standards 明定 entire 是唯一已驗證 reference repo；其他 repo 在實際驗收前僅屬待導入。
- 同步 canonical spec、模板、checklist 與 executable policy tests：Turborepo 必要性、固定 Release Please CLI 版本、Turbo `--filter`／`--affected` 邊界，以及 affected 判定不確定時的完整驗證／部署。
- 保留既有 release eligibility：只有 unreleased feat／fix 範圍建立 release PR。

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
  - Modified: `.drone.yml`、`scripts/validate-drone-config.mjs`、`scripts/drone-ci-policy.test.mjs`、`plugins/repo-standards/skills/repo-standards/SKILL.md`、`plugins/repo-standards/skills/repo-standards/references/ci-workflow-templates.md`、`plugins/repo-standards/skills/repo-standards/references/new-repo-checklist.md`、`openspec/specs/docs-and-standards/repo-standards-detail.md`。
  - Removed: none.
- Tracking: Closes #215.
