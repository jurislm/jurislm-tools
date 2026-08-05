# 2026-08-06 CodeRabbit review fix verification (PR #183)

CodeRabbit returned 4 inline findings. The coordinator adjudicated: 3
adopted (A, B, C), 1 rejected (D, with the coordinator replying on the PR).
This log covers the 3 adopted items plus independent re-verification of the
evidence behind rejecting D. Commits: `a5059cc` (A), `d166d3e` (B and C).

## A — `/^\s/` accepted tab/newline/full-width space as the type-colon separator

`scripts/validate-pr-title.mjs:75` (before fix) used `/^\s/`, matching any
Unicode whitespace, but the declared format is literally `"type: description"`
— only U+0020 satisfies that. Fixed to `rest.startsWith(" ")`.

### Unit tests (4 new, `validate-pr-title.test.mjs`)

```
$ node --test scripts/validate-pr-title.test.mjs
...
ok 11 - a tab after the colon is rejected as missing space, not accepted as the required separator (CodeRabbit finding A)
ok 12 - a newline after the colon is rejected as missing space, not accepted as the required separator
ok 13 - a full-width (CJK) space after the colon is rejected as missing space, not accepted as the required separator
ok 14 - a single literal space after the colon still passes
...
# tests 23
# pass 23
# fail 0
```

### Confirmed (not assumed) that `validate-squash-subject.mjs` shares the fix

It imports `validateTitle` rather than duplicating the regex, but this was
verified by actually exercising it through `checkSquashSubject`, not by
reading the import statement:

```
$ node --test scripts/validate-squash-subject.test.mjs
...
ok 6 - a tab after the colon in the squash subject is rejected — checkSquashSubject shares the fix via the imported validateTitle, confirmed here rather than assumed (CodeRabbit finding A)
...
# tests 6
# pass 6
# fail 0
```

### Behavioral CLI proof — `"feat:\tdescription"` rejected in both scripts, distinct from the no-type message

```
#### validate-pr-title.mjs — tab after colon
{"DRONE_PULL_REQUEST":"179","DRONE_PULL_REQUEST_TITLE":"feat:\tdescription"}
stderr: Title "feat:\tdescription" is missing a space after "feat:" — Conventional Commits requires "feat: description", with a space before the description.
exit code: 1

#### validate-squash-subject.mjs — tab after colon
{"DRONE_PULL_REQUEST":"","DRONE_COMMIT_MESSAGE":"feat:\tdescription"}
stderr: Title "feat:\tdescription" is missing a space after "feat:" — Conventional Commits requires "feat: description", with a space before the description.
exit code: 1
```

(Captured with `child_process.spawnSync` and an explicit `env` object, per
the shell-quoting lesson from the previous round's log — no shell
re-interpretation of the tab character.)

## B — `tasks.md` 8.1 omitted `claude plugin validate .`

This repository's coding guidelines require `npm ci`, `npm run validate`,
and `claude plugin validate .` for changes touching
`**/*.{json,yml,yaml,js,mjs,md}`. Task 8.1 only named the first two. Updated
the task text and actually ran the command rather than assuming it works in
this environment:

```
$ which claude
/Users/terrychen/.local/bin/claude

$ claude --version
2.1.221 (Claude Code)

$ claude plugin validate .
Validating marketplace manifest: /Users/terrychen/Documents/Github/jurislm/jurislm-tools/.claude/worktrees/add-commit-type-guardrails/.claude-plugin/marketplace.json

✔ Validation passed
exit=0
```

Available and passing in this worktree; no unavailability to record.

## C — `tasks.md` 6.2 and 8.5 were unchecked despite being executed

CodeRabbit's finding ("branch protection declared but not enabled") had a
premise that went stale mid-review: the coordinator ran task 6.2 after
CodeRabbit started reviewing. The actual gap was documentation, not
infrastructure. Re-verified independently rather than copying the
coordinator's numbers:

```
$ gh api repos/jurislm/jurislm-tools/branches/main/protection \
    --jq '{required_status_checks, enforce_admins: .enforce_admins.enabled, required_pull_request_reviews, allow_force_pushes: .allow_force_pushes.enabled, allow_deletions: .allow_deletions.enabled}'
{
  "allow_deletions": false,
  "allow_force_pushes": false,
  "enforce_admins": false,
  "required_pull_request_reviews": null,
  "required_status_checks": {
    "contexts": ["continuous-integration/drone/pr"],
    "strict": false,
    ...
  }
}
```

All fields match what the coordinator specified: single required context
`continuous-integration/drone/pr`, `strict=false`, `enforce_admins=false`,
no required PR reviews, no force pushes, no deletions.

```
$ gh pr view 183 --json mergeable,mergeStateStatus --repo jurislm/jurislm-tools
{"mergeStateStatus":"CLEAN","mergeable":"MERGEABLE"}
```

The coordinator's earlier read showed `mergeStateStatus=UNSTABLE` (from the
non-required CodeRabbit check); this fresh read at verification time shows
`CLEAN` — consistent with the coordinator's claim that UNSTABLE does not
affect mergeability, and the state has since resolved. Both readings are
recorded in `tasks.md` 8.5.

`proposal.md` and `specs/ci-platform/spec.md` were left untouched, as
instructed — grep confirms zero diff on either:

```
$ git diff --stat openspec/changes/add-commit-type-guardrails/proposal.md openspec/changes/add-commit-type-guardrails/specs/
(no output)
```

## D — rejected, verified rather than taken on faith

Not implemented, per the coordinator's explicit decision. Independently
re-checked both grounds given for rejection before accepting them:

1. **Repository visibility.** `gh repo view jurislm/jurislm-tools --json
   visibility` → `{"visibility":"PUBLIC"}`, confirmed directly in this
   session. A PR title, number, or squash subject is not new exposure on a
   public repository; CWE-532 targets credentials/tokens in logs, not
   already-public PR metadata.
2. **Conflict with this change's own delta spec.** Confirmed by reading the
   file directly, not by trusting the line numbers cited:
   `openspec/changes/add-commit-type-guardrails/specs/ci-platform/spec.md:35`
   reads "the `validate` pipeline fails and reports the rejected title and
   the permitted types", and line 71 reads "the `push` build on `main`
   fails and identifies the offending subject." Both exist verbatim.
   Masking the title/subject in the CI failure message would violate these
   requirements this change itself introduced.

No changes made to `validate-pr-title.mjs`'s or `validate-squash-subject.mjs`'s
error-message content for this finding, and no verification log entries were
masked or redacted.

## Full suite after items A, B, C

```
$ npm run validate
...
# tests 96
# pass 96
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

96 tests, up from 91 before this round (+4 in `validate-pr-title.test.mjs`,
+1 in `validate-squash-subject.test.mjs`).

`openspec validate add-commit-type-guardrails --strict` → `Change
'add-commit-type-guardrails' is valid`.

## Not pushed

Per instruction, no `git push` was performed in this round; the coordinator
controls push timing given CodeRabbit's exhausted review budget.
