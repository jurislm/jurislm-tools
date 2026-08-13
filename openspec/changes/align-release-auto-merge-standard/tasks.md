## 1. 先建立可拒絕錯誤合併的測試

- [x] [P] 1.1 在 `scripts/release-pr-auto-merge.test.mjs` 建立「Drone auto-merges only an authorized Release Please candidate」的 mock GitHub API 測試矩陣，使正確 candidate 唯一在 GitHub required checks clean 與 latest-base protection 已驗證後，發出帶 validated head SHA 的 PR merge request；無候選、較新 candidate base、候選等待時 main 已改變、GitHub 拒絕 stale merge 後 main 已改變均成功 no-op，而偽造來源、額外檔案、版本漂移、額外 CHANGELOG version block、錯 SHA、protection drift、不可 merge與 API error 均不發出 merge request；以 `node --test scripts/release-pr-auto-merge.test.mjs` 驗證。
- [x] [P] 1.2 擴充 `scripts/drone-ci-policy.test.mjs` 與 `scripts/validate-drone-config.mjs`，使「Release Please write commands use a fixed executable version」及 trusted main pipeline 的 trigger、dependency、concurrency、token boundary 成為結構契約；以 `node --test scripts/drone-ci-policy.test.mjs` 與 `node scripts/validate-drone-config.mjs` 驗證。

## 2. 實作 trusted delivery authorization

- [x] 2.1 在 `scripts/release-pr-auto-merge.mjs` 實作 Trusted delivery authorization 與 Candidate artifact validation：只接受 `RELEASE_PLEASE_TOKEN` 與 `DRONE_COMMIT` 的 trusted main 呼叫，選取唯一 open candidate，驗證 identity、marker、SHA、required checks、mergeability、latest-base protection 與 Plugin artifact contract，並以 validated head SHA 呼叫 GitHub PR merge API；無候選、較新 candidate base、候選等待時 main 已改變，或 GitHub 拒絕 stale candidate 且 main 已改變時 no-op，其餘 mismatch fail closed；以 1.1 的完整行為矩陣驗證。
- [x] 2.2 在 `.drone.yml` 新增 main-only `release-pr-auto-merge` pipeline，使它等待同一 delivery 的 `validate` 與 `release`、以 concurrency limit 1 序列化，且不向 PR build 暴露 release token；以 1.2 的 structural checks 與 Drone YAML parser 驗證。
- [x] 2.3 在 `scripts/validate-drone-config.mjs` 與 `scripts/drone-ci-policy.test.mjs` 固定 release pipeline 唯一 Release Please write command 為 17.10.4，並驗證 auto-merge pipeline 只執行 source-controlled validator、拒絕 unpinned Release Please command；以 `node scripts/validate-drone-config.mjs` 與 policy tests 驗證。
- [x] 2.4 設定並 readback `main` 的 GitHub protection：required status checks 啟用 latest-base enforcement（`strict: true`），且規則套用到 automation credential（`enforce_admins.enabled: true`）；確認這不新增人工 review gate。
- [x] 2.5 設定並 readback jurislm-tools 的 GitHub merge policy：只允許 squash merge、`use_squash_pr_title_as_default: true`，停用 merge／rebase merge，讓未來 main delivery 有唯一 Conventional Commit subject。
- [x] 2.6 以 TDD 修正 `scripts/release-eligibility.mjs` 與 `scripts/release-pr-auto-merge.mjs`：Compare 固定綁定 `DRONE_COMMIT`、只走 first-parent mainline、嚴格處理已存在 GitHub default merge delivery、拒絕斷裂／不合法 delivery；release candidate 以 validated title 的 GitHub protected squash merge 合併。

## 3. 同步 repo standards 的可驗收規則

- [x] [P] 3.1 更新 `openspec/specs/docs-and-standards/spec.md` 與 `openspec/specs/docs-and-standards/repo-standards-detail.md`，使「Repo standards distinguish verified references from adoption targets」與「Monorepo standards require Turborepo and safe scoped execution」成為 living contract，並明定 npm／MCP 僅跳過 deploy-gating、不得跳過 release PR auto-merge；以 `spectra validate --strict` 和 requirement/scenario readback 驗證。
- [x] [P] 3.2 進行 Standards canonicalization：更新 `plugins/repo-standards/skills/repo-standards/SKILL.md`、`plugins/repo-standards/skills/repo-standards/references/ci-workflow-templates.md` 與 `plugins/repo-standards/skills/repo-standards/references/new-repo-checklist.md`，使 entire-only verified status、exact-version Release Please、所有 repo 類型的 auto-merge contract、`--filter`／`--affected` boundary 和 affected 無法判定時回退完整驗證／部署規則一致；以文字 policy tests 與人工交叉讀回驗證。
- [x] 3.3 擴充或新增 repository policy test，使 Monorepo 必用 Turborepo、每個 Release Please template（含 npm／MCP）必須要求 exact-version release command 與 auto-merge、所有 adoption target 必有 observable acceptance，不只檢查單一 SKILL 字串；以 `npm test` 驗證。
- [x] 3.4 更新 living spec、repo-standards skill、templates 與 checklist：Release eligibility 必須以 immutable mainline delivery 判讀，且每個 target 都必須 readback target-compatible merge mode；Conventional Commit target 預設 squash-only + PR title。

## 4. Verification and rollout：整合驗證與交付 readback

- [x] 4.1 執行 Verification and rollout：`npm ci`、`npm run validate`、`claude plugin validate .`、`spectra validate --strict` 與 `spectra analyze align-release-auto-merge-standard --json`，確認 validator、CI 結構、版本同步與 artifacts 全部通過；將實際輸出記入 `openspec/changes/align-release-auto-merge-standard/verification-logs/`。
- [ ] 4.2 合併後對一個真實 releasable main delivery 讀回 Drone build、release PR merge、後續 push build 與 GitHub tag／release，證明「Drone auto-merges only an authorized Release Please candidate」沒有人工介入；若任一 readback 失敗，保留 candidate 並修正 source-controlled contract 後重試。
- [x] 4.3 記錄 build #105 的 fail-closed evidence，執行 recovery regression、完整 repository／Drone／Spectra validation 與 GitHub merge-policy readback；不得以人工 release fallback 取代 acceptance。
