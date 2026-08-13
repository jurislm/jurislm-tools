# 新增 Repo 完整 Checklist

> Reference status：`jurislm/entire` 是唯一已驗證的 release-delivery 與 monorepo CI/CD reference；其他 repo 都是 adoption target，必須完成自己的 observable acceptance 後才能標示符合。

## Agent 指引檔

1. [ ] 若 repo 內存在 `AGENTS.md`，更新為讀取同層 `CLAUDE.md`；若同層沒有 `CLAUDE.md`，則讀取 repo 根目錄 `CLAUDE.md`
2. [ ] 不把 `CLAUDE.md` 全文複製進 `AGENTS.md`，避免兩份規範 drift
3. [ ] 若 repo 內沒有 `AGENTS.md`，不主動新增，除非使用者明確要求

## Git Worktree

4. [ ] 確認 main worktree 在 `main` 分支：`git branch --show-current`
5. [ ] 不建立 `develop` 分支／worktree（GitHub Flow 單段式）：`git fetch origin main && git worktree add --no-track -b <change-name> .claude/worktrees/<change-name> origin/main`（`--no-track` 避免 upstream 誤設成 origin/main，之後一律 `git push -u origin <change-name>`；見 `SKILL.md`「Git Worktree 規則」）
6. [ ] 不將 `.claude/worktrees/` 加入 `.gitignore`（由 Claude Code runtime 透過本地 `.git/info/exclude` 自動排除）
7. [ ] `.prettierignore` 加入 `.claude/worktrees/`

## Runtime（Bun）

8. [ ] `package.json` 加 `"packageManager": "bun@1.3.14"`（與 CI Docker image `oven/bun:1.3.14` 一致）
9. [ ] `package.json` 加 `"engines": {"bun": ">=1.1.0"}`
10. [ ] scripts 使用 `bun` 指令（`bun --watch`、`bun dist/index.js` 等）
11. [ ] 移除 `tsx`、`ts-node` 等 Node.js runtime 套件
12. [ ] 加入 `@types/bun`（Node/TS repo 專用，Next.js repo 不需要）

## 測試（Vitest）

13. [ ] 安裝 vitest：`bun add -d vitest`
14. [ ] 建立 `vitest.config.ts`，`exclude` 加 `.claude/worktrees/**`
15. [ ] `package.json` scripts：`"test": "bun run vitest"`
16. [ ] 測試檔案使用 `import { describe, it, expect, vi } from 'vitest'`
17. [ ] 執行 `bun run test` 確認全通過

## Release

18. [ ] release-please pipeline（push main only，**不指定 `release-type`**）—— Drone repo（`.drone.yml`）或 plugin repo 的 GHA `release.yml`；每個 write command 必須使用 `release-please@<EXACT-RELEASE-PLEASE-VERSION>`，目標 repo 替換成經測試的精確版本；secret `RELEASE_PLEASE_TOKEN` 見項 28
19. [ ] 建立 `release-please-config.json`（依統一模板，`release-type` 寫在這裡）
20. [ ] Plugin repo：加 `extra-files`，確認目標在陣列第一位

## ESLint

21. [ ] 依類型建立 `eslint.config.mjs`（Next.js）或 `eslint.config.js`（Node/TS）
22. [ ] `package.json` 加 `"lint": "eslint --max-warnings=0"`
23. [ ] 安裝必要套件
24. [ ] 執行 `bun run lint` 確認 0 errors 0 warnings

## CI（Drone CI）

25. [ ] 建立 `.drone.yml`（依 `references/ci-workflow-templates.md` 對應 repo 類型：Coolify web app / monorepo / npm 套件 / plugin）；JurisLM monorepo 必須在 root 提供 `turbo.json`
26. [ ] 各 pipeline `trigger.ref` 只列 `refs/heads/main` + `refs/pull/*/head`（**禁止** `refs/heads/develop`，否則 push + PR 雙 build 競爭 runner）
27. [ ] 各 step `bun install --frozen-lockfile`；lint / typecheck / test 各自獨立 pipeline（各自 clone + install）；monorepo 已知 fixed workspace gate 用 `--filter`，只有 trustworthy Git base／head 才能用 `--affected`，無法建立時執行 full validation／full deployment；Turbo cache inputs 必須涵蓋 task 讀取的全部 source/config/test/lockfile
28. [ ] Drone repo-scope secret 加 `RELEASE_PLEASE_TOKEN`（release-please pipeline 用）
29. [ ] 開 PR 確認 GitHub 只顯示 1 個 aggregated check（`drone/pr`），且 push develop **不** build

