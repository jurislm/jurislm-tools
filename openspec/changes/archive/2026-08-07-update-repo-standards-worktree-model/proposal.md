## Why

`repo-standards`'s worktree guidance still teaches the two-stage flow jurislm-tools itself retired: main worktree fixed on `main`, daily work in `.worktrees/develop`, feature worktrees branching off `develop`, PR `feature→develop` then `develop→main`. The archived change `document-retired-develop-workflow` (PR #165/#166, closed #164) fixed this for `README.md`/`CLAUDE.md`/`openspec/config.yaml` but explicitly scoped itself out of "plugin implementation or plugin-specific documentation" — `repo-standards`'s own worktree content was never touched. Found while working on `update-repo-standards-flat-ci-templates` (#196), whose tasks.md explicitly flagged this exact gap as out of its own scope. Closes #197.

## What Changes

- `SKILL.md`「## Git Worktree 規則」章節：兩段式 develop 模型改為單段式（`.claude/worktrees/<change-name>` 直接從 `main` 建立，PR 直接 `<change-name> → main`），並補上 `git worktree add -b <name> <path> origin/main` 會誤設 upstream tracking 的已知坑（memory 記錄踩過兩次）
- `openspec/specs/docs-and-standards/repo-standards-detail.md`「## Git Worktree 規則」章節：同樣修正，比照該檔案既有的精簡敘事風格
- `references/new-repo-checklist.md`「## Git Worktree」章節（item 4-7）：develop worktree 步驟改為直接從 main 建立；修正 item 6/7 的 `.gitignore`/`.prettierignore` 指引（見下方 Decision）；item 14（vitest exclude）路徑同步修正
- `references/eslint-templates.md`、`references/testing-config-templates.md`：兩處 config 範例的 `.worktrees/**` 路徑同步修正（systematic grep 全 plugin 目錄後額外發現，同一缺陷）
- `SKILL.md` 另外 3 處鄰近 config 範例（vitest.config.ts 模板、ESLint 規則表、.prettierignore 範例）與 2 條「快速概覽」bullet，同一路徑缺陷一併修正
- `openspec/specs/docs-and-standards/spec.md` 新增一條 ADDED Requirement，讓這類落差未來可驗證

## Non-goals

- 不重動 `README.md`／`CLAUDE.md`／`openspec/config.yaml`（已由前次 change 修正）
- 不變更任何 CI/CD pipeline 內容，包含 `new-repo-checklist.md` 內已經正確的「trigger.ref 禁止 develop」「dev app 維持 Coolify auto-deploy」等段落——這是 `update-repo-standards-flat-ci-templates` 的現行範圍，本次不觸碰以避免與其並行編輯衝突
- 不變更 jurislm-tools 或任何下游 repo 實際的 `.gitignore`／`.prettierignore`／`.git/info/exclude`／`vitest.config.ts` 等檔案——本次只修正 skill 教的內容
- 不設計自動化 drift 偵測機制

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `docs-and-standards`：新增一條 requirement，要求 repo-standards 的 worktree 教學內容與目前支援的單段式分支模型一致

## Impact

純文件／內容修正，涉及 `repo-standards` plugin 內 5 個 Markdown 檔案與 1 個 OpenSpec living spec delta。不影響任何執行期行為、依賴、release 版本或已部署系統。
