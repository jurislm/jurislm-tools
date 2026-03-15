# Design: `/opsx:cleanup` Skill

**Date**: 2026-03-15
**Status**: Approved

## Overview

A new slash command that automatically scans the OpenSpec directory, identifies legacy items (completed changes, stale changes, empty specs), and cleans them up with minimal user interaction.

## Problem

OpenSpec accumulates legacy items over time:
- Completed changes that were never archived
- Abandoned in-progress changes with no tasks or activity
- Empty specs (0 requirements) that serve as placeholders

Existing commands (`/opsx:archive`, `/opsx:bulk-archive`) require the user to already know which items to clean up. There is no command that *discovers* legacy items automatically.

## Solution

Add `opsx-cleanup` skill to `jurislm-claude-plugins-entire` plugin.

## Location

```
plugins/jurislm-claude-plugins-entire/skills/opsx-cleanup/SKILL.md
```

## Trigger Phrases

- `opsx:cleanup`
- `cleanup openspec`
- `清理 openspec`
- `openspec prune`

## Execution Flow

1. Run `openspec list --json` — get all changes with status, task counts, lastModified
2. Run `openspec list --specs` — get all specs with requirement counts
3. Classify items into two buckets:
   - **Auto-clean**: clear-cut legacy (no confirmation needed)
   - **Confirm**: ambiguous items (ask user before acting)
4. Execute auto-clean immediately
5. For confirm items, ask user one at a time
6. Print cleanup summary

## Classification Rules

### Changes — Auto-clean (no confirmation)

| Condition | Action |
|-----------|--------|
| `status: complete` | `openspec archive` |

### Changes — Confirm required

| Condition | Reason |
|-----------|--------|
| `status: in-progress` AND `completedTasks: 0` AND last modified > 7 days ago | Possibly abandoned |

### Specs — Confirm required

| Condition | Reason |
|-----------|--------|
| `requirements: 0` | Empty placeholder, may be intentional |

## Output Format

```
🧹 OpenSpec Cleanup

✅ 自動封存（1）
  - cowork-architecture-restructure（完成 131/131 tasks）

❓ 需確認（2）
  - gmail-notification（specs, 0 requirements）→ 刪除？[y/n]
  - openclaw-channel-integration（0 tasks, 14 天未更新）→ 封存？[y/n]

完成：封存 1 個 change，刪除 0 個 spec
```

## Approach Considered

| Option | Pros | Cons |
|--------|------|------|
| **A: Plugin Skill** (chosen) | Consistent with existing entire skills; reusable across projects | Requires plugin reload |
| B: Command file in `.claude/commands/` | Immediately available | Only works in entire repo |
| C: Both | Most flexible | Two places to maintain |

## Non-Goals

- Does not modify or delete specs that have requirements (even if outdated)
- Does not force-archive in-progress changes with tasks completed
- Does not replace `openspec archive` for normal workflow use