## CD（部署 — 僅 Coolify web app；npm / MCP repo 跳過此段）

> **只 gate PROD（push main）；DEV app 維持 Coolify auto-deploy**——重複部署是 prod-only（release PR / 純版號 chore 合併進 main 重觸發），dev 無此問題；且 `trigger.ref` 不含 develop，Drone 不在 develop push 建置故無法接管 dev 部署。

30. [ ] `.drone.yml` 加 `build` pipeline（抓 lint/typecheck 抓不到的 build-only 失敗，flat repo／monorepo 皆需要，非 monorepo 專屬）
31. [ ] `.drone.yml` 為每個 **prod** app 加 `deploy` pipeline/step（`push` main、`depends_on` 含 `lint-typecheck`／`test`／`build`、`clone: { disable: true }`）；dev app 不設
32. [ ] `deploy` + `lint-typecheck` + `test` + `build` 各 step 加 release-commit 守衛：`echo "$DRONE_COMMIT_MESSAGE" | grep -qE '^chore(\(.+\))?: release [0-9]'`（**grep 全訊息、勿加 `head -1`**——merge commit 合併時 release 行在 body，head -1 漏判 → 誤部署）
33. [ ] Drone repo-scope secret 加 `COOLIFY_DEPLOY_TOKEN`（`pull_request: false`）
34. [ ] 先驗證 Drone→Coolify deploy API 接線可用，再**只關閉 PROD app 的 Coolify `is_auto_deploy_enabled`**（dev app 不動；避免 prod 靜默停止部署）
35. [ ] `.drone.yml` 加 `release-pr-auto-merge` pipeline（Coolify app 用 `depends_on: [release, deploy]`；其他 repo 綁定自身 trusted validation／release pipelines；`concurrency: { limit: 1 }`）；由 target repo 自己 source-control validator，綁定同一 delivery commit，驗證 closed artifact contract、official candidate identity、mergeability、final main-SHA recheck，並以 validated head SHA 合併
36. [ ] 行為驗證：無 candidate、candidate base 已由較新 delivery 接手、final main tip 已改變，三者都是成功 no-op；其他 mismatch fail closed；不得使用 `pull_request_target`、candidate-head execution 或 PR write token

## Code Review（人工 + bot；無自動 Claude review）

> 2026-06-02：自動 Claude PR 審查（`claude-code-review.yml` / `claude.yml` / Drone `claude-review`）已從標準移除。

37. [ ] **人工 `/code-review`**：發 PR 前必跑多角度 review（見全域 CLAUDE.md PR 流程）
38. [ ] 建立 `.github/copilot-instructions.md`（**必須針對此 repo 客製化**，首行加入 `請使用繁體中文回覆所有問題與建議。`，並包含：project overview、git workflow、tool/module 分類、key design decisions、code conventions、code review 重點、auto-generated files 列表）；CodeRabbit 為 PR 自動回審，獨立運作無需設定
39. [ ] 視需要在 `.github/instructions/` 建立路徑特定指示（加 `applyTo` frontmatter）

## 發版收尾（每次合併進 main 後必做）

> 詳見 `references/ci-workflow-templates.md`「部署收尾」。

40. [ ] **確認 CI 真的被觸發**：合併後查 `gh api repos/jurislm/<repo>/hooks/<id>/deliveries`（push 事件是否送達）+ Drone builds list 有對應 commit 的 push build（GitHub 偶爾漏發 push webhook）
41. [ ] **確認 release-please 自動開的 release PR**（`chore(main): release X.Y.Z`）由同一 trusted main delivery 的 validator 自動合併；release PR 不得保留 manual merge fallback，未通過時維持候選開啟並 fail closed
42. [ ] release PR 自動合併後再次確認其 push build 觸發 + 精確版本的 `github-release` 有跑（tag 已建）；若 webhook 漏發，修復 delivery 後由新的 trusted main delivery 重試，不手動執行 write command
