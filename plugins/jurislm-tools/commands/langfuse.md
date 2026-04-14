---
name: langfuse
description: 管理 Langfuse 可觀測性平台 — Prompt 版本管理、執行追蹤、評分。
argument-hint: "[action] [prompt-name/trace-id]"
---

Apply the `langfuse` skill to manage Langfuse observability via MCP tools.

## Arguments

$ARGUMENTS

Parse the arguments as follows (all optional):
- `action`: what to do (e.g. list prompts, get trace, create score, update labels) — inferred from context if omitted
- `prompt-name` / `trace-id`: target resource identifier — omit to list all

## Delegation

Follow the `langfuse` skill workflow using available Langfuse MCP tools (listPrompts, getPrompt, createTextPrompt, listTraces, getTrace, createScore, etc.).
