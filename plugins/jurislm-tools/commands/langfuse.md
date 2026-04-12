---
description: 透過 Langfuse MCP 管理 Prompt 版本、查詢 Traces、Observations、Scores 與 Sessions。
argument-hint: "[action] [prompt-name/trace-id]"
---

Apply the `langfuse` skill to interact with the Langfuse observability platform.

## Arguments

$ARGUMENTS

Parse the arguments as follows (all optional):
- `action`: the operation to perform (e.g. `list-prompts`, `get-trace`, `create-score`)
- `prompt-name` or `trace-id`: target resource identifier

## Delegation

Follow the `langfuse` skill with the resolved parameters.
