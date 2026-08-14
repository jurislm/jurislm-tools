# Environment Inventory

- Target repository：`jurislm/jurislm-tools`。
- Worktree：`.claude/worktrees/codex-align-repo-standards-code-review`。
- Branch：`codex/align-repo-standards-code-review`。
- Baseline：`origin/main` 與 worktree HEAD 均為
  `3a9041dc7930776ce221ae90bc4aac81f1519d97`；worktree 在修改前為 clean，
  `git diff --check` 通過。
- Canonical review sources：repo `CLAUDE.md` 的 `jt-flow` review contract、
  living `openspec/specs/jt-flow-review-orchestration/spec.md`，以及 contributor
  global `~/.claude/CLAUDE.md` 的 PR／merge gates。
- Drift found：`repo-standards` 的 Skill、command、checklist、CI reference 與
  Copilot reference 仍使用「人工 `/code-review` + bot」或 CodeRabbit 自動審查描述。
