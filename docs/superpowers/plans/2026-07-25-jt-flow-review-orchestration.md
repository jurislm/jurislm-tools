# JT Flow Review Orchestration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the unavailable `/code-review` dependency with the portable
Superpowers reviewer while allowing one local review per changed code batch and
limiting CodeRabbit and Copilot to one effective review each per PR or change.

**Architecture:** Keep review ownership in `jt-flow-one`. Encode the policy in
the Skill, README, repository guidance, and a new OpenSpec delta, then protect
the contract with a focused Node repository test that reads the published
documents directly.

**Tech Stack:** Markdown Skills and OpenSpec artifacts, Node.js built-in test
runner, repository validation scripts.

## Global Constraints

- `superpowers:requesting-code-review` is the only local code-review mechanism.
- Each completed batch of code changes permits at most one Superpowers review.
- CodeRabbit may produce at most one effective review per PR or change.
- Copilot may produce at most one review per PR or change.
- CodeRabbit App-to-CLI fallback, consent, and secret-scanning rules remain.
- `superpowers:receiving-code-review` handles findings and is not another
  review.
- Release-managed version fields must not change.

---

### Task 1: Specify and test the review-budget contract

**Files:**

- Create:
  `openspec/changes/use-superpowers-code-review/proposal.md`
- Create:
  `openspec/changes/use-superpowers-code-review/design.md`
- Create:
  `openspec/changes/use-superpowers-code-review/specs/jt-flow-review-orchestration/spec.md`
- Create:
  `openspec/changes/use-superpowers-code-review/tasks.md`
- Create: `scripts/jt-flow-review-policy.test.mjs`

**Interfaces:**

- Consumes: The approved design in
  `docs/superpowers/specs/2026-07-25-jt-flow-review-orchestration-design.md`.
- Produces: A strict OpenSpec contract and repository test for current JT Flow
  review documentation.

- [x] **Step 1: Create the OpenSpec artifacts**

Write a proposal that identifies the unavailable `/code-review` dependency,
the portable Superpowers replacement, and the external review iteration cost.
The design must define a changed-code batch as code changes made after the most
recent local review. The delta spec must require:

```markdown
### Requirement: Local review is portable and change-batch scoped

The `jt-flow-one` Skill SHALL use
`superpowers:requesting-code-review` as its local code reviewer and MUST NOT
depend on `/code-review`. A completed batch of code changes SHALL permit at
most one local review. Accepted findings that change code create a new batch
that MAY receive one new local review.

### Requirement: External reviewers have one effective review budget

CodeRabbit SHALL produce at most one effective review, across its GitHub App
and CLI channels combined, for a PR or change. Copilot SHALL produce at most
one review for a PR or change. Fixes and later pushes MUST NOT restart either
external reviewer.
```

Record corresponding scenarios and implementation tasks for Skill,
documentation, tests, strict validation, and native plugin validation.

- [x] **Step 2: Validate the OpenSpec change**

Run:

```bash
openspec validate use-superpowers-code-review --strict
```

Expected: `use-superpowers-code-review` is valid.

- [x] **Step 3: Write the failing repository policy test**

Create `scripts/jt-flow-review-policy.test.mjs`:

```javascript
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const skill = readFileSync(
  "plugins/jt-flow/skills/jt-flow-one/SKILL.md",
  "utf8",
);
const readme = readFileSync("plugins/jt-flow/README.md", "utf8");
const guidance = readFileSync("CLAUDE.md", "utf8");
const currentPolicy = `${skill}\n${readme}\n${guidance}`;

test("uses portable Superpowers review without slash command dependency", () => {
  assert.doesNotMatch(currentPolicy, /`\\/code-review`/);
  assert.match(skill, /superpowers:requesting-code-review/);
  assert.match(skill, /每批程式碼變更.*最多.*一次.*Superpowers review/s);
});

test("allows a new local review only after another code change batch", () => {
  assert.match(
    skill,
    /finding.*變更程式碼.*新一批.*再次.*一次.*Superpowers review/s,
  );
  assert.match(skill, /沒有程式碼變更.*不得重跑/s);
});

test("limits each external reviewer to one effective review", () => {
  assert.match(
    currentPolicy,
    /CodeRabbit.*GitHub App.*CLI.*合計.*最多一次有效 review/s,
  );
  assert.match(currentPolicy, /Copilot.*每個 PR.*最多一次 review/s);
  assert.match(currentPolicy, /修正.*push.*不得.*重新.*外部 review/s);
});
```

