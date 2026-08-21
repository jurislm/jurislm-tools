# Repo Standards Plugin Detail

## Purpose

描述 `repo-standards` plugin 的設計內容，審查並套用 JurisLM 各 repo 的統一設定規範，涵蓋 Release workflow、ESLint、Git worktree、Bun runtime 與 Vitest 設定。

## 變更追蹤與 Code Review

預設以 Linear issue 作為需求、範圍、驗收標準與交付狀態的唯一紀錄；不建立、不引用、
也不依賴 GitHub Issue。跨 repo adoption target 與相依關係用 Linear 的 project 與 issue
blocks／blocked-by 表示。只有使用者明確要求 Spectra／OpenSpec 時才改用四件套
（`spectra --version` → 必要時 `spectra init` → `proposal`／`design`／`specs`／`tasks`），
兩套不混用。

PR review 與 merge 以目標 repo 自身 `CLAUDE.md` 為唯一操作契約；缺少時先採用
repo-standards packaged `review-orchestration-template.md` 並依 target 客製化。契約中
invoke `superpowers:requesting-code-review`、以
`superpowers:receiving-code-review` 處置 findings、resolve threads，並通過 CI、
mergeability 與外部 review gates。`repo-standards` 只負責設定 CodeRabbit 的一次明確
App review、Copilot 指示與無自動 Claude review pipeline 等前置條件。

目標 repo 使用 `engineering-delivery` 時，本地 review 由該 Skill 發起並擁有；外部 review
交給 `coderabbit:code-review` skill，不另起第二套審查機制。

## 產物

| 產物 | 路徑 | 說明 |
|------|------|------|
| `repo-standards` skill | `plugins/repo-standards/skills/repo-standards/SKILL.md` | 規範主體 |
| `/repo-standards` command | `plugins/repo-standards/commands/repo-standards.md` | 入口 command |
| review orchestration template | `plugins/repo-standards/skills/repo-standards/references/review-orchestration-template.md` | 寫入 target `CLAUDE.md` 的可攜 review 契約 |
| code-review-setup reference | `plugins/repo-standards/skills/repo-standards/references/code-review-setup.md` | Copilot 自訂指示設定（自動 Claude review 已移除，2026-06-02）|
| eslint-templates reference | `plugins/repo-standards/skills/repo-standards/references/eslint-templates.md` | ESLint 設定模板 |
| ci-workflow-templates reference | `plugins/repo-standards/skills/repo-standards/references/ci-workflow-templates.md` | Flat-repo 與 monorepo Drone CI 模板 |

## Repo 分類

| 類型 | 適用 Repo | release-type | Runtime | ESLint 基礎 |
|------|---------|-------------|---------|------------|
| Next.js | lawyer, stock | `node` | Bun | `eslint-config-next` |
| Node/TS | coolify-mcp, hetzner-mcp, langfuse-mcp, judicial-mcp | `node` | Bun | `@eslint/js` + `typescript-eslint` |
| Plugin | jurislm-tools, jurislm-plugins | `simple` | — | 無 TS 原始碼，不需要 ESLint |
| Monorepo | entire | `node` | Bun | `@entire/eslint-config` |

## 參考實作與導入狀態

`jurislm/entire` 的 current `main` 是 release delivery 與 monorepo CI/CD
不變量的唯一已驗證 reference。其他 repo 在自己的 acceptance evidence 完成前
都是 adoption target，不得因為複製 `entire` 的拓撲或模板就標示為已符合標準。

每個採用標準的 repo 都必須留下四段可回讀的紀錄：

1. **Source fact**：從哪個目前原始檔或 pipeline 觀察到什麼事實。
2. **Prevented failure**：這個事實要防止哪一種具體失敗。
3. **Local rule**：本 repo 用哪條設定、程式或流程規則落實。
4. **Observable acceptance**：用哪個可重現的測試、CI 結果或 runtime readback 證明。

## CI/CD 模板同步

`references/ci-workflow-templates.md` 的「標準模板 A」（flat repo）是獨立的
adoption template：每個 pipeline 必須有自己的失敗防護理由與本 repo acceptance，
不得把未驗證的採用 repo 當成 reference。模板 A 的 YAML 與理由必須一致，例如主張
build-only failure 需要獨立攔截時，範例就必須包含 `build` pipeline。

「標準模板 B」（monorepo）只以 `jurislm/entire` current `main` 為已驗證來源，
目前必須列出 `.drone.yml` 的十二個 pipeline：

`lint-typecheck`、`cli`、`app`、`module`、`package`、`release`、`build`、
`deploy`、`release-pr-auto-merge`、`detect-missed-push-builds`、
`audit-missed-builds`、`audit-shared-migration-drift`。

模板 B 的清單變動必須以 `entire` 最新原始檔重新核對並回填；其他 repo 的 pipeline
數量或名稱不同時，記錄差異與自己的 observable acceptance，不得靜默宣稱已對齊。

## Monorepo CI scope 與 cache

- 每個 JurisLM monorepo 必須使用 Turborepo，根目錄必須有 `turbo.json`，跨 workspace
  scripts 由 Turbo 統一管理。
- 已知且固定的 workspace 邊界使用 Turbo `--filter` 明確指定；`--filter` 不是
  受 Git diff 影響的自動判定。
- `--affected` 只有在可信任的 Git base/head 已建立且有來源紀錄時才能使用。
- Git base/head 不存在、不可信，或 affected query 失敗時，必須回退完整 validation
  或完整 deploy，不得回報 unaffected success。
- Turbo task 的 inputs 必須涵蓋 task 實際讀取的所有 source、config、test 檔案；否則
  變更被讀取的檔案時不得接受舊 cache 結果。

