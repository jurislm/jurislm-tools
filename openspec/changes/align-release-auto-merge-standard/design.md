## Context

`entire` 的已驗證模式是：每個 trusted `main` delivery commit `C` 先完成必要 validation 與 release，再由 source-controlled validator 合併 base 為 `C` 的 Release Please candidate。jurislm-tools 現有 Drone 只有 `validate` 與 `release`，Release Please CLI 已固定為 17.10.4，卻仍需人工合併 release PR。

本 change 以 `entire` 的安全不變量為 reference，而不是複製它的 deploy、Bun 或 monorepo topology。Plugin 沒有 deployment target，因此完整 delivery 的 prerequisite 是同一個 `C` 的 `validate` 與 `release`。目前已確認最近 release PR 的作者是 `terry90918`、base 是 `main`、head 是 `release-please--branches--main`，並以 simple release contract 更新 manifest、CHANGELOG、九個 plugin manifest 與 marketplace metadata。

## Goals / Non-Goals

**Goals:**

- 讓 jurislm-tools 的 releasable main delivery 在無人工 merge 的情況下完成 release PR 合併。
- 只授權同一個 `C` 的 validated candidate，並在不一致、競態或 API 失敗時拒絕合併。
- 讓 repo-standards 的 canonical spec、模板、checklist 和 executable checks 對同一條交付契約說同一件事。
- 將 entire 標示為唯一已驗證 reference repo；其他 repo 必須完成自己的 observable acceptance 才能標示符合。

**Non-Goals:**

- 不改其他 repo 的 CI、部署或版本管理。
- 不升級 ESLint，也不把 Plugin repo 改為 Bun 或 Turborepo。
- 不改 release eligibility 的 feat／fix 判定，亦不加入人工 merge fallback。
- 不使用 `pull_request_target`、candidate-head checkout 或 PR workflow 中的 write token。

## Decisions

### Trusted delivery authorization

新增 `release-pr-auto-merge` Drone pipeline，只接受 `main` push，並以 `depends_on: [validate, release]` 與 pipeline concurrency limit 1 綁定同一 delivery。它只注入現有 `RELEASE_PLEASE_TOKEN`，以 Node 執行 source-controlled validator；PR validation 不取得該 token。

選擇 Drone main-delivery coordinator，而不是 release PR workflow 或 GitHub Actions，因為前者已擁有可信 checkout、`DRONE_COMMIT` 與 release 先後關係。只看 candidate 自己的 checks 會讓未經 main delivery 授權的內容取得 merge 權。

### Candidate artifact validation

新增 `scripts/release-pr-auto-merge.mjs` 與測試。它以 GitHub REST API 取得唯一的 open candidate，驗證 repository、base branch、official author、head branch、title、Release Please body marker、base／head SHA、mergeability 和最新 main tip。

validator 從 trusted checkout 的 manifest 與 release config 建立 Plugin artifact contract：恰好允許 manifest、CHANGELOG、九個 plugin manifest 與 marketplace metadata。它讀取 candidate head 的檔案內容，要求所有版本欄位與新 manifest version 一致、版本大於 base、metadata 除指定版本欄位外不變，且 CHANGELOG 只在 base 內容前增加新版本區塊。任何額外檔案、語意漂移、格式不合法、API 錯誤或不一致都 fail closed。

若 candidate base 是較新的 main commit，舊 delivery 回傳 no-op，交由較新的 delivery 處理；其他 candidate base SHA 關係不符即失敗。若 merge 前的 main-tip recheck 顯示 `main` 已不再等於 `C`，該 validator 成功 no-op，避免舊 delivery 合併過時 candidate。GitHub merge API 必須帶入剛驗證的 head SHA，消除驗證與合併之間的 race。

### Standards canonicalization

living spec 將宣告 Monorepo 必用 Turborepo，且將 `--filter` 定義為明確 workspace 範圍、`--affected` 定義為有可信 Git 範圍時的自動縮小。Git 資訊或 affected query 不足時，必須完整 validation／deploy，不得靜默跳過。

所有會寫 GitHub 的 Release Please template command 必須使用 repo 選定的精確版本；範本以明確 placeholder 表示，目標 repo 的 policy test 必須拒絕未鎖版本。所有 release auto-merge 文件都只描述同一個 `C`、trusted main、artifact contract、SHA recheck、較新 delivery 接手與無人工 fallback 的規則。

### Verification and rollout

單元測試以 mock GitHub API 覆蓋 valid merge、無 candidate no-op、偽造作者／branch／body、額外檔案、版本漂移、錯 base／head、不可 merge、main 已改變 no-op 與 API error。Drone structural tests 驗證 pipeline trigger、dependency、concurrency、token boundary、固定 CLI 版本與指令。

完成本地 tests、repository validation、Drone config validation、Spectra strict validation 後，PR merge 後用一次真實 releasable `main` delivery 驗收：release PR 由 automation 合併、隨後 push build cut tag／release。失敗時停在 candidate 開啟狀態，不以人工 merge 補救。

## Implementation Contract

- **Behavior：** 對於含 unreleased `feat` 或 `fix` 的 main commit `C`，Release Please 建立 candidate 後，`release-pr-auto-merge` 只在 `validate(C)` 與 `release(C)` 成功時合併；docs／chore-only 範圍維持既有成功跳過行為。
- **Interface：** `node scripts/release-pr-auto-merge.mjs` 讀取 `RELEASE_PLEASE_TOKEN` 與 `DRONE_COMMIT`。成功只輸出 merged 或 no-op；不安全狀態以非零 exit 終止且不發出 merge request。
- **Failure modes：** 無 candidate、candidate base 是較新的 `C` descendant，或 merge 前 main-tip recheck 顯示 `main` 已不等於 `C` 時成功 no-op；其餘 candidate、network、schema、mergeability 或 SHA mismatch 都 fail closed。
- **Acceptance：** automated tests 必須證明每個拒絕條件都不呼叫 merge API，且證明兩種較新 delivery 情況成功 no-op；structural tests 必須證明 token 不進 PR pipeline；真實 delivery readback 必須證明合併與後續 tag／release。
- **Scope boundaries：** 本 change 只改 jurislm-tools 與 repo-standards。未採用 repo 的導入、ESLint 升級與 production deploy 不在本 change。

## Risks / Trade-offs

- **Release Please body 格式上游改變** → 驗證標記採固定且測試過的 minimal markers；升級 CLI 必須連同 validator contract review。
- **GitHub mergeability 暫時為 null** → 有界重試後 fail closed，不以未知狀態合併。
- **連續 main push 造成舊 build 看到新 candidate** → 以 base ancestry 與 merge 前 main-tip recheck 讓舊 build no-op。
- **artifact contract 日後新增 plugin** → 修改 release config、shared contract 與 validator test 必須同一 change 完成，否則 policy test 失敗。

## Migration Plan

1. 建立完整 Spectra artifacts，經核准後在新的 feature worktree 實作。
2. 先加入 failing validator／policy tests，再實作 contract module、validator、Drone pipeline 與 standards synchronization。
3. 在 PR 中執行 repository 與 Spectra validation；不得手動改 release-managed version。
4. 合併後監看 trusted main delivery 與 release PR 自動合併。若 validator 拒絕 candidate，保留 candidate 與 CI evidence，修正 source-controlled contract 後由新 main delivery 重試。
