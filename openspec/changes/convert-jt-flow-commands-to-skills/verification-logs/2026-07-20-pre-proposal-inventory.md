# Pre-proposal evidence inventory

## Files read

- `plugins/jt-flow/commands/jt-flow.md:1-196`
- `plugins/jt-flow/commands/jt-flow-all.md:1-241`
- `plugins/jt-flow/.claude-plugin/plugin.json:1-20`
- `.claude-plugin/marketplace.json:65-72`
- `CLAUDE.md:30-58,100-106,120-138`
- `release-please-config.json:47-51`

## Current state

| Evidence | Current behavior |
|---|---|
| `plugins/jt-flow/commands/jt-flow.md:1-196` | A single `jt-flow` slash command accepts `$ARGUMENTS` and directs issue queues to `/jt-flow-all`. |
| `plugins/jt-flow/commands/jt-flow-all.md:1-241` | A `jt-flow-all` slash command accepts `$ARGUMENTS` and directs one request to `/jt-flow`. |
| `plugins/jt-flow/.claude-plugin/plugin.json:1-20` | Plugin metadata advertises both slash-command entry points but declares no individual entry files. |
| `.claude-plugin/marketplace.json:65-72` | Marketplace publishes the `jt-flow` plugin and repeats the slash-command description. |
| `CLAUDE.md:37-42,56,106` | Documents auto-discovered Skills and commands, classifies `jt-flow` as Command, and records its external dependencies. |

## Proposed decisions

| Decision | Current behavior | Proposed behavior |
|---|---|---|
| Entry artifacts | Two `commands/*.md` files provide slash-command entry points. | Two `skills/<name>/SKILL.md` files provide triggerable Skill entry points; command files are removed. |
| Invocation guidance | `$ARGUMENTS` and slash-command references are used. | Natural-language triggers and sibling-Skill references are used. |
| Documentation | Metadata and `CLAUDE.md` describe a Command plugin. | Metadata and `CLAUDE.md` describe a Skill plugin. |
