## 1. 先建立可拒絕錯誤合併的測試

- [ ] [P] 1.1 在 `scripts/release-pr-auto-merge.test.mjs` 建立「Drone auto-merges only an authorized Release Please candidate」的 mock GitHub API 測試矩陣，使正確 candidate 唯一呼叫帶 head SHA 的 merge API；無候選、較新 candidate base、main SHA 已改變均成功 no-op，而偽造來源、額外檔案、版本漂移、錯 SHA、不可 merge 與 API error 均不呼叫 merge；以 `node --test scripts/release-pr-auto-merge.test.mjs` 驗證。
- [ ] [P] 1.2 擴充 `scripts/drone-ci-policy.test.mjs` 與 `scripts/validate-drone-config.mjs`，使「Release Please write commands use a fixed executable version」及 trusted main pipeline 的 trigger、dependency、concurrency、token boundary 成為結構契約；以 `node --test scripts/drone-ci-policy.test.mjs` 與 `node scripts/validate-drone-config.mjs` 驗證。

## 2. 實作 trusted delivery authorization

- [ ] 2.1 在 `scripts/release-pr-auto-merge.mjs` 實作 Trusted delivery authorization 與 Candidate artifact validation：只接受 `RELEASE_PLEASE_TOKEN` 與 `DRONE_COMMIT` 的 trusted main 呼叫，選取唯一 open candidate，驗證 identity、marker、SHA、mergeability、main tip 和 Plugin artifact contract，並以 validated head SHA merge；無候選、較新 candidate base 或 main SHA 已改變時 no-op，其餘 mismatch fail closed；以 1.1 的完整行為矩陣驗證。
- [ ] 2.2 在 `.drone.yml` 新增 main-only `release-pr-auto-merge` pipeline，使它等待同一 delivery 的 `validate` 與 `release`、以 concurrency limit 1 序列化，且不向 PR build 暴露 release token；以 1.2 的 structural checks 與 Drone YAML parser 驗證。
- [ ] 2.3 在 `scripts/validate-drone-config.mjs` 與 `scripts/drone-ci-policy.test.mjs` 固定 release pipeline 唯一 Release Please write command 為 17.10.4，並驗證 auto-merge pipeline 只執行 source-controlled validator、拒絕 unpinned Release Please command；以 `node scripts/validate-drone-config.mjs` 與 policy tests 驗證。

## 3. 同步 repo standards 的可驗收規則

- [ ] [P] 3.1 更新 `openspec/specs/docs-and-standards/spec.md` 與 `openspec/specs/docs-and-standards/repo-standards-detail.md`，使「Repo standards distinguish verified references from adoption targets」與「Monorepo standards require Turborepo and safe scoped execution」成為 living contract；以 `spectra validate --strict` 和 requirement/scenario readback 驗證。
- [ ] [P] 3.2 進行 Standards canonicalization：更新 `plugins/repo-standards/skills/repo-standards/SKILL.md`、`plugins/repo-standards/skills/repo-standards/references/ci-workflow-templates.md` 與 `plugins/repo-standards/skills/repo-standards/references/new-repo-checklist.md`，使 entire-only verified status、exact-version Release Please、auto-merge contract、`--filter`／`--affected` boundary 和 affected 無法判定時回退完整驗證／部署規則一致；以文字 policy tests 與人工交叉讀回驗證。
- [ ] 3.3 擴充或新增 repository policy test，使 Monorepo 必用 Turborepo、templates 必須要求 exact-version release command、所有 adoption target 必有 observable acceptance，不只檢查單一 SKILL 字串；以 `npm test` 驗證。

## 4. Verification and rollout：整合驗證與交付 readback

- [ ] 4.1 執行 Verification and rollout：`npm ci`、`npm run validate`、`claude plugin validate .`、`spectra validate --strict` 與 `spectra analyze align-release-auto-merge-standard --json`，確認 validator、CI 結構、版本同步與 artifacts 全部通過；將實際輸出記入 `openspec/changes/align-release-auto-merge-standard/verification-logs/`。
- [ ] 4.2 合併後對一個真實 releasable main delivery 讀回 Drone build、release PR merge、後續 push build 與 GitHub tag／release，證明「Drone auto-merges only an authorized Release Please candidate」沒有人工介入；若任一 readback 失敗，保留 candidate 並修正 source-controlled contract 後重試。
