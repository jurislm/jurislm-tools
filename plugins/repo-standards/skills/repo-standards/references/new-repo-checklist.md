# 新增 Repo 完整 Checklist

## Git Worktree

1. [ ] 確認 main worktree 在 `main` 分支：`git branch --show-current`
2. [ ] 建立 develop worktree：`git worktree add .worktrees/develop develop`
3. [ ] `.gitignore` 加入 `.worktrees/`
4. [ ] `.prettierignore` 加入 `.worktrees/`

## Runtime（Bun）

5. [ ] `package.json` 加 `"packageManager": "bun@1.3.14"`（與 CI Docker image `oven/bun:1.3.14` 一致）
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

> **只 gate PROD（push main）；DEV app 維持 Coolify auto-deploy**——重複部署是 prod-only（release PR / 純版號 chore 合併進 main 重觸發），dev 無此問題；且 `trigger.ref` 不含 develop，Drone 不在 develop push 建置故無法接管 dev 部署。

27. [ ] `.drone.yml` 為每個 **prod** app 加 `deploy` pipeline/step（`push` main、`depends_on: [lint-typecheck, test]`、`clone: { disable: true }`）；dev app 不設
28. [ ] `deploy` + `lint-typecheck` + `test` 各 step 加 release-commit 守衛：`echo "$DRONE_COMMIT_MESSAGE" | grep -qE '^chore(\(.+\))?: release [0-9]'`（**grep 全訊息、勿加 `head -1`**——merge commit 合併時 release 行在 body，head -1 漏判 → 誤部署）
29. [ ] Drone repo-scope secret 加 `COOLIFY_DEPLOY_TOKEN`（`pull_request: false`）
30. [ ] 先驗證 Drone→Coolify deploy API 接線可用，再**只關閉 PROD app 的 Coolify `is_auto_deploy_enabled`**（dev app 不動；避免 prod 靜默停止部署）
31. [ ] 行為驗證：feature 合併進 main → prod 部署 **1 次**；release PR 合併 → prod 部署 **0 次**；dev 不受影響；並確認合併後 push webhook 有觸發 Drone build

## Code Review（人工 + bot；無自動 Claude review）

> 2026-06-02：自動 Claude PR 審查（`claude-code-review.yml` / `claude.yml` / Drone `claude-review`）已從標準移除。

32. [ ] **人工 `/code-review`**：發 PR 前必跑多角度 review（見全域 CLAUDE.md PR 流程）
33. [ ] 建立 `.github/copilot-instructions.md`（**必須針對此 repo 客製化**，首行加入 `請使用繁體中文回覆所有問題與建議。`，並包含：project overview、git workflow、tool/module 分類、key design decisions、code conventions、code review 重點、auto-generated files 列表）；CodeRabbit 為 PR 自動回審，獨立運作無需設定
34. [ ] 視需要在 `.github/instructions/` 建立路徑特定指示（加 `applyTo` frontmatter）

## 發版收尾（每次合併 develop→main 後必做）

> 對應全域 CLAUDE.md「合併 develop → main 後」+ 模式 95。詳見 `references/ci-workflow-templates.md`「部署收尾」。

35. [ ] **確認 CI 真的被觸發**：合併後查 `gh api repos/jurislm/<repo>/hooks/<id>/deliveries`（push 事件是否送達）+ Drone builds list 有對應 commit 的 push build（GitHub 偶爾漏發 push webhook）
36. [ ] **合併 release-please 自動開的 release PR**（`chore(main): release X.Y.Z`），否則 tag / 版本永遠不 cut
37. [ ] release PR 合併後再次確認其 push build 觸發 + `github-release` 有跑（tag 已建）；漏發則手動 `release-please github-release`（冪等）
38. [ ] 依模式 95 把 `develop` 重新同步至 `main`（避免 squash/merge 後分歧）
