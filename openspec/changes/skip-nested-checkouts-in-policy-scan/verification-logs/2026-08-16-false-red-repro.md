# Nested-checkout false red — reproduction

Date: 2026-08-16 (Taiwan time)

Run in the main jurislm-tools working tree, which has sibling worktrees under
`.claude/worktrees/`:

```
$ node --test scripts/jt-flow-review-policy.test.mjs
not ok 9 - every prescribed CodeRabbit CLI invocation names --help as its flag authority
  error: '.claude/worktrees/research-spectra-stale-in-progress-markers/CLAUDE.md:
          a paragraph prescribes the CLI without naming --help as the authority for its flag spelling'
# pass 8
# fail 1
```

⚠️ The failing assertion is the **`--help`** one, not the stale-spelling one.
Two of the stale copies' `CLAUDE.md` contain no `coderabbit review --help` at all
(`grep -c` → 0), and that assertion runs first. Recording the other message would
point a reader at "the repo under test carries a stale spelling", when the truth
is "another branch's copy never named `--help`" — a different assertion with a
different cause.

`grep -rln -- '--type committed' .claude/` shows where the stale copies live
(this is the grep's output, not the test's — the test aborts at its first failing
assertion):

```
.claude/worktrees/research-spectra-stale-in-progress-markers/CLAUDE.md
.claude/worktrees/research-spectra-stale-in-progress-markers/plugins/jt-flow/skills/jt-flow-one/SKILL.md
.claude/worktrees/remove-superpowers-plan-spec-flow/CLAUDE.md
.claude/worktrees/remove-superpowers-plan-spec-flow/plugins/jt-flow/skills/jt-flow-one/SKILL.md
```

CI is a fresh clone with no nested worktrees, so it stays green — the guard
protects the merge path, but the local run is unusable.
