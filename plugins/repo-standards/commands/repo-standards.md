---
name: repo-standards
description: >
  Set up or audit a JurisLM repo — configure git worktrees, Bun runtime, Vitest, Drone CI/CD
  (.drone.yml: lint/typecheck/test + release-please + Coolify deploy gating), Release Please,
  ESLint, code review (manual /code-review + bots), and AGENTS.md → CLAUDE.md handoff.
  Use when: "如何設定新 repo", "release workflow 怎麼寫", "lint 怎麼設定", "eslint config 怎麼寫",
  "新增 repo 要怎麼設定", "git worktree 怎麼設定", "設定 code review workflow", "設定 Drone CI",
  "drone.yml 怎麼寫", "CI 怎麼設定", "部署怎麼設定", "避免重複部署",
  "更新 AGENTS.md", "AGENTS.md 讀 CLAUDE.md", "同步 AGENTS.md",
  "set up new repo", "configure ESLint", "set up release workflow", "set up git worktree",
  "set up Drone CI", "configure CD / deploy gating", "sync AGENTS.md with CLAUDE.md".
argument-hint: "[repo-name]"
---

Apply the `repo-standards` skill to set up or audit a JurisLM repo.

## Arguments

$ARGUMENTS

Parse the arguments as follows (optional):
- `repo-name`: target repo name — defaults to current working directory's repo if omitted

## Delegation

Follow the `repo-standards` skill: identify repo type → standardize any existing `AGENTS.md` to read `CLAUDE.md` → apply standard `.drone.yml` (lint/typecheck/test + release-please + Coolify deploy gating) + release-please-config.json → apply standard ESLint config → verify checklist.
