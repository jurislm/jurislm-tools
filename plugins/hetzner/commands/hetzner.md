---
name: hetzner
description: 管理 Hetzner Cloud 伺服器 — 建立、列表、SSH 金鑰管理。
argument-hint: "[action] [server-name/id]"
---

Apply the `hetzner` skill to manage Hetzner Cloud infrastructure via MCP tools.

## Arguments

$ARGUMENTS

Parse the arguments as follows (all optional):
- `action`: what to do (e.g. list, create, delete, reboot, ssh-keys) — inferred from context if omitted
- `target`: server name or ID — list all if omitted

## Delegation

Follow the `hetzner` skill workflow using available Hetzner MCP tools (hetzner_list_servers, hetzner_create_server, hetzner_list_ssh_keys, etc.).
