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

15. [ ] 建立 `.github/workflows/release.yml`（依標準格式，**不指定 `release-type`**）
16. [ ] 建立 `release-please-config.json`（依統一模板，`release-type` 寫在這裡）
17. [ ] Plugin repo：加 `extra-files`，確認目標在陣列第一位

## ESLint

18. [ ] 依類型建立 `eslint.config.mjs`（Next.js）或 `eslint.config.js`（Node/TS）
19. [ ] `package.json` 加 `"lint": "eslint --max-warnings=0"`
20. [ ] 安裝必要套件
21. [ ] 執行 `bun run lint` 確認 0 errors 0 warnings

## CI Workflow

22. [ ] 建立 `.github/workflows/ci.yml`（依 `references/ci-workflow-templates.md` 對應 repo 類型）
23. [ ] 確認 trigger 為 `pull_request` + `push: main` only（**禁止** `push: develop` 或其他中間分支）
24. [ ] 設定 `concurrency.group: ${{ github.workflow }}-${{ github.ref }}` + `cancel-in-progress: true`
25. [ ] 各 job 加 push-safe draft 條件：`if: github.event_name != 'pull_request' || github.event.pull_request.draft == false`（**勿**直接寫 `github.event.pull_request.draft == false`，會破壞 `push: main` safety net）
26. [ ] 開 PR 確認 CI **只跑一次**（檢查 Actions 頁面，每次 push 應只看到 1 個 run，非 2 個）

## Code Review

27. [ ] 建立 `.github/workflows/claude-code-review.yml`（`@v1`，`pull-requests: write`，6-phase prompt，含 profile switch / path filter / triage / mechanical conclusion）
28. [ ] 建立 `.github/workflows/claude.yml`（`@claude` 互動觸發，`pull-requests: write`，`issues: write`，保留 `system_prompt` 繁中設定）
29. [ ] 在 repo Settings → Secrets 加入 `CLAUDE_CODE_OAUTH_TOKEN`
30. [ ] 建立 `.github/copilot-instructions.md`（**必須針對此 repo 客製化**，首行加入 `請使用繁體中文回覆所有問題與建議。`，並包含：project overview、git workflow、tool/module 分類、key design decisions、code conventions、code review 重點、auto-generated files 列表）
31. [ ] `claude.yml` 的 `system_prompt` 設為 `"請使用繁體中文回覆所有問題與建議。"`
32. [ ] 視需要在 `.github/instructions/` 建立路徑特定指示（加 `applyTo` frontmatter）
