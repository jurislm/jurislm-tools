---
name: repo-standards
description: >
  Set up or audit a JurisLM repo — configure git worktrees, Bun runtime, Vitest, Release Please,
  ESLint, CI workflows, and Claude code review.
  Use when: "如何設定新 repo", "release workflow 怎麼寫", "lint 怎麼設定", "eslint config 怎麼寫",
  "新增 repo 要怎麼設定", "git worktree 怎麼設定", "設定 code review workflow", "設定 GitHub Actions",
  "set up new repo", "configure ESLint", "set up release workflow", "set up git worktree",
  "configure Claude code review", "add GitHub Actions workflow".
argument-hint: "[repo-name]"
---

Apply the `repo-standards` skill to set up or audit a JurisLM repo.

## Arguments

$ARGUMENTS

Parse the arguments as follows (optional):
- `repo-name`: target repo name — defaults to current working directory's repo if omitted

## Delegation

Follow the `repo-standards` skill: identify repo type → apply standard release.yml + release-please-config.json → apply standard ESLint config → verify checklist.
