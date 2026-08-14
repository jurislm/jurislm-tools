# Environment Inventory

- Target repository：`jurislm/jurislm-tools`。
- Worktree：`.claude/worktrees/codex-align-repo-standards-code-review`。
- Branch：`codex/align-repo-standards-code-review`。
- Baseline：`origin/main` 與 worktree HEAD 均為
  `3a9041dc7930776ce221ae90bc4aac81f1519d97`；worktree 在修改前為 clean，
  `git diff --check` 通過。
- Initial review sources：repo `CLAUDE.md` 的 `jt-flow` review contract、living
  `openspec/specs/jt-flow-review-orchestration/spec.md`，以及 contributor global
  `~/.claude/CLAUDE.md` 的 PR／merge gates。
- Drift found：`repo-standards` 的 Skill、command、checklist、CI reference 與
  Copilot reference 仍使用「人工 `/code-review` + bot」或 CodeRabbit 自動審查描述。
- Review-feedback scope update：target repo 必須從其 own `CLAUDE.md` 取得 packaged
  portable contract；`jt-flow` 的 current workflow 不保留 GitHub Issue path，且未
  初始化 target 先執行 `spectra init`。
