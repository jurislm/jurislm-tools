# Proposal GO — update-repo-standards-worktree-model

- **Approval status**: GO
- **Change identifier**: `update-repo-standards-worktree-model`
- **Proposal path**: `openspec/changes/update-repo-standards-worktree-model/`
- **Issue identifier**: [jurislm/jurislm-tools#197](https://github.com/jurislm/jurislm-tools/issues/197)
- **Target repo**: `jurislm/jurislm-tools`（single `origin` remote，fetch/push 一致；worktree 建立時基於 `origin/main` = `0d16869`）
- **Approved scope**: 修正 `repo-standards` skill 5 個檔案（`SKILL.md`、`references/new-repo-checklist.md`、`references/eslint-templates.md`、`references/testing-config-templates.md`、`openspec/specs/docs-and-standards/repo-standards-detail.md`）的 Git Worktree／分支模型敘述，兩段式 develop 改為單段式 GitHub Flow；新增 `docs-and-standards` capability 一條 requirement。純文件內容修正，不變更任何已上線 repo 的實際設定檔。詳見 proposal.md／design.md。
- **Proposal GO evidence**: 使用者於本對話中，在 AskUserQuestion「Proposal（issue #197 + 5 檔案修正範圍）確認後，是否 GO 進入實作？」回覆「GO」。
- **CodeRabbit consent**: 本次任務由使用者一般意圖描述觸發（非明確點名／呼叫 `jt-flow:jt-flow-one`），依該 skill 條款不構成 CodeRabbit 預先授權；PR review 階段需要 CodeRabbit 時，須另行揭露資料範圍並取得同意。
