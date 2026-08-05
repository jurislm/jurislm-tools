# 2026-08-06 Code review fix verification

Follow-up to `2026-08-05-implementation-verification.md`. Reviewer verdict on
the original implementation was 0 Critical / 2 Important / 4 Minor; the
reviewer independently confirmed correctness by removing `node_modules` and
testing live, running adversarial `\n`-injection cases, and confirming the
release tag had not moved, and found D1–D7 faithfully implemented with all
Non-goals held. This log covers the five items the coordinator adopted for
this round (Important #1, Minor #2–#5). Important #2 (branch protection) is
explicitly deferred to task 6.2, owned outside this worktree, per the
original assignment.

Commits: `3c4a26c` (item 5), `b3efc1e` (item 1), `439e299` (items 2, 3, 4).

## Item 5 — ambiguous "Commit types:" marker in CLAUDE.md now fails loudly

`parseClaudeMdCommitTypes` used `indexOf`, which silently binds to the first
occurrence if a second heading with the same text is ever added. Changed to
count occurrences and throw when there is more than one.

```
$ node --test scripts/commit-types.test.mjs
...
ok 4 - throws when the repository CLAUDE.md has exactly one Commit types marker
ok 5 - throws when the Commit types marker appears more than once (ambiguous parse target)
ok 6 - a single Commit types marker in a fixture still parses normally
...
# tests 6
# pass 6
# fail 0
```

Behavioral check against the real repository file (not just the fixture):

```
$ node -e '...parseClaudeMdCommitTypes()...'
real CLAUDE.md OK
```

## Item 1 — CLAUDE.md now documents that the Commit types list is machine-parsed

First draft of the added note repeated the literal string `Commit types:`
inside its own explanatory sentence — which immediately tripped the item 5
ambiguity check that had just been added, since the file then had two
occurrences of that exact string. Caught by actually running the test
before committing, not by inspection:

```
$ node --test scripts/commit-types.test.mjs   # with the first (broken) wording
not ok 3 - CLAUDE.md Commit types list matches the permitted types
  error: '"Commit types:" appears 2 times in CLAUDE.md; the parse target is
          ambiguous. Keep exactly one such heading in this file.'
not ok 4 - throws when the repository CLAUDE.md has exactly one Commit types marker
  error: Got unwanted exception (same message)
# pass 4
# fail 2
```

Reworded to describe the heading without repeating its exact text. Re-run
after the fix, required by the completion condition ("附上改完 CLAUDE.md 後
commit-types.test.mjs 仍通過的輸出"):

```
$ node --test scripts/commit-types.test.mjs
...
1..6
# tests 6
# pass 6
# fail 0
```

`npx markdownlint 'CLAUDE.md'` — exit 0, no findings.

## Items 2, 3, 4 — validateTitle message clarity and defenses

All three touch `scripts/validate-pr-title.mjs`'s `validateTitle`. Verified
with `node --test` (19/19 in `validate-pr-title.test.mjs`, including 8 new
tests for these items) and, per the completion condition, direct process
-level invocation — a spawned child process per case with explicit `env`
(bypassing shell quoting entirely, since an earlier attempt using inline
`$'...'`/Unicode shell escaping silently corrupted the capture — see
"Note on method" below) plus in-process calls to the exported function for
item 3. Full script: this session's scratch file
`review-fix-verify.mjs` (not checked into the repository; output below is
its complete captured stdout, unedited).

### Item 4 — real Traditional Chinese PR title (feat) passes

```
$ DRONE_PULL_REQUEST="179" DRONE_PULL_REQUEST_TITLE="feat(jt-flow): 阻塞時走封閉迴圈，不停在問題回報" node scripts/validate-pr-title.mjs
stdout: PR title OK: "feat(jt-flow): 阻塞時走封閉迴圈，不停在問題回報"
exit code: 0
```

### Item 4 — real Traditional Chinese PR title (docs) passes

```
$ DRONE_PULL_REQUEST="179" DRONE_PULL_REQUEST_TITLE="docs(openspec): archive dependency-aware jt-flow rollout" node scripts/validate-pr-title.mjs
stdout: PR title OK: "docs(openspec): archive dependency-aware jt-flow rollout"
exit code: 0
```

### Item 4 — a title whose description is only a zero-width space (U+200B) is rejected

```
$ DRONE_PULL_REQUEST="179" DRONE_PULL_REQUEST_TITLE="feat: ​" node scripts/validate-pr-title.mjs
stderr: Title "feat: ​" has no description after "feat:" (only whitespace or invisible characters).
exit code: 1
```

(The title above contains a literal U+200B between the colon and the
closing quote; it renders as nothing visible in most fonts, which is the
point of the test.)

### Item 2 — missing space after colon (permitted type) gets a distinct, specific message

```
$ DRONE_PULL_REQUEST="179" DRONE_PULL_REQUEST_TITLE="feat:oops" node scripts/validate-pr-title.mjs
stderr: Title "feat:oops" is missing a space after "feat:" — Conventional Commits requires "feat: description", with a space before the description.
exit code: 1
```

### Item 2 — no type at all gets the original generic message, for contrast

```
$ DRONE_PULL_REQUEST="179" DRONE_PULL_REQUEST_TITLE="Bump the version number" node scripts/validate-pr-title.mjs
stderr: Title "Bump the version number" has no Conventional Commits type (expected "type: description" or "type(scope): description"). Permitted types: feat, fix, docs, chore.
exit code: 1
```

The two messages above are categorically different (missing-space vs.
no-type-at-all), not merely different because the input title differs.

### Item 2 — unpermitted type with missing space still reports type-not-permitted

```
$ DRONE_PULL_REQUEST="179" DRONE_PULL_REQUEST_TITLE="perf:oops" node scripts/validate-pr-title.mjs
stderr: Title "perf:oops" uses type "perf", which is not permitted. Permitted types: feat, fix, docs, chore.
exit code: 1
```

### Item 3 — direct calls to the exported validateTitle with undefined/null/no argument

```
validateTitle(undefined) => {"valid":false,"reason":"Title \"\" has no Conventional Commits type (expected \"type: description\" or \"type(scope): description\"). Permitted types: feat, fix, docs, chore."}
validateTitle(null) => {"valid":false,"reason":"Title \"\" has no Conventional Commits type (expected \"type: description\" or \"type(scope): description\"). Permitted types: feat, fix, docs, chore."}
validateTitle() => {"valid":false,"reason":"Title \"\" has no Conventional Commits type (expected \"type: description\" or \"type(scope): description\"). Permitted types: feat, fix, docs, chore."}
```

The literal word "undefined"/"null" does not appear in any reason string;
all three coerce to an empty-string title.

### Note on method

The first attempt to gather this evidence used inline shell environment
assignment with `$'...'`/`\u` escaping for the zero-width-space case, and
`2>&1` was omitted from one `tee` invocation. Both mistakes were caught by
re-reading the actual captured file content rather than trusting the
terminal echo: the shell aborted the compound command on a Unicode-escape
parse error partway through (silently skipping the remaining cases in that
block), and the `stderr`-only rejection messages were absent from the file
despite having printed to the terminal. Switched to `child_process.spawnSync`
with an explicit `env` object (no shell re-interpretation of the title
string at all) and captured `stdout`/`stderr`/`status` directly in the
script, which is what is pasted above.

## Full suite after all five fixes

```
$ npm run validate
...
# tests 91
# pass 91
# fail 0
# cancelled 0
# skipped 0
# todo 0

> check:plugins
Plugin repository validation passed

> check:versions
Version sync OK: 1.33.2

> lint:md
(no output — clean)
```

91 tests, up from 80 before this round (+6 in `commit-types.test.mjs`, +8 in
`validate-pr-title.test.mjs`; net of the earlier 80 minus none removed).

## Not addressed in this round, on purpose

- **Important #2 (branch protection not yet enabled)** — task 6.2, must wait
  for this PR's own `continuous-integration/drone/pr` to pass at least once
  before it can be safely enabled, otherwise the repository locks itself out
  of merging its own protection-enabling change. Owned by the coordinator
  outside this worktree; no repository settings were touched here.

No item was judged unnecessary and skipped — all five adopted items were
implemented and verified above.
