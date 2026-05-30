---
name: tdd-workflow
description: 啟動 TDD 工作流程 — 寫測試先行，強制 RED→GREEN→REFACTOR，含 unit/integration/E2E。
argument-hint: "[feature description or task]"
---

Apply the `tdd-workflow` skill for the current task.

## Arguments

$ARGUMENTS

Parse as task description (optional — inferred from context if omitted).

## Delegation

Follow the `tdd-workflow` skill: classify task type (New Feature / Bug Fix / Refactor), enforce write-tests-first, track RED→GREEN→REFACTOR cycle, verify 80%+ coverage before marking complete.
