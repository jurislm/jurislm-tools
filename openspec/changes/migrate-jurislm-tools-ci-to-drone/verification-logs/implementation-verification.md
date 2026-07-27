# Implementation verification

Date: 2026-07-27 (Asia/Taipei)

## TDD evidence

Before `.drone.yml` or its validator existed:

```text
node --test scripts/drone-ci-policy.test.mjs
tests 2
pass 0
fail 2
bash: scripts/validate-drone-yml.sh: No such file or directory
```

After the minimal validator and configuration were added:

```text
node --test scripts/drone-ci-policy.test.mjs
tests 2
pass 2
fail 0
```

The second test executes the real validator against a temporary valid Drone
document whose release steps are reversed. The validator exits nonzero with
`github-release must run before release-pr`.

## Static Drone validation

```text
npm run validate:drone
validated .drone.yml: validate + release
exit 0
```

The command also ran `drone lint .drone.yml` through Drone CLI 1.9.0 and exited
zero.

## Repository validation

```text
npm run validate
tests 45
pass 45
fail 0
Plugin repository validation passed
Version sync OK: 1.32.5
markdownlint exit 0

claude plugin validate .
Validation passed

openspec validate --all --strict
Totals: 8 passed, 0 failed

git diff --check
exit 0
```

## Pending live gates

- Push the branch and confirm a successful Drone pull-request build plus
  matching GitHub status.
- Confirm post-merge `main` validation and release pipeline results.
- Update PR #171 from `main` and confirm its Drone status.

## Drone secret readback

The existing local credential was written to the Drone repository without
printing its value. `drone secret ls jurislm/jurislm-tools` returned:

```text
RELEASE_PLEASE_TOKEN
Pull Request Read: false
Pull Request Write: false
```

## Drone activation correction

Opening PR #173 produced no Drone build or GitHub Drone status. GitHub's
repository hook list was empty, and `drone repo repair
jurislm/jurislm-tools` failed with:

```text
client error 404: {"message":"sql: no rows in result set"}
```

This proved that earlier `drone repo info` output came from Drone's synchronized
repository list, not an activated repository. `drone repo enable
jurislm/jurislm-tools` then reported successful activation. Immediate readback
showed:

```text
Config: .drone.yml
webhook active: true
webhook events: create, delete, deployment, pull_request, push
webhook last response: 200 OK
RELEASE_PLEASE_TOKEN
Pull Request Read: false
Pull Request Write: false
```

The evidence correction is committed and pushed so the resulting PR synchronize
event exercises the newly connected webhook without a synthetic custom build.

## Review disposition

The local code review found one Important issue: the initial validator checked
the first validate step's image and secret isolation while aggregating commands
from every step. A second step could therefore escape the contract.

The fix added a negative fixture that initially passed incorrectly, then
required exactly one validate step and bound its image, commands, and lack of
release credentials to that same step. The focused suite now reports three
passing tests, including both negative fixtures.
