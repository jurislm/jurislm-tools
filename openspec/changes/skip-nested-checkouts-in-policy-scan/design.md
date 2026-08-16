# Design

## Evidence

| id | readback | expected | on-failure |
| --- | --- | --- | --- |
| D1 | `node --test scripts/jt-flow-review-policy.test.mjs`, run in a working tree that has sibling worktrees under `.claude/worktrees/` | `fail 1`, message `carries a CLI flag spelling the current CodeRabbit CLI rejects` | stop — the defect does not reproduce, so there is nothing to fix |
| D2 | `grep -rln -- '--type committed' .claude/` in that same tree | hits only inside `.claude/worktrees/<branch>/`, i.e. other branches' copies | stop — a hit outside a nested checkout is a real uncorrected site, not a scan-range problem |

Both were run on 2026-08-16 (Taiwan time); output in
`verification-logs/2026-08-16-false-red-repro.md`.

## Decision — skip anything that is itself a checkout, not a named path

**Chosen.** In `walk()`, skip a directory when it contains a `.git` entry.

`git worktree add` accepts any path. This repository's `CLAUDE.md` prescribes
`.claude/worktrees/<change-name>`, but that is a convention the test has no way
to enforce, and a contributor who places a worktree elsewhere would silently get
the same false red. Skipping on the structural signal covers every placement,
including a clone that happens to sit inside the tree.

**Rejected: exclude the literal `.claude` directory.** It would fix today's
symptom while leaving `.claude/commands/` and `.claude/skills/` unscanned — real
markdown that could one day prescribe the command — and it would still miss a
worktree created anywhere else. Trading a false red for a blind spot is the
wrong direction for a guard.

**Rejected: exclude `.claude/worktrees` specifically.** Narrower than the failure
it addresses, which is the exact shape that let `CLAUDE.md` survive the previous
correction round: a range that does not cover what the claim asserts.

## Decision — the quoting exemption is structural too

**Chosen.** Exempt everything under `openspec/changes/`.

The previous exemption named `openspec/changes/fix-coderabbit-cli-flag/`
literally. That worked for exactly one change: this one's artifacts quote the
stale spelling (a proposal has to state what it corrects) and were flagged
immediately. The guard would block every future change that discusses the old
form — including a change correcting the next drift.

Exempting the directory does not create a blind spot. A reader looking for the
command to run reads a skill or `CLAUDE.md`; `openspec/changes/**` is proposals
and history. Both positive controls confirm the check still bites after the
widening: an old flag reintroduced into the skill turns the run red, and a new
document prescribing the command without naming `--help` turns it red too.

This is the same defect as the scan range, one layer over: a name where a
structural property belonged.

## Verification shape

A clean checkout cannot distinguish the fixed guard from the broken one — it has
no nested worktrees, which is why CI never caught this. The fix is therefore
verified in a tree that has them, and the pre-fix reproduction (D1) is recorded
so the two runs can be compared rather than asserted.

The positive control from the original guard still has to hold afterwards: a
document that prescribes the command without naming `--help` must still turn the
run red. Skipping nested checkouts must not become skipping the check.
