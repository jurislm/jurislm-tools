# Skip nested checkouts in the policy scan

## Why

The guard added in `fix-coderabbit-cli-flag` walks the working tree for
documents prescribing the CodeRabbit CLI. It excludes `node_modules` and `.git`,
but not nested git checkouts — so it descends into `.claude/worktrees/<branch>/`,
which this repository's own workflow creates for every feature branch. Those
directories hold other branches' copies, most predating the flag correction.

Reproduced in the main working tree on 2026-08-16 (Taiwan time): `fail 1`,
pointing at
`.claude/worktrees/research-spectra-stale-in-progress-markers/CLAUDE.md`.
Evidence in `verification-logs/2026-08-16-false-red-repro.md`.

CI is a fresh clone, so it stays green and the merge path is still protected.
But `npm test` and `npm run validate` are what a contributor runs before
pushing, and they are now permanently red for reasons unrelated to their change.
A red that is always red stops being read — and this guard exists precisely to
be the thing that fails when the flag drifts again.

A second instance surfaced while fixing the first: the quoting exemption was
hardcoded to one change directory by name, so any new change that quotes the
stale spelling — as a correcting proposal must — was flagged on creation.

## What Changes

- Skip any directory that is itself a git checkout (contains a `.git` entry)
  rather than naming `.claude/worktrees`. `git worktree add` accepts any path.
- Split the exemptions by assertion instead of one blanket skip: archived
  changes are exempt from both (immutable history); active change artifacts are
  exempt only from the stale-spelling assertion, so
  `openspec/changes/<active>/tasks.md` — which `spectra-apply` executes line by
  line — keeps the `--help` requirement.
- Record the exemption widening in a spec delta. The living spec's exclusion
  clause named only "archived changes and the change that performs the
  correction"; it now covers any change artifact.

## Non-goals

- No change to the `node_modules` / `.git` exclusions.
- No change to what the two assertions require — a prescribing passage names
  `coderabbit review --help`, and no prescribing document carries a spelling the
  current CLI rejects. ⚠️ Their **scope** did move: the `--help` assertion now
  triggers on the CLI name followed by any flag, not only on `--agent`. That was
  added mid-change to close the gap Codex raised, and it is covered by the spec
  delta rather than left as a silent widening.
- No change to any jt-flow skill text or to the CodeRabbit contract itself.

## Affected plugins

None. The change is confined to `scripts/jt-flow-review-policy.test.mjs` plus
the spec delta; no published plugin content moves.