### Release PR 自動合併契約

採用 Release Please 的 repo 必須由 trusted `main` delivery 觸發
`release-pr-auto-merge`，並等待同一 delivery commit 的 validation 與 release gates
成功後才取得合併資格。Validator 必須驗證 repo 專屬的 closed artifact contract：只允許
設定內的 manifest、CHANGELOG、版本檔與 metadata，拒絕 extra、missing、deleted 或
semantic drift；並驗證 candidate identity、base／head SHA、required-check clean 狀態，以及
GitHub branch protection 或 ruleset 對 automation credential 強制 latest-base check，且 release PR
沒有人工 approval gate。最後只能呼叫帶剛驗證 head SHA 的 GitHub PR merge API，不可直接寫 main ref。

若 candidate 等待 mergeability 時，或 GitHub 拒絕 protected PR merge 後，reread 顯示 main
已不是觸發本次 delivery 的 commit，這次 validator 必須成功 no-op，不得合併過時 candidate。其他 identity、artifact、版本、SHA、
protection、required-check、API 或 mergeability 異常一律 fail closed。不得提供人工合併 fallback；
所有帶 GitHub write credential 的 Release Please command 都必須鎖定該 repo 選定的 exact executable version。

### Release eligibility 的 mainline 與 merge mode

發布資格的 Compare target 必須是 immutable `DRONE_COMMIT`，不是 mutable branch name。
Compare 回傳的是可到達提交集合；閘門要從此 delivery 沿 first-parent mainline 回到
已發布 tag 的 base，只檢查真正落在 main 的 delivery subject。side branch 的 red/green
測試提交不能被當成 main 歷史。任何遺失、斷裂或循環的 first-parent path 都 fail closed。

每個 target 必須在啟用流程前 readback target-compatible merge mode。採 Conventional
Commit eligibility 的 repo 預設使用 squash-only，並讓 pull-request title 成為 squash
title；若因 target 現況需要讀 GitHub default merge body，必須精確驗證 GitHub merge
subject 與 body title，且只能作已存在歷史的相容性 recovery，不能成為人工 fallback。

## Git Worktree 規則（JurisLM 統一標準）

GitHub Flow 單段式：main worktree 根目錄必須永遠在 `main` 分支，每個需求／功能直接從 `main` 建立獨立 feature worktree，沒有 `develop` 分支：

```
<repo>/                        ← main worktree（只在 main 分支）
<repo>/.claude/worktrees/
  <change-name>/               ← feature worktree（需要時建立，直接基於 main）
```

**強制規則**：
- 嚴禁直接 push 到 main（連接 Coolify 自動部署 + Release Please）
- 沒有 `develop` 分支：不建立、不維護；PR 一律直接 `<change-name> → main`
- feature worktree 目錄名稱必須與 branch 名稱一致（branch 名稱含 `/` 時目錄以 `-` 替代，例：`feature/auth` → `.claude/worktrees/feature-auth`）
- `.claude/worktrees/` 透過本地 `.git/info/exclude` 排除，不進 `.gitignore`；`.prettierignore`／ESLint／`vitest.config.ts` 仍需各自加入 `.claude/worktrees/**`

## Release Please 設定

所有 repo 使用 Release Please 自動版本管理：
- `feat:` → minor bump
- `fix:` → patch bump
- `docs:` / `chore:` → 不觸發版本升級

Plugin repo（`release-type: simple`）特別規則：
- 新增 skill、更新 skill 內容 → `feat:`
- 修正錯誤資訊 → `fix:`
- 純格式整理 → `docs:` 或 `chore:`（不觸發）

### Drone release-pr 資格閘門

使用 `release-type: simple` 且以 Drone 執行 Release Please 的 Plugin repo，必須將
`scripts/release-eligibility.mjs` 與其測試一同納入 repo。`release-please` pipeline
必須先無條件執行 `github-release`，再由 `release-pr` 讀取 `.release-please-manifest.json`、
`DRONE_REPO`、`DRONE_BRANCH`、`DRONE_COMMIT`，透過已驗證身分的 GitHub Compare API 取得
從已發布 tag 到 immutable delivery SHA 的可到達提交。資格閘門只走該 SHA 的 first-parent
mainline，不把 side branch 的提交當成 release subject。只有這條 mainline 含有有效的 `feat`
或 `fix` subject 時，才可呼叫 Release Please 建立或更新 release PR。

- 沒有提交，或只有有效的 `docs`／`chore` → exit `10`，成功跳過 `release-pr`。
- 缺少 metadata、token、manifest 版本、Compare page、回應資料或有效 subject → 非 `10`
  的錯誤，pipeline fail closed，不得呼叫 Release Please。
- `RELEASE_PLEASE_TOKEN` 只能透過 Drone secret indirection 提供，任何輸出不得包含 token。
- 範本必須使用 Drone 提供的 `DRONE_REPO`、`DRONE_BRANCH`、`DRONE_COMMIT`，不得把 consumer repo 名稱或 mutable Compare target 寫死。

## 觸發條件

使用者詢問「如何設定新 repo」、「release workflow 怎麼寫」、「worktree 怎麼設定」、「ESLint config 怎麼寫」、AGENTS.md 與 CLAUDE.md 同步、Drone/deploy gating、Bun/Vitest、code review workflow，或需要設定 JurisLM 系列 repo 的標準化時啟動。

## 與其他 plugin 的關係

- 設定完成後建議執行 `codebase-sync` 更新 README.md / CLAUDE.md
- 詳見 [codebase-sync-detail.md](./codebase-sync-detail.md)
