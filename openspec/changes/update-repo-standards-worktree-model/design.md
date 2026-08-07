## Context

`repo-standards` skill 教其他 JurisLM repo 怎麼設定 worktree／分支模型。jurislm-tools 自己已經在 2026-07-27 退役 `develop` 分支（archived change `document-retired-develop-workflow`，PR #165/#166，closed #164），但那次變更的 proposal.md 明文寫：

> Non-goals: Do not change plugin implementation or plugin-specific documentation.

所以 `repo-standards` skill 教的內容（`SKILL.md`、`references/*.md`、`openspec/specs/docs-and-standards/repo-standards-detail.md`）從未同步——這是「已在 code/操作層面做過、但沒回填進 skill 文件」的落差，與 `update-repo-standards-flat-ci-templates` 那次 CI 模板落差同一種性質（skill 自己文件內定義的「規範回填協議」沒被執行到這個角落）。

已用 `git log`／`grep` 查證（非假設）：

1. `.claude/worktrees/<change-name>` 路徑本身在 jurislm-tools 自己的 `CLAUDE.md` 早已是既定寫法（PR #127 引入，PR #147 沿用至今），比退役 develop 分支的時間點更早。
2. `document-retired-develop-workflow` 的 diff（`b3498c0`）只touch `README.md`／`CLAUDE.md`／`openspec/config.yaml`／`openspec/changes/**`，未觸碰 `plugins/repo-standards/` 任何檔案——證實三處 Git Worktree 內容確實是「從未回填」而非「當時評估過不改」。
3. Systematic grep 全 `plugins/repo-standards/` 目錄比對 `.worktrees`（排除 `.claude/worktrees`）：命中 5 個檔案（`SKILL.md`、`references/new-repo-checklist.md`、`references/eslint-templates.md`、`references/testing-config-templates.md`），外加 `openspec/specs/docs-and-standards/repo-standards-detail.md`；`references/ci-workflow-templates.md`、`references/code-review-setup.md` 零命中。
4. `.gitignore` vs `.git/info/exclude` 的實際慣例：查證 jurislm-tools 自己 + `entire`／`lawyer`／`stock`／`memory-dessert` 四個 repo 的 `.git/info/exclude`，全部在 `# claude-code-runtime` 註解區塊下有 `**/.claude/worktrees/`（同一段內容逐字重複，明顯是 Claude Code 工具自動維護，非人工個別新增）；反過來查這四個 repo committed 的 `.gitignore`，全部只有舊路徑 `.worktrees/`，**沒有一個**把 `.claude/worktrees/` 加進 committed `.gitignore`。這確認：`.claude/worktrees/` 排除是靠本地 `.git/info/exclude`，不需要（也不該）進 `.gitignore`。
5. 但 `.prettierignore`／ESLint ignores／`vitest.config.ts` 的 `exclude` 不讀 git 的 exclude 規則，會直接掃磁碟——查證這四個 repo 的實際設定：`lawyer`（近期維護過的）三個都同時列了 `.worktrees/` 與 `.claude/worktrees/`；`stock`／`memory-dessert` 只有舊路徑、缺 `.claude/worktrees/`（是真實存在的殘留 gap，但修這兩個 repo 不在本次範圍——本次只確保「以後照 skill 設定新 repo」拿到正確版本）。
6. memory `feedback_worktree_discipline`：`git worktree add -b <name> <path> origin/main`（以 remote-tracking ref 為 start point）會自動把新分支 upstream 設成 `origin/main`，導致裸 push 誤推 `origin/main`；jurislm-tools 自己的 session 已踩過兩次（`cap-jt-flow-review-budgets`、`archive-cap-jt-flow-review-budgets`）。`git help worktree` 的 `--track`／`--no-track` 說明佐證這是通用 git 行為，非 jurislm-tools 特有。

## Goals / Non-Goals

**Goals:**
- 5 個檔案的 worktree／分支模型敘述改為準確反映單段式 GitHub Flow（`.claude/worktrees/<change-name>` 直接從 `main`，PR 直接 `<change-name> → main`，無 develop）
- `.gitignore`／`.prettierignore`／ESLint／vitest 的 worktree exclude 指引改為與實際查證的慣例一致
- 新增一條可驗證的 living spec requirement，降低未來同類落差被發現的成本

**Non-Goals:**
- 不動 CI/CD pipeline 內容——`new-repo-checklist.md` 的「trigger.ref 禁止 develop」「dev app 維持 Coolify auto-deploy」等段落已經正確反映單段式（不是同一種缺陷：那些段落描述的是 Coolify dev 環境部署觸發來源，與本次「本地開發用哪個 worktree/分支」是不同概念），且是 `update-repo-standards-flat-ci-templates` 目前正在編輯的區域，不在同一批次改避免衝突
- 不動 jurislm-tools 或任何下游 repo 實際的 dotfiles——`lawyer`／`stock`／`memory-dessert` 的 `.prettierignore`／eslint／vitest 缺 `.claude/worktrees/**` 是真實 gap，但修正各自 repo 是各自獨立的後續決定
- 不重新設計「規範回填協議」執行機制本身

