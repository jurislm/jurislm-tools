# Design

## Evidence

| id | readback | expected | on-failure |
| --- | --- | --- | --- |
| D1 | `node --test scripts/jt-flow-review-policy.test.mjs`, run in a working tree that has sibling worktrees under `.claude/worktrees/` | `fail 1`, message `a paragraph prescribes the CLI without naming --help as the authority for its flag spelling`, pointing at a `.claude/worktrees/**` path | stop — the defect does not reproduce, so there is nothing to fix |
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

## Decision — exemptions are split by assertion, not applied as one skip

**Chosen.** Archived changes are exempt from both assertions; active change
artifacts are exempt only from the stale-spelling one.

The first attempt exempted all of `openspec/changes/**` from everything. Review
showed the cost with a probe: an `openspec/changes/<active>/tasks.md` prescribing
the command without naming `--help` passed silently. That is the worst possible
place to lose the check — `spectra-apply` executes `tasks.md` line by line, so it
is the file most likely to be *run*, not merely read.

Archive is different, and the boundary is not symmetric. An archived change
records how the work was done at the time, including spellings later corrected;
`openspec/changes/archive/2026-08-07-update-repo-standards-worktree-model/verification-logs/…`
contains exactly such a paragraph. Making the `--help` assertion strictly
tree-wide would demand amending history, which is the wrong fix.

Active change artifacts still need the stale-spelling exemption: a proposal that
corrects a drift has to write down what it is correcting. That exemption is wider
than the living spec's clause ("archived changes and the change that performs the
correction"), so it ships with a spec delta rather than as a silent widening.

## Verification shape

A clean checkout cannot distinguish the fixed guard from the broken one — it has
no nested worktrees, which is why CI never caught this. The fix is therefore
verified in a tree that has them, and the pre-fix reproduction (D1) is recorded
so the two runs can be compared rather than asserted.

The positive controls all have to hold afterwards — skipping nested checkouts
must not become skipping the check. Four probes, all run in the tree that has
nested worktrees:

| Probe | Expected | Actual |
| --- | --- | --- |
| baseline | green | 9 pass |
| active change's `tasks.md` prescribes the command, no `--help` | red | 8 pass / 1 fail |
| active change's `tasks.md` quotes `--type committed` | green | 9 pass |
| skill reverted to `--type committed` | red | 8 pass / 1 fail |

The second probe is the one review added; under the first attempt's blanket
exemption it passed silently.
