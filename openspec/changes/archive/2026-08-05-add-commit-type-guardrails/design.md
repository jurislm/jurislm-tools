# Design

## D1. One list, three consumers — consistency is enforced, not maintained

The failure this change addresses was itself a consistency failure: `CLAUDE.md` permitted four
commit types while `release-please-config.json` accepted eight, and nothing compared them. Writing
the allowlist a third time inside a CI checker would repeat the same mistake with better odds.

`scripts/commit-types.mjs` becomes the single definition. Three consumers derive from it:

| Consumer | How it derives |
| --- | --- |
| Pull-request title checker | Imports the constant directly |
| `release-please-config.json` | A test asserts its `changelog-sections` types equal the constant |
| `CLAUDE.md` | A test parses the `Commit types:` list and asserts it equals the constant |

Drift in any of the three fails `npm test`. Adding a type becomes a single edit plus two tests
that go green; today it is three independent edits nobody verifies.

The `CLAUDE.md` assertion parses the existing prose list rather than demanding a new machine
-readable block, so the document stays written for humans.

## D2. The allowlist is `feat`, `fix`, `docs`, `chore`

Provenance was checked rather than assumed. The list arrived in commit `c419c84` inside the
Release Please ownership section, and is a deliberate classification keyed to *plugin behavior*:
new or materially expanded behavior (`feat`), incorrect behavior or information (`fix`), and
non-behavioral maintenance (`docs`/`chore`). It is internally consistent, not a truncated copy of
the commitlint default set. Conventional Commits rule 10 permits a project-defined subset, so four
types is specification-compliant.

Two of the last 25 pull requests would fail this rule: #173 `ci:` and #154 `refactor:`. Under the
CLAUDE.md classification both are non-behavioral maintenance and belong to `chore`. They are prior
violations of the written rule, not precedent for widening it. Widening would mean amending
`CLAUDE.md` — with D1 in place that is one edit and two green tests, so the option stays cheap and
explicit rather than being silently pre-granted here.

Release-please PR titles (`chore(main): release X.Y.Z`) pass unchanged, verified against the last
25 PR titles.

## D3. Validate the pull-request title, not commit messages

The squash subject is the only message release-please reads. The Conventional Commits FAQ
explicitly permits maintainers to clean that message at merge time, so intermediate commits on a
PR branch are not a meaningful target. Setting `squash_merge_commit_title=PR_TITLE` makes the PR
title the sole source of that subject, which makes it the correct thing to gate.

`COMMIT_OR_PR_TITLE` — the current value — uses the commit title when a PR has exactly one commit
and the PR title otherwise. That conditional lets the validated artifact and the shipped artifact
diverge for single-commit PRs, exactly the case CI would have passed. `PR_TITLE` removes the
branch.

Residual gap: `gh pr merge --subject` can still override the subject at merge time, and no
repository setting forbids it. That is precisely how 1.33.2 happened. D4 closes it from the other
side — the override lands on `main`, where a push-side check can still catch it.

## D4. Check both boundaries, because they fail differently

| Boundary | Trigger | Catches | Effect |
| --- | --- | --- | --- |
| Pull-request title | `pull_request` build | A bad title before merge | Blocks merge (D5) |
| Squash subject on `main` | `push` to `main` | A `--subject` override that bypassed the PR title | Fails after the fact, before release-please cuts |

The push-side check reads `DRONE_COMMIT_MESSAGE`'s first line. It cannot block — the commit is
already on `main` — but it turns a silently wrong CHANGELOG into a red build on the commit that
caused it, while the release PR is still open and its title still editable. Without it, D3's
residual gap has no detection at all.

## D5. Branch protection makes the PR check binding

`main` has no branch protection and no rulesets (verified: `/branches/main/protection` → 404,
`/rulesets` → `[]`), so a red pipeline currently cannot stop a merge. The earlier draft deferred
this on the claim that a required status check would conflict with release-please. **That claim
was wrong and is withdrawn** — it cited an archive change that does not exist. The real source,
issue #142, describes `mergeStateStatus=UNSTABLE` occurring *while main had no branch protection*,
and was fixed by adjusting jt-flow's gate, never by touching repository settings.

Measured instead of assumed: release PR #180's `continuous-integration/drone/pr` check **passes**,
same as feature PR #179's. A required check on that context does not stall releases.

Protection settings and why each is chosen:

| Setting | Value | Reason |
| --- | --- | --- |
| `required_status_checks.contexts` | `["continuous-integration/drone/pr"]` | The exact context observed on real PRs |
| `required_status_checks.strict` | `false` | Requiring every PR to re-sync with `main` before merge adds rebase churn for a solo maintainer without addressing this failure mode |
| `enforce_admins` | `false` | Leaves a recovery path if Drone is down or a webhook is dropped; without it an outage makes the repository unmergeable |
| `required_pull_request_reviews` | `null` | A solo maintainer cannot approve their own PR; requiring review would block every merge |
| `allow_force_pushes` / `allow_deletions` | `false` | `main` is the only long-lived branch |

`CodeRabbit` is deliberately **not** a required context: it is an external service subject to rate
limits, and the repository's own policy already tolerates skipping it when quota is exhausted.

## D6. Fail loudly on missing input

`DRONE_PULL_REQUEST_TITLE` availability was verified, not assumed (evidence in
`verification-logs/`): `runner-go` `environ/environ.go` L186-189 injects it from `build.Title`
under `event == pull_request`, and this instance's build 21 carries the correct title. Both
variables appear together, so an empty `DRONE_PULL_REQUEST` reliably means "not a pull request".

The checker still distinguishes three states, now as defence rather than as a pending experiment:

| State | Behavior |
| --- | --- |
| `DRONE_PULL_REQUEST` empty | Skip, stating why |
| Title present | Validate |
| `DRONE_PULL_REQUEST` set but title empty | **Fail** — this contradicts the verified injection contract and must not pass silently |

## D7. Reuse existing script and test conventions

`scripts/` already holds plain `.mjs` validators with `node --test` siblings run through
`npm run validate`. Both checkers follow that shape: pure exported functions for unit tests, thin
CLI wrappers that read the environment and set exit codes. No new dependency, no new test
framework.