- [x] **Step 4: Run the focused test and verify RED**

Run:

```bash
node --test scripts/jt-flow-review-policy.test.mjs
```

Expected: FAIL because current JT Flow documents still contain
`` `/code-review` `` and do not encode the new review budgets.

- [x] **Step 5: Commit the specification and RED test**

```bash
git add openspec/changes/use-superpowers-code-review \
  scripts/jt-flow-review-policy.test.mjs
git commit -m "chore(jt-flow): define review orchestration policy"
```

### Task 2: Implement the portable bounded review workflow

**Files:**

- Modify: `plugins/jt-flow/skills/jt-flow-one/SKILL.md`
- Modify: `plugins/jt-flow/README.md`
- Modify: `CLAUDE.md`
- Modify:
  `openspec/changes/use-superpowers-code-review/tasks.md`

**Interfaces:**

- Consumes: The assertions in `scripts/jt-flow-review-policy.test.mjs`.
- Produces: Published JT Flow behavior that is portable across Claude Code and
  Codex.

- [x] **Step 1: Replace the local review sequence in `jt-flow-one`**

Remove every `` `/code-review` `` reference. State that
`superpowers:requesting-code-review` runs once for the completed code batch,
then `superpowers:receiving-code-review` verifies each finding. If accepted
findings change code, that creates a new batch eligible for one new local
review. Without intervening code changes, local review must not repeat.

- [x] **Step 2: Bound CodeRabbit across both channels**

Preserve App-to-CLI fallback, but define one effective review budget shared by
the App and CLI. If the App produces a real review, never call the CLI. If the
App cannot produce one, call the CLI at most once. After either channel
produces a real review, fixes and later pushes do not trigger another
CodeRabbit review.

- [x] **Step 3: Bound Copilot**

State that each PR or change may receive at most one Copilot review. Once it
arrives, fixes and later pushes must not request or wait for another. Preserve
the existing quota-exhaustion exception.

- [x] **Step 4: Synchronize README and repository guidance**

Apply the same local changed-batch rule and external one-effective-review
budgets to `plugins/jt-flow/README.md` and `CLAUDE.md`. Keep the text concise
and preserve all disclosure and safety boundaries.

- [x] **Step 5: Run the focused test and verify GREEN**

Run:

```bash
node --test scripts/jt-flow-review-policy.test.mjs
```

Expected: 3 tests pass.

- [x] **Step 6: Mark implemented OpenSpec tasks**

Mark the Skill, documentation, and focused-test tasks complete. Leave final
aggregate validation unchecked until Task 3 succeeds.

- [x] **Step 7: Commit the implementation**

```bash
git add CLAUDE.md plugins/jt-flow/README.md \
  plugins/jt-flow/skills/jt-flow-one/SKILL.md \
  openspec/changes/use-superpowers-code-review/tasks.md
git commit -m "fix(jt-flow): use bounded Superpowers reviews"
```

### Task 3: Verify the complete change

**Files:**

- Modify:
  `openspec/changes/use-superpowers-code-review/tasks.md`
- Create:
  `openspec/changes/use-superpowers-code-review/verification-logs/implementation-verification.md`

**Interfaces:**

- Consumes: Completed review-policy implementation.
- Produces: Recorded evidence that the change is valid and publishable.

- [x] **Step 1: Run repository validation**

Run:

```bash
npm ci
npm run validate
```

Expected: all Node tests, repository checks, version synchronization, and
Markdown lint pass.

- [x] **Step 2: Run native plugin validation**

Run:

```bash
claude plugin validate .
```

Expected: marketplace validation passes.

- [x] **Step 3: Run strict OpenSpec validation**

Run:

```bash
openspec validate use-superpowers-code-review --strict
```

Expected: `use-superpowers-code-review` is valid.

- [x] **Step 4: Verify the retired dependency is absent**

Run:

```bash
rg -n '/code-review' CLAUDE.md plugins/jt-flow
```

Expected: exit status 1 with no matches.

- [x] **Step 5: Record verification and complete tasks**

Write the exact commands and observed pass results to
`implementation-verification.md`, then mark the remaining validation tasks
complete.

- [x] **Step 6: Commit verification evidence**

```bash
git add openspec/changes/use-superpowers-code-review
git commit -m "docs(openspec): verify jt-flow review orchestration"
```
