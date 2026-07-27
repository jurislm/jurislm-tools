# Streamline JT Flow One Authorization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make proposal GO the only normal-path user checkpoint in
`jt-flow-one`, with bounded safety exceptions after GO.

**Architecture:** Add one positive authorization contract near the start of
`jt-flow-one` and make later lifecycle steps reference it instead of inventing
local approval decisions. Keep `jt-flow-all` as a queue-only coordinator that
recognizes recorded proposal approval and inherits the same exception contract.
Protect the behavior with a focused repository policy test and pressure-scenario
evidence.

**Tech Stack:** Markdown Skills and OpenSpec artifacts, Node.js built-in test
runner, repository validation scripts.

## Global Constraints

- Preserve CodeRabbit disclosure, payload scanning, and one-effective-review
  budget.
- Preserve CI, mergeability, deployment, and archive verification.
- Do not edit release-managed version fields.
- Keep `jt-flow-all` free of duplicated single-request lifecycle procedures.
- Pause after proposal GO only for the six observable exception categories in
  the approved design.

---

### Task 1: Add the failing authorization policy test

**Files:**

- Create: `scripts/jt-flow-authorization-policy.test.mjs`

**Interfaces:**

- Consumes: published `jt-flow-one`, `jt-flow-all`, README, and repository
  guidance text.
- Produces: a focused validation contract used by `npm test`.

- [ ] **Step 1: Write the failing test**

  Read the four policy documents and assert that they state explicit invocation
  authorization, proposal-GO end-to-end authorization, the bounded exception
  list, no project-dependent merge approval, and queue reuse of recorded GO.

- [ ] **Step 2: Run test to verify it fails**

  Run:
  `node --test scripts/jt-flow-authorization-policy.test.mjs`

  Expected: FAIL because the current Skills do not contain the positive
  authorization contract and still defer merge approval to project rules.

- [ ] **Step 3: Record baseline pressure scenarios**

  Run fresh-context read-only scenarios for merge, review-fix continuation, and
  an already-approved queue item. Record the decisions and ambiguity exposed by
  the current Skill.

### Task 2: Implement the authorization contract

**Files:**

- Modify: `plugins/jt-flow/skills/jt-flow-one/SKILL.md`
- Modify: `plugins/jt-flow/skills/jt-flow-all/SKILL.md`
- Modify: `plugins/jt-flow/README.md`
- Modify: `CLAUDE.md`

**Interfaces:**

- Consumes: the approved OpenSpec authorization requirements.
- Produces: the runtime instructions followed by Claude Code and Codex.

- [ ] **Step 1: Add the minimal positive contract**

  State that explicit invocation authorizes issue and proposal preparation,
  proposal GO authorizes the full lifecycle, and normal actions after GO do not
  require another prompt.

- [ ] **Step 2: Centralize bounded exceptions**

  Define the six observable exception categories once and make later steps
  reference them. Narrow architecture resynchronization to material changes;
  keep same-scope implementation refinements autonomous.

- [ ] **Step 3: Remove ambiguous merge authorization**

  Replace project-dependent reauthorization language with automatic merge after
  existing verification gates pass.

- [ ] **Step 4: Align queue and documentation**

  Let delegated items reuse recorded explicit proposal GO, then continue under
  the same bounded exceptions. Synchronize README and repository guidance.

- [ ] **Step 5: Run focused test to verify it passes**

  Run:
  `node --test scripts/jt-flow-authorization-policy.test.mjs`

  Expected: PASS.

- [ ] **Step 6: Re-run pressure scenarios with the modified Skill**

  Expected: all normal-path scenarios continue without another user prompt,
  while material exceptions still pause.

### Task 3: Verify and deliver

**Files:**

- Modify:
  `openspec/changes/streamline-jt-flow-one-authorization/tasks.md`
- Create:
  `openspec/changes/streamline-jt-flow-one-authorization/verification-logs/implementation-verification.md`

**Interfaces:**

- Consumes: final Skill and test changes.
- Produces: reviewable evidence and completed OpenSpec tasks.

- [ ] **Step 1: Run focused and repository validation**

  Run:

  - `node --test scripts/jt-flow-authorization-policy.test.mjs`
  - `npm run validate`
  - `claude plugin validate .`
  - `openspec validate streamline-jt-flow-one-authorization --strict`

  Expected: all commands exit successfully.

- [ ] **Step 2: Review the final diff and record evidence**

  Check `git diff --check`, secret-sensitive paths, release-managed versions,
  and scope. Record exact command outcomes and pressure-scenario results.

- [ ] **Step 3: Commit**

  Commit implementation and evidence with a message referencing the behavioral
  change.

- [ ] **Step 4: Complete GitHub Flow**

  Push the branch, create a PR closing #170, complete bounded reviews, wait for
  CI and mergeability, merge, verify `main`, and archive the OpenSpec change.
