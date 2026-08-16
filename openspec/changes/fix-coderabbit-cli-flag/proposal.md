# Fix the CodeRabbit CLI flag in jt-flow-one

## Why

`jt-flow-one` prescribes the CLI fallback command twice — at `SKILL.md:247` and
`:479` — as:

```
coderabbit review --agent --type committed --base <remote>/main
```

`--type` is not a flag of the installed CLI. Read back on 2026-08-16 (Taiwan
time) against `coderabbit` 0.7.3: the option list contains `--committed`, and
`--type` appears nowhere in it. Evidence in
`openspec/changes/fix-coderabbit-cli-flag/verification-logs/2026-08-16-cli-flag-readback.md`.

**Why this is not cosmetic.** The same skill states that calling the CLI
exhausts the single fallback whatever it returns, and that it must never be
retried. So following the documented command produces an argument error from
commander, the fallback is spent on a call that never reached CodeRabbit, and
the PR's external-review gate becomes unsatisfiable. The failure lands exactly
when it costs most: the CLI is only reached after the GitHub App has already
failed.

The skill already carries the correct instruction one line earlier — `:238`
requires running `coderabbit review --help` before every invocation — but a
concrete command written three lines below is what a reader copies. The
prescribed command must not be the stale one.

`jurislm/entire` currently compensates with a repo-local note recording the
tested counter-example. That note exists only because the authority is wrong;
it is the "maintain the same rule in several places" problem this project is
trying to remove.

## What Changes

- Replace `--type committed` with `--committed` at both `SKILL.md:247` and
  `:479`.
- State at both sites that the spelling is re-read from `coderabbit review
  --help` at invocation time and never copied from a document, so the next drift
  is caught by the reader rather than by a spent fallback.

## Non-goals

- No change to the review budget, the fallback routing, the authorization or
  disclosure contract, or any other CodeRabbit rule.
- No change to the preflight sequence at `:238`, which is already correct.
- No change to `jurislm/entire`. Its repo-local note may be removed once this
  ships, but that is a separate change in a separate repository.

## Affected plugins

`jt-flow` only.
