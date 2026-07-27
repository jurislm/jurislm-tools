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

## Validation

Pending implementation.
