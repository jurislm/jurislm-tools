---
name: learn-eval
version: 1.0.0
description: >
  This skill should be used when the user wants to save or extract learnings from the current session.
  Trigger phrases: "extract reusable patterns", "save this pattern", "learn from this session",
  "save what we just figured out", "remember this for next time", "don't want to forget this",
  "this is a library quirk", "記錄這次的 pattern", "把這次學到的存起來",
  "萃取 session pattern", "學習紀錄", "記下來", "下次別忘了",
  "這個 API 很奇怪，記一下", "記錄這個 workaround".
  Applies a quality gate and dedup check before writing any skill file.
argument-hint: "(no arguments — analyzes the current session)"
---

# learn-eval — Extract, Evaluate, then Save

Analyze the current session for reusable patterns, apply a quality gate, determine the right save location (Global vs Project), then write the skill file after user confirmation.

## What to Extract

Scan the session for:

1. **Error Resolution Patterns** — root cause + fix + why it's reusable
2. **Debugging Techniques** — non-obvious diagnostic steps, tool combinations
3. **Workarounds** — library quirks, API limitations, version-specific fixes
4. **Project-Specific Patterns** — conventions, architecture decisions, integration patterns

Do not extract: typos, one-off syntax errors, or issues caused by a specific outage.

## Process

### Step 1: Review the Session

Read the session conversation and identify the most valuable/reusable insight. Focus on insights that would save time in a future session, not on what was done.

### Step 2: Draft the Skill File

Use this format:

```markdown
---
name: pattern-name
description: "Under 130 characters — what this pattern solves"
user-invocable: false
origin: auto-extracted
---

# [Descriptive Pattern Name]

**Extracted:** [Date]
**Context:** [When this applies]

## Problem
[Specific problem this solves]

## Solution
[Pattern/technique/workaround — with code examples]

## When to Use
[Trigger conditions for future sessions]
```

### Step 3: Quality Gate

Execute **all** checklist items before proceeding:

- [ ] `grep ~/.claude/skills/` and `~/.claude/rules/` and relevant project `.claude/skills/` and `.claude/rules/` by keyword — check for content overlap
- [ ] Check `MEMORY.md` (both project and global) for overlap
- [ ] Consider whether appending to an existing skill would suffice
- [ ] Confirm this is a reusable pattern, not a one-off fix

Then issue one holistic verdict:

| Verdict | Meaning | Next Action |
|---------|---------|-------------|
| **Save** | Unique, specific, well-scoped | Proceed to Step 4 |
| **Improve then Save** | Valuable but needs refinement | List improvements → revise → re-evaluate once |
| **Absorb into [X]** | Should append to an existing skill | Show target + additions → Step 4 |
| **Drop** | Trivial, redundant, or too abstract | Explain reasoning and stop |

### Step 4: Determine Save Location

Ask: "Would this pattern be useful in a different project?"

| Answer | Location |
|--------|----------|
| Yes — generic (bash, LLM API behavior, debugging technique) | `~/.claude/skills/learned/` (Global) |
| No — project-specific (config quirks, project architecture) | `.claude/skills/learned/` (Project) |

When unsure, choose Global. Moving Global → Project is easier than the reverse.

### Step 5: Present and Confirm

Output format before saving:

```
### Checklist
- [x] skills/ grep: no overlap (or: overlap found → details)
- [x] MEMORY.md: no overlap (or: overlap found → details)
- [x] Existing skill append: new file appropriate (or: should append to [X])
- [x] Reusability: confirmed (or: one-off → Drop)

### Verdict: Save / Improve then Save / Absorb into [X] / Drop
**Rationale:** (1-2 sentences)

**Save path:** ~/.claude/skills/learned/pattern-name.md
**Draft:**
[full skill file content]
```

Save only after explicit user confirmation. Do not write files speculatively.

### Step 6: Save

Write to the determined path. For **Absorb**, append to the existing skill file rather than creating a new one.

## Design Notes

- Keep skills focused — one pattern per file
- When verdict is Absorb, prefer appending with a clear separator (`---`) and heading
- The quality gate uses holistic judgment, not numeric scores — the checklist ensures no step is skipped
