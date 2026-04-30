---
name: coolify
description: 管理 Coolify 基礎設施 — 部署應用程式、資料庫、診斷問題。
argument-hint: "[action] [app-name/domain/uuid]"
---

Apply the `coolify` skill to manage Coolify infrastructure via MCP tools.

## Arguments

$ARGUMENTS

Parse the arguments as follows (all optional):
- `action`: what to do (e.g. deploy, diagnose, list, update-env) — inferred from context if omitted
- `target`: app name, domain, or UUID — list all if omitted

## Delegation

Follow the `coolify` skill workflow using available Coolify MCP tools (coolify_infrastructure_overview, coolify_deploy, coolify_diagnose_application, etc.).
