# 新增 Repo 完整 Checklist

## Git Worktree

1. [ ] 確認 main worktree 在 `main` 分支：`git branch --show-current`
2. [ ] 建立 develop worktree：`git worktree add .worktrees/develop develop`
3. [ ] `.gitignore` 加入 `.worktrees/`
4. [ ] `.prettierignore` 加入 `.worktrees/`

## Runtime（Bun）

5. [ ] `package.json` 加 `"packageManager": "bun@1.3.9"`
6. [ ] `package.json` 加 `"engines": {"bun": ">=1.1.0"}`
7. [ ] scripts 使用 `bun` 指令（`bun --watch`、`bun dist/index.js` 等）
8. [ ] 移除 `tsx`、`ts-node` 等 Node.js runtime 套件
9. [ ] 加入 `@types/bun`（Node/TS repo 專用，Next.js repo 不需要）

## 測試（Vitest）

10. [ ] 安裝 vitest：`bun add -d vitest`
11. [ ] 建立 `vitest.config.ts`，`exclude` 加 `.worktrees/**`
12. [ ] `package.json` scripts：`"test": "bun run vitest"`
13. [ ] 測試檔案使用 `import { describe, it, expect, vi } from 'vitest'`
14. [ ] 執行 `bun run test` 確認全通過

## Release

15. [ ] release-please pipeline（push main only，**不指定 `release-type`**）—— Drone repo（`.drone.yml`）或 plugin repo 的 GHA `release.yml`；secret `RELEASE_PLEASE_TOKEN` 見項 25
16. [ ] 建立 `release-please-config.json`（依統一模板，`release-type` 寫在這裡）
17. [ ] Plugin repo：加 `extra-files`，確認目標在陣列第一位

## ESLint

18. [ ] 依類型建立 `eslint.config.mjs`（Next.js）或 `eslint.config.js`（Node/TS）
19. [ ] `package.json` 加 `"lint": "eslint --max-warnings=0"`
20. [ ] 安裝必要套件
21. [ ] 執行 `bun run lint` 確認 0 errors 0 warnings

## CI（Drone CI）

22. [ ] 建立 `.drone.yml`（依 `references/ci-workflow-templates.md` 對應 repo 類型：Coolify web app / monorepo / npm 套件 / plugin）
23. [ ] 各 pipeline `trigger.ref` 只列 `refs/heads/main` + `refs/pull/*/head`（**禁止** `refs/heads/develop`，否則 push + PR 雙 build 競爭 runner）
24. [ ] 各 step `bun install --frozen-lockfile`；lint / typecheck / test 各自獨立 pipeline（各自 clone + install）
25. [ ] Drone repo-scope secret 加 `RELEASE_PLEASE_TOKEN`（release-please pipeline 用）
26. [ ] 開 PR 確認 GitHub 只顯示 1 個 aggregated check（`drone/pr`），且 push develop **不** build

## CD（部署 — 僅 Coolify web app；npm / MCP repo 跳過此段）

27. [ ] `.drone.yml` 加 `deploy` pipeline（`push` main、`depends_on: [lint-typecheck, test]`、`clone: { disable: true }`）
28. [ ] `deploy` + `lint-typecheck` + `test` 各 step 加 release-commit 守衛：`echo "$DRONE_COMMIT_MESSAGE" | head -1 | grep -qE '^chore(\(.+\))?: release [0-9]'`
29. [ ] Drone repo-scope secret 加 `COOLIFY_DEPLOY_TOKEN`（`pull_request: false`）
30. [ ] 先驗證 Drone→Coolify deploy API 接線可用，再**關閉 Coolify `is_auto_deploy_enabled`**（避免 prod 靜默停止部署）
31. [ ] 行為驗證：feature 合併 → 部署 **1 次**；release PR 合併 → 部署 **0 次**；並確認合併後 push webhook 有觸發 Drone build

## Code Review（維持 GitHub Actions hybrid）

32. [ ] 建立 `.github/workflows/claude-code-review.yml`（`@v1`，`pull-requests: write`，6-phase prompt，含 profile switch / path filter / triage / mechanical conclusion）
33. [ ] 建立 `.github/workflows/claude.yml`（`@claude` 互動觸發，`pull-requests: write`，`issues: write`，保留 `system_prompt` 繁中設定）
34. [ ] 在 repo Settings → Secrets 加入 `CLAUDE_CODE_OAUTH_TOKEN`
35. [ ] 建立 `.github/copilot-instructions.md`（**必須針對此 repo 客製化**，首行加入 `請使用繁體中文回覆所有問題與建議。`，並包含：project overview、git workflow、tool/module 分類、key design decisions、code conventions、code review 重點、auto-generated files 列表）
36. [ ] `claude.yml` 的 `system_prompt` 設為 `"請使用繁體中文回覆所有問題與建議。"`
37. [ ] 視需要在 `.github/instructions/` 建立路徑特定指示（加 `applyTo` frontmatter）
