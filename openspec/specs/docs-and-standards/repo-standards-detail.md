# Repo Standards Plugin Detail

## Purpose

描述 `repo-standards` plugin 的設計內容，審查並套用 JurisLM 各 repo 的統一設定規範，涵蓋 Release workflow、ESLint、Git worktree、Bun runtime 與 Vitest 設定。

## 產物

| 產物 | 路徑 | 說明 |
|------|------|------|
| `repo-standards` skill | `plugins/repo-standards/skills/repo-standards/SKILL.md` | 規範主體 |
| `/repo-standards` command | `plugins/repo-standards/commands/repo-standards.md` | 入口 command |
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

## CI/CD 模板同步

`references/ci-workflow-templates.md` 的「標準模板 A」（flat repo）獨立成立，不鏡像任何特定 repo；「標準模板 B」（monorepo）明確以 `jurislm/entire` 的 `.drone.yml` 為準鏡像。兩者都必須與各自的參考事實保持同步，而非只在初次撰寫時對過一次：

- 模板 A 列出的每個 pipeline 都要有獨立成立的理由（不依賴「因為 entire 有」），且範例 YAML 與該理由所需的 pipeline 名稱一致——例如若文件主張「build-only 失敗需要獨立 pipeline 攔截」，範例就必須包含 `build` pipeline，不能只在文字論述，YAML 卻沒有
- 模板 B 的 pipeline 清單／計數必須與 `entire/.drone.yml` 目前實際內容一致；若 entire 新增或移除 pipeline，模板 B 需要同步更新，或至少明確標註「已知落後、待更新」而非讓讀者誤以為清單是最新的
- 2026-08-07 教訓：entire 於 2026-06-02（`build` pipeline）與 2026-07-21（`release-pr-auto-merge` pipeline）兩次演進都沒有回填進模板 A／B，落差直到 `jurislm/musicer` 設定 CI 時才被發現——這正是 skill 自己文件內定義的「規範回填協議」要防止的情況，本次修正後應作為未來審查這兩個模板時的檢查基準

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
`DRONE_REPO` 與 `DRONE_BRANCH`，透過已驗證身分的 GitHub Compare API 取得從已發布 tag
到目前分支的完整提交範圍。只有完整範圍含有有效的 `feat` 或 `fix` subject 時，才可呼叫
Release Please 建立或更新 release PR。

- 沒有提交，或只有有效的 `docs`／`chore` → exit `10`，成功跳過 `release-pr`。
- 缺少 metadata、token、manifest 版本、Compare page、回應資料或有效 subject → 非 `10`
  的錯誤，pipeline fail closed，不得呼叫 Release Please。
- `RELEASE_PLEASE_TOKEN` 只能透過 Drone secret indirection 提供，任何輸出不得包含 token。
- 範本必須使用 Drone 提供的 `DRONE_REPO`／`DRONE_BRANCH`，不得把 consumer repo 名稱寫死。

## 觸發條件

使用者詢問「如何設定新 repo」、「release workflow 怎麼寫」、「worktree 怎麼設定」、「ESLint config 怎麼寫」、AGENTS.md 與 CLAUDE.md 同步、Drone/deploy gating、Bun/Vitest、code review workflow，或需要設定 JurisLM 系列 repo 的標準化時啟動。

## 與其他 plugin 的關係

- 設定完成後建議執行 `codebase-sync` 更新 README.md / CLAUDE.md
- 詳見 [codebase-sync-detail.md](./codebase-sync-detail.md)
