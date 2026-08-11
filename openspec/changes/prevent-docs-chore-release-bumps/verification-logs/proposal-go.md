# 提案 GO 與外部審查授權

- approval status：已核准，進入提交、push、PR、review、合併、驗收與歸檔流程
- change identifier：`prevent-docs-chore-release-bumps`
- proposal：`openspec/changes/prevent-docs-chore-release-bumps/proposal.md`
- target repository：`jurislm/jurislm-tools`
- approved scope：阻止僅含 `docs`／`chore` 的未發布提交觸發 Release Please 版本升級；保留 `github-release`；新增 eligibility 判定、fail-closed 行為、Drone 契約測試與 repository standards 同步；不手動改版號、不重寫既有 `v1.37.1`。
- proposal GO evidence：本次對話中使用者對已展示的提案與後續交付流程連續回覆 `go ahead`。
- CodeRabbit consent：已取得。使用者在完成 CodeRabbit App／CLI 的資料範圍揭露後回覆「授權」。授權僅適用於本次 `jurislm-tools` PR review。
- external context：GitHub Issue #210 僅作為需求背景，不是授權或完成門檻。

