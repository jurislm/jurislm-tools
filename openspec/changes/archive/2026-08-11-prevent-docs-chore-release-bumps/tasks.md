## 1. 發布資格閘門

- [x] [P] 1.1 在 `scripts/release-eligibility.test.mjs` 新增 RED 測試，覆蓋「Drone 負責 Release Please」契約：空範圍、只有文件、只有維護、文件／維護混合、`feat`、`fix`、無效 subject、缺少 metadata、Compare 失敗，以及多頁比較輸入，都必須產生各自明確的執行、跳過或 fail closed 結果；確認 production module 尚未存在時，新的測試命令會失敗。
- [x] 1.2 在 `scripts/release-eligibility.mjs` 實作「從 GitHub 讀取發布範圍」與「無法讀取或內容無效時採 fail closed」：讀取 manifest 基準，使用 `DRONE_REPO` 與 `DRONE_BRANCH` 呼叫已驗證身分的 GitHub Compare API 並處理分頁，驗證每個 subject；只有 `feat`／`fix` 回傳 exit `0`，只有安全的不可發布範圍回傳 exit `10`，且絕不輸出 `RELEASE_PLEASE_TOKEN`；確認 `node --test scripts/release-eligibility.test.mjs` 通過。
- [x] [P] 1.3 在 `scripts/drone-ci-policy.test.mjs` 新增 RED fixtures，證明缺少資格閘門，或把不安全的閘門錯誤轉成成功的 `release-pr` 階段都應被拒絕；確認每個 fixture 對目前驗證器會因預期缺少的契約而失敗。
- [x] 1.4 為既有需求「Drone owns Release Please」（Drone 負責 Release Please），在 `.drone.yml` 與 `scripts/validate-drone-config.mjs` 實作「只閘門控制 `release-pr` 呼叫」：保留無條件且先執行的 `github-release`；只有 exit `0` 才呼叫 Release Please；只有 exit `10` 轉成成功跳過；其他錯誤全部向上傳遞；確認 `node --test scripts/drone-ci-policy.test.mjs` 與 `npm run validate` 通過。

## 2. 標準與規格同步

- [x] [P] 2.1 為「repo-standards 發布指引避免不可發布的版本升級」需求實作「維持標準範本同步」：更新 `plugins/repo-standards/skills/repo-standards/SKILL.md`、`plugins/repo-standards/skills/repo-standards/references/ci-workflow-templates.md` 與 `openspec/specs/docs-and-standards/repo-standards-detail.md`，記錄相同的 Compare 閘門、安全跳過、fail closed、憑證遮罩，以及 github-release 先於 release-pr 的行為；確認每份 artifact 都指向 helper，且 Markdown lint 通過。
- [x] 2.2 歸檔前，將 `openspec/changes/prevent-docs-chore-release-bumps/specs/ci-platform/spec.md` 與 `openspec/changes/prevent-docs-chore-release-bumps/specs/docs-and-standards/spec.md` 對照實際交付行為；在 PR #211、Release Please PR #212 合併及 Drone 95／97 證據確認新契約成立後，已將 delta 同步到 `openspec/specs/ci-platform/spec.md` 與 `openspec/specs/docs-and-standards/spec.md`；確認 `spectra validate prevent-docs-chore-release-bumps --strict` 與 `spectra validate --all --strict` 通過。

## 3. 交付驗證

- [x] 3.1 在乾淨 worktree 執行完整本地驗收：`node --test scripts/release-eligibility.test.mjs`、`npm run validate`、`claude plugin validate .`、`spectra validate prevent-docs-chore-release-bumps --strict`、`spectra analyze prevent-docs-chore-release-bumps` 與 `git diff --check`；確認所有命令 exit `0`，且測試證明 docs／chore 會跳過、feat／fix 會執行。
- [x] 3.2 修正 PR 合併後，讀回 Drone push build 與 GitHub release 狀態：確認只有文件或維護的範圍沒有建立或更新 release PR、`github-release` 仍能處理已合併的 release PR，且 Issue #210 與 P2 review thread 都保留明確處置；已記錄 Drone #99 的 docs-only skip、Drone #97 的 `v1.37.2` 發布、Issue #210 與 resolved P2 thread，現在可歸檔 Spectra change。
