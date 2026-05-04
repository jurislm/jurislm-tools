# Changelog

## [1.22.0](https://github.com/jurislm/jurislm-tools/compare/v1.21.0...v1.22.0) (2026-05-04)


### 🚀 New Features

* **ci:** overhaul claude-code-review prompt — profile, path filter, triage ([494481f](https://github.com/jurislm/jurislm-tools/commit/494481f40b6643e1a8a15ec1ee23c09097cd47cd))

## [1.21.0](https://github.com/jurislm/jurislm-tools/compare/v1.20.0...v1.21.0) (2026-05-04)


### 🚀 New Features

* bootstrap openspec/specs with full 15-spec coverage ([#79](https://github.com/jurislm/jurislm-tools/issues/79)) ([28f143d](https://github.com/jurislm/jurislm-tools/commit/28f143d94f7d47445830ddfacf2ea519f28d9071))
* bootstrap openspec/specs with full 15-spec coverage and fill config.yaml context ([cd70a2a](https://github.com/jurislm/jurislm-tools/commit/cd70a2a541baafc427248df45f0555ca2c7094b1))
* **tdd-workflow:** add self-determination logic for New Feature / Bug Fix / Refactor TDD ([2644b79](https://github.com/jurislm/jurislm-tools/commit/2644b797fc371e6fe6517a4b703f42c4f882ff2f))
* **tdd-workflow:** add self-determination logic for workflow type ([7b1996e](https://github.com/jurislm/jurislm-tools/commit/7b1996e363fe718c54dbed41c40e5d84c0a68eb3))

## [1.20.0](https://github.com/jurislm/jurislm-tools/compare/v1.19.0...v1.20.0) (2026-04-30)


### 🚀 New Features

* add agent examples per plugin-dev best practices ([#77](https://github.com/jurislm/jurislm-tools/issues/77)) ([2d2dde5](https://github.com/jurislm/jurislm-tools/commit/2d2dde54829fb764cf8c713062a22b637d21d9ea))
* add plugin READMEs and fix tdd-workflow imperative form ([#76](https://github.com/jurislm/jurislm-tools/issues/76)) ([f595979](https://github.com/jurislm/jurislm-tools/commit/f595979886700ec4ff1b2991257282f48d04c8a8))
* rename plugin jt → jurislm-tools, update CLAUDE.md, clarify SKILL.md descriptions ([003555a](https://github.com/jurislm/jurislm-tools/commit/003555a750975c1b3a56679a5a468fd308d27dd2))
* split into 8 plugins, add ECC commands, improve quality ([#75](https://github.com/jurislm/jurislm-tools/issues/75)) ([389b9c8](https://github.com/jurislm/jurislm-tools/commit/389b9c870cf1091ab5f1de312244a46952a2f273))


### 📚 Documentation

* unify plugin descriptions ([#78](https://github.com/jurislm/jurislm-tools/issues/78)) ([38cf7db](https://github.com/jurislm/jurislm-tools/commit/38cf7dbb0099feba8bc7fd4b90eeea79c12584c4))

## [1.19.0](https://github.com/jurislm/jurislm-tools/compare/v1.18.0...v1.19.0) (2026-04-30)


### 🚀 New Features

* add rules directory to plugin ([#71](https://github.com/jurislm/jurislm-tools/issues/71)) ([07e5a14](https://github.com/jurislm/jurislm-tools/commit/07e5a14888aca999768a571fc0a69894b6479f09))

## [1.18.0](https://github.com/jurislm/jurislm-tools/compare/v1.17.1...v1.18.0) (2026-04-30)


### 🚀 New Features

* **hooks:** 新增 commit-discipline-gate 雙層思考紀律 hook ([be2b697](https://github.com/jurislm/jurislm-tools/commit/be2b697b34726b989356860ed5be7bdbae2050ab))
* improve pr-review skill, add langfuse command, and update plugin docs ([#61](https://github.com/jurislm/jurislm-tools/issues/61)) ([d4b806c](https://github.com/jurislm/jurislm-tools/commit/d4b806cbeed01fceaa78e9afe3f2745c36b317e7))
* update repo-standards skill ([#68](https://github.com/jurislm/jurislm-tools/issues/68)) ([a45764c](https://github.com/jurislm/jurislm-tools/commit/a45764c6abc161726864c71df8f5efd251dee2a6))


### 🐛 Bug Fixes

* add version field to pr-review SKILL.md for jt: namespace ([7be201c](https://github.com/jurislm/jurislm-tools/commit/7be201cf6cdce690cb44f2333009a3a8c601e8b3))
* add version field to pr-review SKILL.md for jt: namespace ([30ff6da](https://github.com/jurislm/jurislm-tools/commit/30ff6da815143e497913a0771f218742f93735c5))
* **ci:** add config-file and manifest-file to release-please workflow ([1bad533](https://github.com/jurislm/jurislm-tools/commit/1bad533973651e3d25c2525355cc316a3b65f720))
* **ci:** add config-file and manifest-file to release-please workflow ([7a6c2f8](https://github.com/jurislm/jurislm-tools/commit/7a6c2f898d3270f65af6457ece9ecf6fab780b3d))
* **ci:** upgrade claude-code-action to [@v1](https://github.com/v1), use formal PR review, fix permissions ([2923864](https://github.com/jurislm/jurislm-tools/commit/29238648a498217dcdc7496b899d8d99d92861ed))


### 📚 Documentation

* fix copilot-instructions — add 繁中首行、更新工具數 (43/17/50) ([#67](https://github.com/jurislm/jurislm-tools/issues/67)) ([4d44f15](https://github.com/jurislm/jurislm-tools/commit/4d44f156b4fec4900869e2fffa1d2eb69271f02e))
* fix stale version and duplicate entries in CLAUDE.md and README.md ([30db4fc](https://github.com/jurislm/jurislm-tools/commit/30db4fcb0ed5efee1e5c3c707711726bc1390e4f))
* update CLAUDE.md — fix tool counts, add git workflow, cross-repo sync note ([dea33fc](https://github.com/jurislm/jurislm-tools/commit/dea33fc391ce482031380ff1d1f0f802ce6d215a))
* 補充整合測試規範到 repo-standards ([#69](https://github.com/jurislm/jurislm-tools/issues/69)) ([d307d02](https://github.com/jurislm/jurislm-tools/commit/d307d029c56e170b26712765929487aa7b723f55))

## [1.17.1](https://github.com/jurislm/jurislm-tools/compare/v1.17.0...v1.17.1) (2026-04-15)


### 🐛 Bug Fixes

* **pr-review:** simplify skill — remove auto-merge, clarify CI failure handling ([#59](https://github.com/jurislm/jurislm-tools/issues/59)) ([898bc26](https://github.com/jurislm/jurislm-tools/commit/898bc26fd5d87cefb5b71242f22a97e101a7cad6))

## [1.17.0](https://github.com/jurislm/jurislm-tools/compare/v1.16.1...v1.17.0) (2026-04-14)


### 🚀 New Features

* improve plugin quality — bilingual triggers, progressive disclosure, review fixes ([#56](https://github.com/jurislm/jurislm-tools/issues/56)) ([aeecd71](https://github.com/jurislm/jurislm-tools/commit/aeecd71091cd3eacaf16f676c763d3cfedcf1a1e))

## [1.16.1](https://github.com/jurislm/jurislm-tools/compare/v1.16.0...v1.16.1) (2026-04-12)


### 📚 Documentation

* add copilot instructions and .prettierignore ([#53](https://github.com/jurislm/jurislm-tools/issues/53)) ([9319360](https://github.com/jurislm/jurislm-tools/commit/93193604d07cd284e0a08a7e305fd2a7afbf289e))
* update repo-standards with improved claude-code-review prompt ([#51](https://github.com/jurislm/jurislm-tools/issues/51)) ([7c0f7e6](https://github.com/jurislm/jurislm-tools/commit/7c0f7e674223e9757f96e4b35aa84dcdb7f8088a))

## [1.16.0](https://github.com/jurislm/jurislm-tools/compare/v1.15.3...v1.16.0) (2026-04-11)


### 🚀 New Features

* improve claude-code-review prompt with full file context and severity levels ([9a92e39](https://github.com/jurislm/jurislm-tools/commit/9a92e39a8600ef2019541e3650ae89d002511fe7))
* refactor pr-review-loop to use Monitor tool for event-driven CI watching ([#49](https://github.com/jurislm/jurislm-tools/issues/49)) ([30e1589](https://github.com/jurislm/jurislm-tools/commit/30e1589dd733ccbfce5668f75ad56d6e15aac092))


### 🐛 Bug Fixes

* remove unnecessary permissions from claude-code-review workflow ([94a2bef](https://github.com/jurislm/jurislm-tools/commit/94a2bef96b8fed9769b93c563b64c43d1f3aedcb))
* restore id-token:write permission required by claude-code-action ([2130021](https://github.com/jurislm/jurislm-tools/commit/2130021c7d06d6d4f36f8bf16c732f7a69b29027))

## [1.15.3](https://github.com/jurislm/jurislm-tools/compare/v1.15.2...v1.15.3) (2026-04-10)


### 🐛 Bug Fixes

* rename pr command to pr-review for autocomplete visibility ([#47](https://github.com/jurislm/jurislm-tools/issues/47)) ([2639534](https://github.com/jurislm/jurislm-tools/commit/26395340bb038ff7106a415a0f6e6ec3970c0b4c))

## [1.15.2](https://github.com/jurislm/jurislm-tools/compare/v1.15.1...v1.15.2) (2026-04-10)


### 🐛 Bug Fixes

* remove redundant skills/commands fields from plugin.json ([#45](https://github.com/jurislm/jurislm-tools/issues/45)) ([66cd013](https://github.com/jurislm/jurislm-tools/commit/66cd0131c6ef6b15dd174f36d2daca5791df5e78))

## [1.15.1](https://github.com/jurislm/jurislm-tools/compare/v1.15.0...v1.15.1) (2026-04-10)


### 🐛 Bug Fixes

* add skills and commands discovery to plugin.json ([#43](https://github.com/jurislm/jurislm-tools/issues/43)) ([4966955](https://github.com/jurislm/jurislm-tools/commit/496695549feaa8f6f9cf82695a4ff2a497df5a7f))

## [1.15.0](https://github.com/jurislm/jurislm-tools/compare/v1.14.0...v1.15.0) (2026-04-10)


### 🚀 New Features

* add pr-review-loop skill and /jt:pr command ([#39](https://github.com/jurislm/jurislm-tools/issues/39)) ([671a772](https://github.com/jurislm/jurislm-tools/commit/671a7721da2149b6ef565696e96e9fbfcb036b5c))
* **repo-standards:** add .github/copilot-instructions.md standard ([#41](https://github.com/jurislm/jurislm-tools/issues/41)) ([2cbdcfb](https://github.com/jurislm/jurislm-tools/commit/2cbdcfbb3606d22c8fcd80e5ff87b9c6b1dd8adc))


### 🐛 Bug Fixes

* 修正 pr-review-loop CI pending 邏輯為前置等待模式 ([#42](https://github.com/jurislm/jurislm-tools/issues/42)) ([c329d1d](https://github.com/jurislm/jurislm-tools/commit/c329d1d3b86369cfb062989a3334ad45dc60deff))

## [1.14.0](https://github.com/jurislm/jurislm-tools/compare/v1.13.0...v1.14.0) (2026-04-10)


### 🚀 New Features

* 新增 jt:langfuse plugin — Langfuse MCP 可觀測性工具集 ([d157408](https://github.com/jurislm/jurislm-tools/commit/d15740825abce7d68be44537716fe1627022da73))
* 新增 jt:langfuse plugin 並將所有 MCP server 改用 [@latest](https://github.com/latest) ([f0ce146](https://github.com/jurislm/jurislm-tools/commit/f0ce14655b5c46ee0bc8b716e009e0c3489eff18))


### 🐛 Bug Fixes

* 所有 MCP server 改用 [@latest](https://github.com/latest) 版本 ([f01e1d4](https://github.com/jurislm/jurislm-tools/commit/f01e1d4af4140f56456ec663e76c7a91caa782a2))

## [1.13.0](https://github.com/jurislm/jurislm-tools/compare/v1.12.0...v1.13.0) (2026-04-10)


### 🚀 New Features

* add commands directory and fix plugin structure compliance ([ff31250](https://github.com/jurislm/jurislm-tools/commit/ff31250f49204c2889fb43497b772a3db0fabf8c))
* plugin structure compliance + slash commands ([0bc7fa1](https://github.com/jurislm/jurislm-tools/commit/0bc7fa1eda11bd31bff3948a1622415c4a090ed2))
* rename plugin from jurislm-tools to jt — enables /jt:xxx slash commands ([95892a8](https://github.com/jurislm/jurislm-tools/commit/95892a813bea3fc2a56b188529db2db615b3651e))


### 📚 Documentation

* update repo-standards — wire workflow to config-file, remove emoji from changelog sections ([8de4222](https://github.com/jurislm/jurislm-tools/commit/8de4222074974ca3b265e909eea24dcb594f1397))

## [1.12.0](https://github.com/jurislm/jurislm-tools/compare/v1.11.1...v1.12.0) (2026-04-09)


### 🚀 New Features

* add develop worktree workflow rule to repo-standards skill ([0021bc5](https://github.com/jurislm/jurislm-tools/commit/0021bc58a43925c072a9ab2c5cfdb059c63df8f4))
* add develop worktree workflow rule to repo-standards skill ([018f3a8](https://github.com/jurislm/jurislm-tools/commit/018f3a8377844bf5942f795eb8035f44ddec34d2))


### 🐛 Bug Fixes

* update repo-standards skill — release-type must not be in workflow ([370e146](https://github.com/jurislm/jurislm-tools/commit/370e146f4baaa4cf0b8011b95102e42cff0c6e85))
* update repo-standards skill — release-type must not be in workflow when using extra-files ([5cda142](https://github.com/jurislm/jurislm-tools/commit/5cda1420e036236e13ecb7af9a199c9925cf3e93))

## [1.11.1](https://github.com/jurislm/jurislm-tools/compare/v1.11.0...v1.11.1) (2026-04-09)


### 🐛 Bug Fixes

* remove release-type from workflow — let release-please-config.json drive extra-files ([fccb20d](https://github.com/jurislm/jurislm-tools/commit/fccb20d413a6f99682a1de8aefe92eee4f29a068))

## [1.11.0](https://github.com/jurislm/jurislm-tools/compare/v1.10.0...v1.11.0) (2026-04-09)


### Features

* update CLAUDE.md — add repo-standards and codebase-sync skills to structure ([5d1d0dc](https://github.com/jurislm/jurislm-tools/commit/5d1d0dccaec28a0a3e62a5ab699431fa79fd177a))

## [1.10.0](https://github.com/jurislm/jurislm-tools/compare/v1.9.2...v1.10.0) (2026-04-09)


### Features

* add codebase-sync skill ([ad56ed5](https://github.com/jurislm/jurislm-tools/commit/ad56ed5bd01be440446adb2aba9fb5206e78f997))
* add codebase-sync skill — explore and update README/CLAUDE.md ([7cba889](https://github.com/jurislm/jurislm-tools/commit/7cba8890c4c69c1f71669f5f72d392296548149c))
* add lint-config skill — ESLint 統一設定規範 ([e98f44d](https://github.com/jurislm/jurislm-tools/commit/e98f44df5918d6f3043157ce37f700550d1b1483))
* add release-workflow skill ([e055262](https://github.com/jurislm/jurislm-tools/commit/e055262eedd1acd4384f26d8128712a28982542a))
* merge release-workflow + lint-config into repo-standards skill ([ac7819e](https://github.com/jurislm/jurislm-tools/commit/ac7819e62f7749cb488fe3b9d50ff3face184c8d))
* repo-standards skill + rename marketplace to jurislm-tools ([632d2cb](https://github.com/jurislm/jurislm-tools/commit/632d2cbdcc4bd1fc219b76ee1d7558d52f281cbe))

## [1.9.2](https://github.com/jurislm/jurislm-tools/compare/v1.9.1...v1.9.2) (2026-04-08)


### Bug Fixes

* **deps:** bump version to 1.10.0 — coolify [@3](https://github.com/3) + hetzner npm ([97cbbc2](https://github.com/jurislm/jurislm-tools/commit/97cbbc2d188f5be4a4bea5ae3ca4cc36c7a38615))

## [1.9.1](https://github.com/jurislm/jurislm-tools/compare/v1.9.0...v1.9.1) (2026-04-08)


### Bug Fixes

* **deps:** MCP Server 版本升級 — coolify [@3](https://github.com/3) + hetzner npm 發布 ([1d14ca4](https://github.com/jurislm/jurislm-tools/commit/1d14ca488dc7f508893177ea76b1e8c20b62a88e))

## [1.9.0](https://github.com/jurislm/jurislm-tools/compare/v1.8.0...v1.9.0) (2026-04-06)


### Features

* switch hetzner MCP to fork github:jurislm/hetzner-mcp#v1.0.0 ([db57a10](https://github.com/jurislm/jurislm-tools/commit/db57a10f10c8726a06c3eb9f3769bcf9a7983b8f))


### Bug Fixes

* align plugin.json and SKILL.md frontmatter with official Claude Code spec ([#19](https://github.com/jurislm/jurislm-tools/issues/19)) ([9c03560](https://github.com/jurislm/jurislm-tools/commit/9c03560644090a6316dde3aa436f615dafc3fc13))

## [1.8.0](https://github.com/terry90918/jurislm-claude-plugins/compare/v1.7.0...v1.8.0) (2026-04-02)


### Features

* add .plugin bundles for all plugins ([ae8e170](https://github.com/terry90918/jurislm-claude-plugins/commit/ae8e1707d2463b79a2e19c1b8a33e39b0f28b72e))
* add jurislm-claude-plugins-stock-expert v1.3.0 ([b556050](https://github.com/terry90918/jurislm-claude-plugins/commit/b556050cf6cb47860c0e3a813d8c3f5b055f8982))
* **entire:** 新增 /laws 頁面架構、法規 API、embedding provider 切換說明 (v4.3.0) ([6f11344](https://github.com/terry90918/jurislm-claude-plugins/commit/6f113448ebf5e5b038fdc070e15d6cfeda852415))
* **entire:** 更新 entire-shared-sync SKILL.md v1.3.0 → v1.4.0 ([d9b2f2d](https://github.com/terry90918/jurislm-claude-plugins/commit/d9b2f2d35346e1ff5bd7aeafb9131e1848c22206))
* restore entire & lawyer plugins, merge stock into stock-expert v4.1.0 ([e53ab2c](https://github.com/terry90918/jurislm-claude-plugins/commit/e53ab2ca58c653f4cbb67517a07e46aa8cf80cdf))
* **stock-expert:** add jurislm-claude-plugins-stock-expert plugin v1.3.0 ([2a9c133](https://github.com/terry90918/jurislm-claude-plugins/commit/2a9c133b46454aa9aff71e490bf2a09391c96e52))
* **stock-expert:** update plugin.json and .mcp.json for improved requirements and argument handling ([4793668](https://github.com/terry90918/jurislm-claude-plugins/commit/4793668020a11bbfe2b10e8c46ef92ed329a704e))
* upgrade stock-expert to v4.0.0, add notion-workflow and podcast-to-blog plugins ([0604c0e](https://github.com/terry90918/jurislm-claude-plugins/commit/0604c0e69a05e8a8d4fa0b540fd4e400a020efaa))


### Bug Fixes

* **github-release:** correct Claude Code Review to claude_args approach ([37b1a9b](https://github.com/terry90918/jurislm-claude-plugins/commit/37b1a9b11c3c5402326109ffc708f2bc4174b0e5))
* **github-release:** update Claude Code Review to two-step approach ([d396ab5](https://github.com/terry90918/jurislm-claude-plugins/commit/d396ab547b0b289cea193f5dd5aa04c4071905c1))
* **stock-expert:** remove unsupported requirements field from plugin.json ([486accf](https://github.com/terry90918/jurislm-claude-plugins/commit/486accfa184d822de6983c60c61019b7f173f6f1))
* **stock-expert:** use ${CLAUDE_PLUGIN_ROOT} in .mcp.json, rebuild all .plugin bundles ([a400364](https://github.com/terry90918/jurislm-claude-plugins/commit/a400364c1b08b41a7dacdb50e4e1a77eed3f0282))

## [1.7.0](https://github.com/terry90918/jurislm-claude-plugins/compare/v1.6.1...v1.7.0) (2026-02-22)


### Features

* **github-release:** 使用 PR labels 產生 Release Notes 分類 ([#13](https://github.com/terry90918/jurislm-claude-plugins/issues/13)) ([adacf3f](https://github.com/terry90918/jurislm-claude-plugins/commit/adacf3f2b6f25dc57a4f34e9afc53bc9d6e627e5))

## [1.6.1](https://github.com/terry90918/jurislm-claude-plugins/compare/v1.6.0...v1.6.1) (2026-02-22)


### Bug Fixes

* claude-code-review 補上 pull-requests: write 權限 ([6684fd0](https://github.com/terry90918/jurislm-claude-plugins/commit/6684fd0c5de905c9a245593370d075cc32d3727d))
* issues 權限調整為 write（claude & claude-code-review workflows） ([6b81e00](https://github.com/terry90918/jurislm-claude-plugins/commit/6b81e00410cca452740f5243ad35c2ab9898a07c))

## [1.6.0](https://github.com/terry90918/jurislm-claude-plugins/compare/v1.5.0...v1.6.0) (2026-02-22)


### Features

* hetzner MCP + Skill 與文檔維護 ([e0cfe1d](https://github.com/terry90918/jurislm-claude-plugins/commit/e0cfe1d5278da952044cff2411e47f2f845cca65))
* **hetzner:** 新增 hetzner skill，升級為 MCP + Skill (v1.3.0) ([43af2eb](https://github.com/terry90918/jurislm-claude-plugins/commit/43af2eb42af9fe0f2076c044ba97342040d87f44))

## [1.5.0](https://github.com/terry90918/jurislm-plugins/compare/v1.4.0...v1.5.0) (2026-02-12)


### Features

* **github-release:** 新增 Husky pre-commit 設定與 5 個參考檔案 ([0f8b58e](https://github.com/terry90918/jurislm-plugins/commit/0f8b58e24d7579ffd25e740b4842fa3fa6e0a31f))
* **lessons-learned:** 新增 3 個資料匯入經驗模式 (v1.7.0) ([accc138](https://github.com/terry90918/jurislm-plugins/commit/accc138d8e376c6d9056334bc972dcb284373cd0))
* 新增模式 68 staging 防護 + jurislm-dev dashboard staging 文件 ([70d5822](https://github.com/terry90918/jurislm-plugins/commit/70d58223fe10d78834dcc39edae4670c617e7733))


### Bug Fixes

* **lessons-learned:** 同步更新 description 與模式數量 ([10bdb08](https://github.com/terry90918/jurislm-plugins/commit/10bdb08c6cf5b382341b13e831e65093d3aa7a86))
* 更新 Dashboard dev URL dashboard-staging → dashboard-dev ([e2771ce](https://github.com/terry90918/jurislm-plugins/commit/e2771cefdd78855dd29296dad3acb313c0481bc9))

## [1.4.0](https://github.com/terry90918/jurislm-plugins/compare/v1.3.0...v1.4.0) (2026-02-09)


### Features

* **lawyer:** v1.2.0 全面更新 SKILL.md 與 deployment 文件反映 codebase 現狀 ([c63d972](https://github.com/terry90918/jurislm-plugins/commit/c63d972fbeacb0c1d2aa35716e6746c97bb60220))
* 新增 5 個經驗模式並更新 stock/lessons-learned plugins ([37ae04a](https://github.com/terry90918/jurislm-plugins/commit/37ae04abd36549c45f4a25e7cc722620000c0a1f))


### Bug Fixes

* 修正 lessons-learned 模式計數與描述一致性 ([0428933](https://github.com/terry90918/jurislm-plugins/commit/04289335de12133e3faa3d5af3cde38cbae14299))

## [1.3.0](https://github.com/terry90918/jurislm-plugins/compare/v1.2.0...v1.3.0) (2026-02-09)


### Features

* CLAUDE.md 繁體中文化 + 新增 staging 保護與 Cloudflare WAF 經驗模式 ([19a42ec](https://github.com/terry90918/jurislm-plugins/commit/19a42ecef18ef1927cd5ee6dcf417dd2bc3e5e0b))
* 更新三個 plugins 反映 Dashboard 與 merge 經驗 ([5d832ac](https://github.com/terry90918/jurislm-plugins/commit/5d832ac06192be6c2c6b2dbf29be60784c3210f8))

## [1.2.0](https://github.com/terry90918/jurislm-plugins/compare/v1.1.0...v1.2.0) (2026-02-09)


### Features

* **lessons-learned:** 新增 PR [#134](https://github.com/terry90918/jurislm-plugins/issues/134) review 7 個經驗模式（43-49） ([96ca571](https://github.com/terry90918/jurislm-plugins/commit/96ca57177d9923dde18786db2ffad6544856f035))
* **lessons-learned:** 新增模式 43 Payload CMS Production Migration 教訓 ([425052c](https://github.com/terry90918/jurislm-plugins/commit/425052c141cfd846afb48f9e9bda6ee2945fb06a))
* **lessons-learned:** 新增雲端遷移與環境配置 6 個模式（37-42） ([d96343f](https://github.com/terry90918/jurislm-plugins/commit/d96343f4adb3afcf48bb6600db0da84aeeadf4cb))

## [1.1.0](https://github.com/terry90918/jurislm-plugins/compare/v1.0.0...v1.1.0) (2026-02-09)


### Features

* 新增 github-release plugin（標準化 GitHub Actions 工作流） ([1849f18](https://github.com/terry90918/jurislm-plugins/commit/1849f183f1e0fd70cd3928ddf6d8d90a40c1341d))
* 新增 jurislm plugin（3 skills 從 project 遷移 + Unified Agent 更新） ([b7adff2](https://github.com/terry90918/jurislm-plugins/commit/b7adff252a0c8c7f9992a1cabf60ec14929c8fd4))
* 新增 lessons-learned plugin（33+ 跨專案開發經驗模式庫） ([de477d7](https://github.com/terry90918/jurislm-plugins/commit/de477d76c6dc5a2c1278bc69a7d81479e11416fa))

## 1.0.0 (2026-02-09)


### Features

* 新增 lawyer plugin — 律師事務所網站開發 Skill ([bba76b5](https://github.com/terry90918/jurislm-plugins/commit/bba76b593d68a209dfa419c9e913c664dc1fbd21))
* 新增 stock plugin（台股看盤應用開發 Skill） ([058f52f](https://github.com/terry90918/jurislm-plugins/commit/058f52f48e6525f8173dcc7732ef5b776fe8caf4))


### Bug Fixes

* **coolify:** 改用 npm 包 jurislm-coolify-mcp 取代不穩定的 github: 引用 ([cb27a34](https://github.com/terry90918/jurislm-plugins/commit/cb27a341ac280725a7a3468e9ad38aaf601bd82b))
* Switch to forked coolify-mcp with fqdn-&gt;domains fix ([7b47edb](https://github.com/terry90918/jurislm-plugins/commit/7b47edb410d53d2c2e77b7ec4224d1a88b4e75bc))
* Use correct env var HETZNER_API_TOKEN ([e92f96c](https://github.com/terry90918/jurislm-plugins/commit/e92f96cbe7cc9f82be02cd192299609597c09163))
