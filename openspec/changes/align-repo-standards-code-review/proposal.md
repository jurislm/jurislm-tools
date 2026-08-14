## Why

`repo-standards` 目前把 PR 審查寫成「人工 `/code-review` + bot」，與
目前 `CLAUDE.md` 及 `jt-flow` 的 Skill-driven 審查契約不一致。這會讓採用
標準的 repo 遺漏本地 review、finding 處置、thread resolve、外部審查預算與
合併 gate。現有文件也把 GitHub Issue 留為流程選項，與本 repo 以 Spectra
artifact 作為唯一追蹤紀錄的決策不一致。

## What Changes

- 以 `superpowers:requesting-code-review`、
  `superpowers:receiving-code-review` 與現行 PR／merge gate 取代手動
  `/code-review` 的錯誤描述。
- 同步 Skill、相容 command、checklist、CI／Copilot reference 與 living spec，
  讓採用 repo 可在自身 `CLAUDE.md` 取得同一個 review contract。
- 明確記錄 CodeRabbit App／CLI 一次有效審查、Copilot 一次、Codex 被動審查、
  finding 處置與 thread resolve 的必要規則。
- 保留移除自動 Claude PR review pipeline 的設定決策。
- 將 Spectra 的 `proposal → design → specs → tasks` 寫為唯一變更追蹤紀錄；
  非初始化 repo 先執行 `spectra init`，且 `jt-flow`、living specs、測試都不建立、
  不引用、也不依賴 GitHub Issue。

## Non-Goals

- 不修改全域 `CLAUDE.md` 的 review orchestration 或任何外部服務設定。
- 不變更 CI、Release Please、部署或分支模型。

## Capabilities

### New Capabilities

- 無。

### Modified Capabilities

- `docs-and-standards`：將 repo-standards 的 Code Review 指引改為現行
  Skill-driven 審查與合併契約，並以 Spectra artifact 取代 Issue 追蹤。
- `jt-flow-authorization`：移除 `jt-flow-one` 的 GitHub Issue external-context
  路徑。
- `jt-flow-queue-delegation`：讓 queue 只以 Spectra changes 與 Delivery
  Relations 建立 execution graph。

## Delivery Relations

- Priority：normal。
- Hard dependencies：無。
- Acceptance dependencies：目標 repo `CLAUDE.md` 的 portable review contract。
- External blockers：無。
- Affected areas：repo-standards plugin、living documentation。
- Production targets：無。

## Impact

影響本 repo 的流程規則、`repo-standards` 與 `jt-flow` plugin 文件、驗證測試，
以及其 living OpenSpec specification。
