## 1. `SKILL.md`：Git Worktree 規則章節 + 鄰近 config 範例

- [ ] 1.1 「## Git Worktree 規則」章節（約第 60-107 行）：兩段式 develop 模型全部改寫為單段式（分支結構圖、建立規則指令、開發流程、強制規則），建立指令補上 `origin/main` start point 的 upstream-tracking 坑與修正步驟（design.md D2）
- [ ] 1.2 vitest.config.ts 標準模板（約第 212 行）：`.worktrees/**` → `.claude/worktrees/**`
- [ ] 1.3 ESLint 統一規則表格（約第 380 行）：`.worktrees/**` → `.claude/worktrees/**`
- [ ] 1.4 `.prettierignore` 必含範例（約第 399 行）：`.worktrees/` → `.claude/worktrees/`
- [ ] 1.5 「新增 Repo Checklist」快速概覽（約第 497、500 行）：Worktree bullet 改為單段式指令＋不進 `.gitignore`；ESLint bullet 的 `.prettierignore` 路徑修正

## 2. `references/new-repo-checklist.md`：Git Worktree 章節 + vitest item

- [ ] 2.1 item 4-7：item 5 的 develop worktree 步驟改為直接從 main 建立；item 6 改為「不要加進 .gitignore」（design.md D1）；item 7 路徑修正為 `.claude/worktrees/`
- [ ] 2.2 item 14（vitest exclude）：`.worktrees/**` → `.claude/worktrees/**`
- [ ] 2.3 確認 CI 章節（item 25-41，`update-repo-standards-flat-ci-templates` 現行編輯範圍）與「develop→main」之外的敘述不受本次變更影響——只讀不改

## 3. 其餘 2 個 reference 檔案（systematic grep 額外發現）

- [ ] 3.1 `references/eslint-templates.md`：2 處 `.worktrees/**`／`.worktrees/` → `.claude/worktrees/**`／`.claude/worktrees/`
- [ ] 3.2 `references/testing-config-templates.md`：1 處 `.worktrees/**` → `.claude/worktrees/**`

## 4. Living spec 同步

- [ ] 4.1 `openspec/specs/docs-and-standards/repo-standards-detail.md`「## Git Worktree 規則（JurisLM 統一標準）」章節：改寫為單段式，比照該檔案既有精簡敘事風格（design.md 已列查證結果）
- [ ] 4.2 `openspec/changes/update-repo-standards-worktree-model/specs/docs-and-standards/spec.md`：ADDED Requirement（已於提案階段寫好，實作階段免動）
- [ ] 4.3 `openspec validate update-repo-standards-worktree-model --strict` 確認四項 artifacts 通過

## 5. 驗收

- [ ] 5.1 `npm run validate`、`claude plugin validate .` 全通過
- [ ] 5.2 人工檢查：5 個檔案內沒有殘留「develop worktree」「`.worktrees/develop`」「`git worktree add .worktrees/develop develop`」等字樣（`grep -rn` 覆核）
- [ ] 5.3 人工檢查：5 個檔案內沒有殘留裸 `.worktrees/`（排除 `.claude/worktrees/`）路徑字串（`grep -rn` 覆核）
- [ ] 5.4 人工檢查：`SKILL.md`／`new-repo-checklist.md`／`repo-standards-detail.md` 三處對「PR 方向」「worktree 路徑」「是否有 develop」的敘述互相一致，無矛盾
- [ ] 5.5 確認本次未觸碰 `references/ci-workflow-templates.md`、`references/code-review-setup.md`（diff 核對，維持與 `update-repo-standards-flat-ci-templates` 零衝突）
