# Nested-checkout false red — reproduction

Date: 2026-08-16 (Taiwan time)

Run in the main jurislm-tools working tree, which has sibling worktrees under `.claude/worktrees/`:

```
$ node --test scripts/jt-flow-review-policy.test.mjs
not ok 9 - every prescribed CodeRabbit CLI invocation names --help as its flag authority
# pass 8
# fail 1
```

Source of the hits (stale copies on other branches, not the repo under test):

```
.claude/worktrees/research-spectra-stale-in-progress-markers/CLAUDE.md
.claude/worktrees/research-spectra-stale-in-progress-markers/plugins/jt-flow/skills/jt-flow-one/SKILL.md
.claude/worktrees/remove-superpowers-plan-spec-flow/CLAUDE.md
.claude/worktrees/remove-superpowers-plan-spec-flow/plugins/jt-flow/skills/jt-flow-one/SKILL.md
```

CI is a fresh clone with no nested worktrees, so it stays green — the guard protects where it must, but the local run is unusable.
