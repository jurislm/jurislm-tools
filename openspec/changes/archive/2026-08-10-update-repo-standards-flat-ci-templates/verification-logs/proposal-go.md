# Proposal GO — update-repo-standards-flat-ci-templates

- **Approval status**: GO
- **Change identifier**: `update-repo-standards-flat-ci-templates`
- **Proposal path**: `openspec/changes/update-repo-standards-flat-ci-templates/`
- **Issue identifier**: [jurislm/jurislm-tools#196](https://github.com/jurislm/jurislm-tools/issues/196)
- **Target repo**: `jurislm/jurislm-tools`（single `origin` remote, fetch/push consistent；本地 `main` 與 `origin/main` 一致，皆為 `0d16869`）
- **Approved scope**: 更新 `repo-standards` skill 的模板 A（補 `build`＋`release-pr-auto-merge`）與模板 B（pipeline 清單/計數對齊 entire 現況），並在 `docs-and-standards/repo-standards-detail.md` 新增一條可驗證要求。純文件內容修正，不變更任何已上線 repo 的 `.drone.yml`。詳見 proposal.md／design.md。
- **Proposal GO evidence**: 使用者於本對話中，在 4 artifacts 摘要訊息後回覆 `go`。
- **CodeRabbit consent**: 本次任務由背景 spawned task（使用者點擊 chip 觸發）+ 對話中確認「現在就做」開始，非明確點名呼叫 `jt-flow:jt-flow-one`／`$jt-flow:jt-flow-one`，依該 skill 條款不構成 CodeRabbit 預先授權；PR review 階段若需要 CodeRabbit，須另行揭露並取得同意。