## Decisions

### D1. `.gitignore` 不列 `.claude/worktrees/`；`.prettierignore`／ESLint／vitest 仍要手動列

這不是隨意選邊站，是四個真實 repo 一致的實證結果（見 Context 4/5）。`.gitignore` 只影響 `git status`／`git add` 這類 git 操作，`.claude/worktrees/` 已經靠 `.git/info/exclude`（Claude Code runtime 自動維護）排除，重複寫進 `.gitignore` 沒有額外效果；但 `prettier --write .`／`eslint .`／`vitest` 都是直接掃磁碟的獨立工具，不讀 `.git/info/exclude`，沒有明確 exclude 規則的話會真的遞迴進每個 feature worktree（裡面往往有自己完整的 `node_modules`），拖慢或搞壞這些指令。checklist item 6 因此改成「**不要**加進 `.gitignore`」而非只是換路徑，item 7 維持「要加」但路徑修正。

### D2. 補上 `origin/main` start point 的 upstream-tracking 坑，不只是換路徑字串

原本三處內容的問題不只是路徑寫錯（`.worktrees/develop` → `.claude/worktrees/<change-name>`），建立指令本身如果照抄 `git worktree add -b <name> <path> origin/main` 會留下一個新坑（見 Context 6）。既然要重寫建立指令，順手把這個已經被記錄兩次的真實踩坑與修正步驟一起寫進去，避免文件教了「正確路徑」但留下「不完整的指令」。這不是新加功能或推測性內容，是讓被修正的指令本身可以直接照抄執行、不留下已知會炸的步驟。

### D3. 額外納入 `eslint-templates.md`／`testing-config-templates.md`，但不擴大到 CI 相關檔案

使用者原始需求點名 3 個檔案，但要求「檢查...是否也需要同步修正」。Systematic grep 找到的 2 個額外檔案是同一個缺陷（`.worktrees/**` 路徑字串）出現在 `SKILL.md` 明確指向的「完整模板」參考檔案裡——如果只修 `SKILL.md` 的精簡版摘要、不修這兩個被它指向的權威來源，等於留下更容易被直接複製貼上的錯誤版本。相對地，`ci-workflow-templates.md`／`code-review-setup.md` 零命中，維持不動，範圍邊界清楚。

### D4. Living spec 新增 requirement 放在 `docs-and-standards`，不擴充 `github-flow-entry-documentation`

`github-flow-entry-documentation` capability 的 Purpose 明文限定「entry documents and active OpenSpec context」（README／CLAUDE.md／config.yaml）；把 repo-standards skill 教其他 repo 的內容塞進這個 capability 會偷偷擴大一個已封存 change 的範圍認定。改在 `docs-and-standards`（`repo-standards-detail.md`／`spec.md` 所在 capability）新增一條獨立 requirement，比照 `update-repo-standards-flat-ci-templates` 那次的做法（同一個 capability 目錄，ADDED Requirements）。

## Risks / Trade-offs

- **[風險] 與 `update-repo-standards-flat-ci-templates`（尚未 merge）在 `repo-standards-detail.md`／`SKILL.md` 有相鄰但不重疊的編輯**：已用 `git diff origin/main` 核對兩邊實際改動的行號區間完全不重疊（對方在 CI/CD 段落與檔案更下方，本次在 Git Worktree 段落與其鄰近 config 範例）。→ **緩解**：兩者都是獨立 PR，標準 3-way merge 可正常處理相鄰不重疊變更；不特別協調合併順序
- **[Trade-off] `stock`／`memory-dessert` 的 `.prettierignore`／eslint／vitest 仍缺 `.claude/worktrees/**`**：本次只修正教學內容，不回頭修這兩個 repo。→ 已在 Non-Goals 說明，是有意識的範圍切割，不是遺漏

## Migration Plan

1. 修正 5 個檔案（`SKILL.md`、`references/new-repo-checklist.md`、`references/eslint-templates.md`、`references/testing-config-templates.md`、`openspec/specs/docs-and-standards/repo-standards-detail.md`）
2. 新增 `openspec/specs/docs-and-standards/spec.md` delta（ADDED Requirement）
3. `openspec validate --strict`
4. `npm run validate`、`claude plugin validate .`
5. PR → merge（純文件變更，無部署驗收步驟）
6. 歸檔本 change

無 rollback 疑慮——純 Markdown 內容變更，沒有執行期行為，git revert 即可完全復原。

## Open Questions

（無）
