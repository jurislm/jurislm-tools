# Implementation verification: markdownlint audit remediation

Date: 2026-07-27 (Asia/Taipei)

## Red: failing baseline

Commands were run from the isolated
`codex/fix-markdownlint-audit-findings` worktree at proposal commit `bec7e91`.

### Full development dependency audit

Command:

```bash
npm audit --json
```

Result: exit 1 with the following metadata:

```json
{
  "info": 0,
  "low": 0,
  "moderate": 2,
  "high": 3,
  "critical": 0,
  "total": 5
}
```

### Affected dependency tree

Command:

```bash
npm ls markdownlint-cli js-yaml markdown-it linkify-it brace-expansion --all
```

Result: exit 0 with the relevant tree:

```text
markdownlint-cli@0.48.0
├── js-yaml@4.1.1
├─┬ markdown-it@14.1.1
│ └── linkify-it@5.0.1
└─┬ minimatch@10.2.5
  └── brace-expansion@5.0.6
```

### Production dependency boundary

Command:

```bash
npm audit --omit=dev --json
```

Result: exit 0 with zero findings at every severity and zero total findings.
This confirms that the failing audit is limited to the development toolchain.

## Green: upgraded dependency tree

### First attempt and root-cause analysis

`npm install --save-dev markdownlint-cli@^0.49.1` upgraded the direct package
and most affected transitives, but the full audit still exited 1 with one high
finding in `brace-expansion@5.0.6`.

Inspection showed:

- `markdownlint-cli@0.49.1` declares `minimatch ~10.2.5`.
- Resolved `minimatch@10.2.5` declares `brace-expansion ^5.0.5`.
- The existing lock retained `brace-expansion@5.0.6`.
- Fixed `brace-expansion@5.0.8` satisfies that upstream range.
- npm also derived the lockfile root name from the linked worktree directory;
  this metadata drift must be restored before acceptance.

The proposal was synchronized before continuing: use a scoped transitive
refresh within the upstream-supported range, without an override or new direct
dependency.

### Accepted dependency tree

Commands:

```bash
npm update brace-expansion
npm ls markdownlint-cli js-yaml markdown-it linkify-it brace-expansion --all
```

Relevant result:

```text
markdownlint-cli@0.49.1
├── js-yaml@5.2.2
├─┬ markdown-it@14.3.0
│ └── linkify-it@5.0.2
└─┬ minimatch@10.2.5
  └── brace-expansion@5.0.8
```

`package.json` contains only the direct development dependency
`markdownlint-cli: ^0.49.1`; it has no `overrides` and does not declare
`brace-expansion`. The lockfile root name was restored to `jurislm-tools`.

### Fresh-install audit

Commands:

```bash
npm ci
npm audit --json
```

Result: both exited 0. The audit metadata was:

```json
{
  "info": 0,
  "low": 0,
  "moderate": 0,
  "high": 0,
  "critical": 0,
  "total": 0
}
```

## Validation

The following commands completed successfully after the fresh install:

```bash
npm run lint:md
npm run validate
claude plugin validate .
openspec validate fix-markdownlint-audit-findings --strict
git diff --check
```

Results:

- The unchanged Markdown lint command passed without content, rule, or scope
  changes.
- All 42 Node tests passed with 0 failures.
- Plugin repository validation passed.
- Version synchronization remained `1.32.5`.
- Native Claude plugin validation passed.
- The OpenSpec change remained strict-valid.
- The package diff consists of `package.json`, `package-lock.json`, and the
  OpenSpec evidence/task updates; no plugin runtime or release-managed file
  changed.

## OpenSpec implementation verification

| Dimension | Status |
|---|---|
| Completeness | 10/12 tasks complete; only PR delivery and post-merge archive remain |
| Correctness | 4/4 requirements and 5/5 scenarios mapped to package/audit evidence |
| Coherence | Direct upgrade plus scoped compatible lock refresh follows the synchronized design |

Fresh machine checks confirmed:

- Direct range is exactly `markdownlint-cli: ^0.49.1`.
- No package or lockfile `overrides` exists.
- `brace-expansion` was not added as a direct dependency.
- Lockfile root name remains `jurislm-tools`.
- Lock resolutions are `markdownlint-cli@0.49.1` and
  `brace-expansion@5.0.8`.
- The effective engine minimum is Node.js `22.22.2`, set by locked
  `ini@7.0.0`; local Node.js is `22.23.1`, and CI's floating Node.js 22
  selection resolves to a current compatible patch.
- Full audit metadata remains zero at every severity.
- No `.claude-plugin`, `plugins`, Release Please manifest, or release
  configuration file is in the implementation diff.

The local review found one Minor documentation precision issue: the artifacts
originally described compatibility as Node.js 22 broadly, while the locked
transitive tree requires at least `22.22.2`. The proposal, design, spec, tasks,
and this evidence log now state the effective minimum explicitly. There are no
remaining local-review correctness or coherence findings.

PR review then identified that the effective range must remain visible after
OpenSpec archive and must be enforceable at the root package boundary. The
proposal now requires the exact supported range
`^22.22.2 || ^24.15.0 || >=26.0.0` in `package.json`, `package-lock.json`,
`README.md`, and `CLAUDE.md`. Implementation tasks 2.3, 2.4, and 3.6 remain
open pending user approval of this material scope expansion. Tasks 4.2 and 4.3
also remain open for PR/CI and post-merge archive evidence.
