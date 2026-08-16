# Skip nested checkouts in the policy scan

## Why

The guard added in `fix-coderabbit-cli-flag` walks the working tree to find
documents that prescribe the CodeRabbit CLI. It excludes `node_modules` and
`.git`, but not nested git checkouts — so it descends into
`.claude/worktrees/<branch>/`, which this repository's own workflow creates for
every feature branch.

Those directories hold other branches' copies of the same files, most of them
predating the flag correction. The result, reproduced in the main working tree
on 2026-08-16 (Taiwan time):

```
not ok 9 - every prescribed CodeRabbit CLI invocation names --help as its flag authority
# pass 8
# fail 1
```

The hits are `.claude/worktrees/research-spectra-stale-in-progress-markers/…`
and `.claude/worktrees/remove-superpowers-plan-spec-flow/…` — files on other
branches, not the repository under test.

**Why this matters more than one failing local run.** CI is a fresh clone with
no nested worktrees, so it stays green; the guard still protects the merge path.
But `npm test` and `npm run validate` are exactly what a contributor runs before
pushing, and this makes them permanently red for a reason that has nothing to do
with their change. A red that is always red stops being read, and the next
genuine regression arrives into a signal nobody trusts. The guard's whole purpose
is to be the thing that fails when the flag drifts again.

It is also the same defect the guard was written to fix, one level up: a scan
whose range is wider than what it is entitled to judge. The previous instance
was the reverse — a range narrower than its claim, which is how `CLAUDE.md`
survived the first correction round.

## What Changes

- Skip any directory that is itself a git checkout — one containing a `.git`
  entry — rather than naming `.claude/worktrees` specifically. A hardcoded path
  would only cover where this repository happens to put worktrees today, and
  `git worktree add` accepts any path.
- Replace the hardcoded quoting exemption (one change directory by name) with
  the structural one: every path under `openspec/changes/`. Prescriptive
  commands live in skills and `CLAUDE.md`; change artifacts quote both the old
  and the new form by necessity.
- Record the reproduction in `verification-logs/`, and verify the fix by running
  the test in a working tree that actually has nested worktrees, not only in a
  clean one.

**A second instance of the same shape, found while fixing the first.** The
guard's quoting exemption was hardcoded to one change directory,
`openspec/changes/fix-coderabbit-cli-flag/`. This change's own artifacts have to
quote the stale spelling — a proposal must say what it is correcting — so the
guard flagged them the moment they existed. Any future change that mentions the
old form would hit the same wall. The exemption is now structural: everything
under `openspec/changes/` is a record, not an instruction a reader copies.

## Non-goals

- No change to what the guard asserts. The invariant — every paragraph
  prescribing `coderabbit review --agent` also names `coderabbit review --help`,
  and no prescribing document carries a spelling the current CLI rejects — is
  unchanged.
- No change to the existing `node_modules` / `.git` exclusions, or to the
  archive and in-flight-change quoting exemptions.
- No change to any jt-flow skill text or to the CodeRabbit contract.

## No spec delta

The contract is unchanged. `External tool invocations name their source of
truth` (in `jt-flow-review-orchestration`) already states what the guard
enforces; this change only corrects which files the guard is entitled to judge.
A requirement that named a scan range would pin an implementation detail into a
living spec, and would itself expire the next time worktrees move.

## Affected plugins

None. The change is confined to `scripts/jt-flow-review-policy.test.mjs`, which
is repository tooling rather than published plugin content.
