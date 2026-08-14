# Proposal GO

- Change：`align-repo-standards-code-review`。
- Target：`jurislm/jurislm-tools`。
- Approved scope：使 `repo-standards` 的 Code Review 指引對齊目前全域與
  `jt-flow` review contract，將 `jt-flow` 的操作性變更追蹤術語統一為 Spectra，並
  同步所有受影響的 plugin 文件、policy tests 與 living specifications。
- Evidence：使用者在本 task 明確要求「進行修正」。
- CodeRabbit consent：使用者在 2026-08-14 看過 GitHub App 依既有安裝權限可能讀取
  repository／PR context、以及 CLI fallback 可能使用 guidelines、learnings、codebase
  history 的揭露後，明確回覆「同意」。本 PR 只可明確 request GitHub App 一次；只有
  App 無法產生有效 review 時才可使用 CLI 一次。
- Exclusions：不修改全域 `CLAUDE.md`、CI、release 或部署行為；不重寫既有 queue
  state model、不新增 proposal-revision gate，也不覆蓋 target repo 既有的
  `CLAUDE.md` contract。
