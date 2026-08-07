# Implementation verification

Date: 2026-08-07 (Asia/Taipei)

## Scope

Corrected the two-stage `develop` worktree model to single-stage GitHub Flow
in five files, plus one `docs-and-standards` living-spec delta:

- `plugins/repo-standards/skills/repo-standards/SKILL.md`: Git Worktree 規則
  章節（分支結構、建立規則、開發流程、強制規則）+ 3 處鄰近 config 範例
  （vitest.config.ts、ESLint 規則表、.prettierignore）+ 2 條快速概覽 bullet
- `plugins/repo-standards/skills/repo-standards/references/new-repo-checklist.md`:
  items 4-7（Git Worktree）+ item 14（vitest exclude）
- `plugins/repo-standards/skills/repo-standards/references/eslint-templates.md`:
  2 處
- `plugins/repo-standards/skills/repo-standards/references/testing-config-templates.md`:
  1 處
- `openspec/specs/docs-and-standards/repo-standards-detail.md`: Git Worktree
  規則（JurisLM 統一標準）章節
- `openspec/specs/docs-and-standards/spec.md`（delta）: 新增 1 條 ADDED
  Requirement，3 個 scenario

No plugin manifest, dependency, release-managed version, CI/CD content, or
deployment file changed.

## Content sweeps

- `grep -n '\.worktrees' <5 files> | grep -v '\.claude/worktrees'`：0 個殘留
  裸 `.worktrees/` 路徑
- `grep -rn 'develop worktree\|worktree add .worktrees/develop\|\.worktrees/develop'`：
  0 個殘留
- `git diff origin/main --stat -- references/ci-workflow-templates.md
  references/code-review-setup.md`：空輸出，確認兩個 CI 相關檔案未被觸碰
- Markdown code fence 平衡檢查（`grep -c '^```'` 逐檔為偶數）：全部 OK

## Local validation

`npm ci` exited 0 after installing 75 packages from the committed lockfile
（Node v22.23.1，符合 `^22.22.2 || ^24.15.0 || >=26.0.0`）。一項既有 high
severity audit finding 與本次變更無關（`package.json`/`package-lock.json`
未變動，`git status --short` 確認）。

`npm run validate` exited 0：
- Node test runner：108 passed, 0 failed
- Plugin repository validation：passed
- Release Please version synchronization：`1.36.1`
- Markdown lint：passed（無錯誤輸出）

`claude plugin validate .` exited 0，回報 `Validation passed`。

`openspec validate update-repo-standards-worktree-model --strict` exited 0，
回報 change valid。

## Requirement mapping

（對照 `specs/docs-and-standards/spec.md` 新增的 3 個 scenario）

- Worktree creation scenario：`SKILL.md`／`repo-standards-detail.md`／
  `new-repo-checklist.md` 三處建立指令均已改為 `.claude/worktrees/<change-name>`
  直接從 `main` 建立，無 `develop` 步驟——已用上方 content sweep 驗證無殘留
- Pull request scenario：三處開發流程／PR 方向敘述均已改為
  `<change-name> → main` 直接開 PR，無中繼 `develop` 合併步驟
- Worktree-exclude scenario：`new-repo-checklist.md` item 6 明確排除
  `.claude/worktrees/` 進 `.gitignore`；item 7、`SKILL.md`、
  `eslint-templates.md`、`testing-config-templates.md` 的 `.prettierignore`／
  ESLint／vitest exclude 範例均已改為 `.claude/worktrees/**`（或對應工具語法）

## Non-scope confirmation

`update-repo-standards-flat-ci-templates`（尚未 merge）現行編輯的 CI/CD 段落
（`new-repo-checklist.md` item 25-41、`SKILL.md` CI 相關敘述、
`references/ci-workflow-templates.md`）確認本次變更零觸碰，兩個 change 的
`git diff origin/main` 修改行號區間互不重疊。
