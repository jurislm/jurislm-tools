---
name: plan
description: >
  This skill should be used when the user requests feature implementation, refactoring, or asks for an implementation plan. Examples:
  "plan this feature", "create a plan", "plan before coding", "I want a plan first",
  "what's the implementation strategy", "break this down into steps", "plan the migration",
  "先規劃再動手", "幫我規劃實作步驟", "先列計畫", "給我一個實作計畫",
  "複雜功能要怎麼拆", "refactor 計畫", "migration 計畫".
  Use PROACTIVELY when the user requests feature implementation or refactoring touching multiple files.
argument-hint: "<feature or task description>"
version: 1.0.0
---

# Plan — Implementation Planning Skill

Before writing any code, analyze requirements, surface risks, and produce a phased implementation plan. Wait for explicit user confirmation before touching production files.

## When This Skill Applies

Trigger this skill when the task involves:
- New features touching 2+ files or components
- Significant refactoring or architectural changes
- Migrations (database schema, API protocol, library version)
- Ambiguous or incomplete requirements that need clarification first
- Complex multi-step workflows

Skip planning and implement directly only when the task is a single-file, low-risk change.

## Planning Process

### 1. Restate Requirements

Rephrase the request in concrete, verifiable terms:
- What exactly will be built
- What success looks like (measurable criteria)
- Assumptions and constraints

### 2. Assess Risks

Identify blockers and risk levels before starting:

| Risk Level | Meaning |
|------------|---------|
| HIGH | Security, data integrity, irreversible actions |
| MEDIUM | Cross-service dependencies, performance |
| LOW | UI/UX polish, additive changes |

### 3. Produce Phased Implementation Plan

Break down into independently deliverable phases:
- **Phase 1**: Minimum viable — smallest slice that provides value
- **Phase 2**: Core experience — complete happy path
- **Phase 3**: Edge cases and error handling
- **Phase 4**: Optimization and polish (if needed)

Each phase must be mergeable and testable independently.

### 4. Wait for Confirmation

Present the plan, then stop. Do **not** write any code until the user explicitly confirms with "yes", "proceed", or similar.

Accept modification requests:
- "modify: [specific change]"
- "skip phase 2"
- "different approach: [alternative]"

## Plan Format

```markdown
# Implementation Plan: [Feature Name]

## Requirements Restatement
- [Concrete requirement 1]
- [Concrete requirement 2]

## Architecture Changes
- [File/component: what changes and why]

## Implementation Phases

### Phase 1: [Name]
1. **[Step]** (File: path/to/file.ts)
   - Action: Specific action
   - Why: Rationale
   - Risk: Low/Medium/High

### Phase 2: [Name]
...

## Testing Strategy
- Unit: [what to unit test]
- Integration: [what to integration test]
- E2E: [critical flows to cover]

## Risks & Mitigations
- **Risk**: description
  - Mitigation: how to address

## Estimated Complexity: High / Medium / Low

---
**WAITING FOR CONFIRMATION**: Proceed with this plan?
```

## Inline vs. Agent Mode

**Default (inline)**: Plan directly in the conversation without spawning subagents. This works for most tasks and is compatible with all plugin installs.

**Agent mode**: Use the `planner` subagent only when the user explicitly requests deeper analysis, or when the task involves codebase-wide refactoring that benefits from `Read`/`Grep`/`Glob` exploration. Invoke only if the subagent is available in the current runtime; otherwise, continue inline.

If the `planner` subagent is unavailable, complete planning inline—never surface an "Agent type 'planner' not found" error.

## After the Plan Is Confirmed

Once the user confirms, execute phase by phase:
1. Implement Phase 1 completely
2. Run `bun run test && bun run typecheck && bun run lint`
3. Confirm with user before starting Phase 2
4. Repeat until all phases complete

Integrate with other skills post-planning:
- `/tdd-workflow` — implement with test-driven development
- a code review skill (e.g. `/code-review` if installed) — review completed implementation
