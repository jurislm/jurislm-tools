## 背景

儲存庫規定：`feat` 發布 minor 版本、`fix` 發布 patch 版本，而 `docs`／`chore` 不應發布。Release Please 17.10.4 使用 `simple` 策略的預設版本邏輯，會對所有非 feature 提交套用 patch 升級；其中的 changelog sections 只能決定發布說明分類，無法落實儲存庫的版本政策。PR #208 已證明這會產生不預期的 v1.37.1 發布。

## 目標／非目標

**目標：**

- 讓 Drone 發布流程只有在未發布範圍含有 `feat` 或 `fix` 提交時，才建立或更新 release PR。
- 保留閘門前的 `github-release`，確保已合併的 release PR 仍會建立 tag 與 GitHub Release。
- 讓判定具備確定性、支援分頁、有單元測試，且無法安全讀取發布範圍時採取 fail closed。
- 維持儲存庫的 `ci-platform` 契約與 `repo-standards` 範本同步。

**非目標：**

- 刪除、重新標記或改寫 v1.37.1。
- 修改 Release Please 管理的版本檔案，或改變既有的 `feat`／`fix` 版本規則。
- 新增 GitHub Actions、第三方服務或人工發布核准步驟。

## 設計決策

### 從 GitHub 讀取發布範圍

Node 資格判定腳本先讀取 manifest 版本，再使用已驗證身分的 GitHub Compare endpoint，從 `v<manifest-version>` 比較到 `DRONE_REPO` 中的 `DRONE_BRANCH`。腳本會持續處理分頁，直到所有 Compare 提交都完成判定。這使用遠端權威範圍，而不是依賴 Drone clone；clone 深度與 tag 是否存在都不是可靠且持久的發布邊界。

替代方案：檢查本地 Git tags 與歷史。否決原因：clone 深度不足或缺少 tag 時，可能靜默漏掉已發布基準。

### 只閘門控制 `release-pr` 呼叫

Drone 的 `github-release` 步驟維持無條件執行，並且先於資格閘門。`release-pr` 步驟只有在判定為可發布後才呼叫 Release Please。這樣 release PR 合併所產生的 push 可以先建立 tag，接著新發布的 manifest 會讓 Compare 範圍變空。

替代方案：閘門控制整個 release pipeline。否決原因：這會在 `chore(main): release X.Y.Z` 時跳過 `github-release`，使已合併的 release PR 沒有 tag。

### 無法讀取或內容無效時採 fail closed

資格判定腳本只接受通過儲存庫既有驗證器檢查的 Conventional Commit subject。缺少 token、manifest 版本、儲存庫 metadata、Compare 錯誤、回應格式錯誤或提交 subject 無效時，腳本都以錯誤結束，且不呼叫 Release Please。只有 `docs`／`chore` 的有效範圍，或沒有提交的有效範圍，會回傳獨立的 skip 結果；Drone shell 將此結果視為成功，但不呼叫 `release-pr`。

替代方案：將未知提交或 API 錯誤視為可發布。否決原因：這會重新造成未經審查的版本升級。

### 維持標準範本同步

目前的 `ci-platform` 與 `docs-and-standards` 規格、儲存庫 Drone 驗證器，以及 `repo-standards` 發布範本，都記錄相同的資格判定契約。範本使用 Drone 提供的儲存庫與分支 metadata，不硬編 consumer repository 名稱。

## 實作契約

- **行為：** `github-release` 之後，release-pr 階段比較目前已發布版本 tag 與 `main`。只有至少一個提交 subject 是 `feat` 或 `fix` 時，才呼叫 Release Please。只有文件、只有維護、文件與維護混合，以及空範圍，都會完成該階段而不建立或更新 release PR。
- **介面：** `scripts/release-eligibility.mjs` 匯出可供測試的純範圍分類 helper，並提供 CLI。CLI 讀取 `RELEASE_PLEASE_TOKEN`、`DRONE_REPO`、`DRONE_BRANCH` 與 `.release-please-manifest.json`；可發布時回傳 exit code `0`，安全跳過時回傳 `10`，無法安全判定時回傳非 `0` 且非 `10` 的 code。
- **失敗模式：** Drone shell 只將 exit code `10` 視為成功跳過。其他所有非零 code 都會使 release-pr 步驟失敗，並阻止版本升級呼叫。token 絕不寫入 stdout 或 stderr。
- **驗收：** 單元測試涵蓋沒有提交、只有文件、只有維護、不可發布的混合內容、`feat`、`fix`、無效 subject、缺少 metadata、Compare 非成功回應，以及分頁 Compare 回應。Drone 政策測試會拒絕缺少資格閘門，或把不安全錯誤轉成成功的 release-pr 設定。
- **範圍邊界：** 實作只改變發布資格判定及其文件，不修改 manifest 值、plugin 版本、`github-release` 或既有發布歷史。

## 風險／取捨

- 【GitHub Compare 分頁或驗證失敗】→ 腳本在 `release-pr` 前 fail closed，保留目前發布狀態供下次重試。
- 【直接 push main 的提交 subject 無效】→ 驗證與發布資格判定都會失敗，避免錯誤提交繞過 commit policy 造成版本升級。
- 【發布範圍超過一個 API page】→ 腳本會遵循每個 `Link` page，完成全部判定後才下結論。
- 【未來儲存庫採用範本卻沒有 helper script】→ 結構性 Drone 測試會要求資格閘門命令，範本也會同時記錄兩個必要 artifacts。

## 遷移計畫

1. 合併加入閘門的 pipeline 與測試，不觸碰由 Release Please 管理的版本。
2. 讓下一次 release pipeline 透過 `github-release`，為任何已合併的 release PR 建立 tag。
3. 驗證只有文件的 main push 會跳過 `release-pr`，後續的 `feat` 或 `fix` 則會建立或更新預期的 release PR。
4. 如果 GitHub 無法提供安全範圍而導致閘門失敗，只在後續 rollback PR 還原先前的 pipeline 命令；不要手動增加版本。
