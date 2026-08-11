## 為什麼

PR #208 顯示，Release Please 的 `simple` 策略會把非 `feat` 提交預設視為 patch release。因此，只有 `docs` 和 `chore` 的維護工作仍產生了 v1.37.1，並同步改動 marketplace 的九個 plugin 版本，與儲存庫既有的版本政策不一致。Closes #210。

## 變更內容

- 在 `release-pr` 前加入明確的 Drone 發布資格閘門，只有未發布範圍內含有 `feat` 或 `fix` 提交時，才可以建立或更新 release PR。
- 保留已合併 release PR 所需的 `github-release`，再以目前已發布版本作為基準判斷是否有資格發布。
- 為只有文件、只有維護、混合不可發布提交、可發布提交，以及無法取得發布基準等情境新增確定性測試，並擴充 Drone 契約驗證器。
- 同步更新 `ci-platform` 與 `docs-and-standards` 規格，以及受影響的 `repo-standards` 發布範本。

## 非目標

- 不手動修改由 Release Please 管理的版本，也不改變 `feat`／`fix` 的版本升級語意。
- 不刪除、重新標記或改寫已發布的 v1.37.1；這需要另外取得明確授權。
- 不新增平行的 GitHub Actions 發布流程，也不引入新的外部服務。

## 能力範圍

### 新增能力

- 無。

### 修改能力

- `ci-platform`：Drone 發布流程必須避免只有文件或維護的變更建立版本升級 PR，同時保留 release PR 合併後的 tag 建立流程。
- `docs-and-standards`：plugin 儲存庫標準必須定義並提供相同的可發布提交資格規則範本。

## 影響範圍

- 受影響的 plugin：`repo-standards`。
- 受影響的程式碼：
  - 新增：`scripts/release-eligibility.mjs`、`scripts/release-eligibility.test.mjs`。
  - 修改：`.drone.yml`、`scripts/validate-drone-config.mjs`、`scripts/drone-ci-policy.test.mjs`、`openspec/specs/ci-platform/spec.md`、`openspec/specs/docs-and-standards/repo-standards-detail.md`、`plugins/repo-standards/skills/repo-standards/SKILL.md`、`plugins/repo-standards/skills/repo-standards/references/ci-workflow-templates.md`。
  - 移除：無。
