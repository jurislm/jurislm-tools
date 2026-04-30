---
name: repo-standards
description: JurisLM 各 repo 的統一設定規範，涵蓋 Release 工作流程與 ESLint 設定。
argument-hint: "[repo-name]"
---

Apply the `repo-standards` skill to set up or audit a jurislm repo's release workflow and ESLint configuration.

## Arguments

$ARGUMENTS

Parse the arguments as follows (optional):
- `repo-name`: target repo name — defaults to current working directory's repo if omitted

## Delegation

Follow the `repo-standards` skill: identify repo type → apply standard release.yml + release-please-config.json → apply standard ESLint config → verify checklist.
