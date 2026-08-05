# 2026-08-05 Implementation verification

Executed inside the feature worktree
`jurislm-tools/.claude/worktrees/add-commit-type-guardrails`, after phases 1–5
and 7.1 were implemented and committed (commits `f56404b`, `f3fbf2e`,
`36b912b`, `9d9d2cb`, `a403de2`). Phase 6.2 (branch protection) and 7.2
(release notes) require a merged/mergeable pull request and are out of scope
for this log; task 8.4/8.5 (live Drone build log, post-protection mergeable
check) likewise require a pushed PR and are left to the follow-up merge step.

## 1. `npm run validate` — full suite

```
$ npm run validate
...
1..80
# tests 80
# suites 0
# pass 80
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 265.063334

> check:plugins
> node scripts/validate-plugin-repository.mjs

Plugin repository validation passed

> check:versions
> node scripts/check-version-sync.mjs

Version sync OK: 1.33.2

> lint:md
> markdownlint 'README.md' 'CLAUDE.md' '.github/**/*.md' 'plugins/*/README.md' 'plugins/*/skills/*/SKILL.md' 'openspec/changes/**/*.md' 'openspec/specs/**/*.md'

exit=0
```

80 tests pass (up from the 61 baseline before this change: +3 in
`commit-types.test.mjs`, +11 in `validate-pr-title.test.mjs`, +5 in
`validate-squash-subject.test.mjs`). `check:plugins`, `check:versions`, and
`lint:md` all pass with no output (no findings).

## 2. Behavioral verification — direct CLI invocation, every D4/D6 state

Test-only assertions were not treated as sufficient; both scripts were
invoked directly with real environment variables, covering every state in
design D6 (pull-request title) and D4 (push-side squash subject) plus one
rejected title, distinct from the "title empty" failure state.

### `scripts/validate-pr-title.mjs`

#### State 1 — `DRONE_PULL_REQUEST` empty (push build, not a PR): skip

```
$ DRONE_PULL_REQUEST="" DRONE_PULL_REQUEST_TITLE="" node scripts/validate-pr-title.mjs
Not a pull-request build (DRONE_PULL_REQUEST is empty); skipping PR title check.
exit code: 0
```

#### State 2 — title present and permitted: validates and passes

```
$ DRONE_PULL_REQUEST="179" DRONE_PULL_REQUEST_TITLE="feat(jt-flow): add a new checker" node scripts/validate-pr-title.mjs
PR title OK: "feat(jt-flow): add a new checker"
exit code: 0
```

#### State 3 — `DRONE_PULL_REQUEST` set, title empty: fails loudly (design D6, not a silent skip)

```
$ DRONE_PULL_REQUEST="179" DRONE_PULL_REQUEST_TITLE="" node scripts/validate-pr-title.mjs
DRONE_PULL_REQUEST is set ("179") but DRONE_PULL_REQUEST_TITLE is empty. This contradicts the verified runner-go environ contract, which injects both variables together for pull_request builds; failing rather than skipping silently.
exit code: 1
```

#### Rejected title — out-of-policy type (`perf`), distinct from the empty-title failure above

```
$ DRONE_PULL_REQUEST="179" DRONE_PULL_REQUEST_TITLE="perf: improve something" node scripts/validate-pr-title.mjs
Title "perf: improve something" uses type "perf", which is not permitted. Permitted types: feat, fix, docs, chore.
exit code: 1
```

### `scripts/validate-squash-subject.mjs`

#### State 1 — push to main (`DRONE_PULL_REQUEST` empty), conforming subject: passes

```
$ DRONE_PULL_REQUEST="" DRONE_COMMIT_MESSAGE="chore(main): release 1.34.0" node scripts/validate-squash-subject.mjs
Squash subject OK: "chore(main): release 1.34.0"
exit code: 0
```

#### State 2 — push to main, out-of-policy first line, multi-line body ignored (design D4: only the first line is read)

```
$ DRONE_PULL_REQUEST="" DRONE_COMMIT_MESSAGE=$'style: repaint the button\n\nfeat: this body line must not matter' node scripts/validate-squash-subject.mjs
Title "style: repaint the button" uses type "style", which is not permitted. Permitted types: feat, fix, docs, chore.
exit code: 1
```

The body line `feat: this body line must not matter` — which would pass if
read — is correctly ignored; only the first line (`style: ...`) is
evaluated and correctly rejected.

#### State 3 — `DRONE_PULL_REQUEST` set (a pull-request build, not a push to main): skip

```
$ DRONE_PULL_REQUEST="179" DRONE_COMMIT_MESSAGE="style: repaint the button" node scripts/validate-squash-subject.mjs
DRONE_PULL_REQUEST is set ("179"); this is a pull-request build, not a push to main. Skipping the squash-subject check (validate-pr-title.mjs already covers it).
exit code: 0
```

All seven invocations match their designed behavior exactly: no unexpected
skips, no silent passes on out-of-policy input, and the empty-title state
(D6) fails rather than being treated the same as the empty-`DRONE_PULL_REQUEST`
skip state.

## 3. `openspec validate add-commit-type-guardrails --strict`

```
$ openspec validate add-commit-type-guardrails --strict
Change 'add-commit-type-guardrails' is valid
exit=0
```

## 4. `bash scripts/validate-drone-yml.sh`

Run with the `drone` CLI present (`drone lint` executed, not skipped):

```
$ bash scripts/validate-drone-yml.sh
validated .drone.yml: validate + release
exit=0
```

## 5. Drone config assertions (phase 5 self-check)

Before `.drone.yml` was edited, `node scripts/validate-drone-config.mjs
.drone.yml` was run against the pre-existing file with the new
ordering/presence assertions already added to the checker, confirming Red
for the expected reason:

```
ERROR: validate must run both the pull-request title and squash-subject commit-type checkers
ERROR: the commit-type checkers must run before npm run validate so a bad title fails fast
exit=1
```

After adding the two `node scripts/validate-*.mjs` commands to `.drone.yml`
ahead of `npm ci`/`npm run validate`:

```
$ node scripts/validate-drone-config.mjs .drone.yml
validated .drone.yml: validate + release
exit=0
```

`node --test scripts/drone-ci-policy.test.mjs` (3 tests, including the
end-to-end check against the real `.drone.yml`) also passed unchanged — no
update to that file was required because the new commands were added inside
the existing single `validate` step rather than as new step objects, so the
step-count and isolation assertions it enforces still hold.

## Notes for the reviewer

- Tasks 8.4 (confirm `DRONE_PULL_REQUEST_TITLE` from this PR's actual Drone
  build log) and 8.5 (confirm `mergeable`/`mergeStateStatus` after branch
  protection is enabled) require a pushed pull request and live branch
  protection respectively; both are deferred to the merge step performed
  outside this worktree, per the task assignment.
- Phase 6.2 (enabling branch protection) and 7.2 (correcting the GitHub
  Release notes for tag `v1.33.2`) are likewise out of scope here.
