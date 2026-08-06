## 1. Delta spec (living spec stays at deployed behavior until archive)

- [x] 1.1 Confirm the delta spec at
      `openspec/changes/cap-jt-flow-review-budgets/specs/jt-flow-review-orchestration/spec.md`
      states the "Local review is portable and change-batch scoped"
      requirement with the 3-run ceiling (initial run + at most 2 fix-driven
      reruns, no 4th run) and the "Run limit reached with new findings still
      present" scenario. Do NOT edit
      `openspec/specs/jt-flow-review-orchestration/spec.md` (the living spec)
      during this change's implementation — per this repo's CLAUDE.md, it
      stays at deployed behavior until this change is archived
      (`opsx:archive`/`opsx:sync` applies the delta then).
- [x] 1.2 Confirm the same delta spec states the "External reviewers have one
      effective review budget" requirement extended to include Codex
      (one-review budget contingent on the account-level 審查觸發條件
      precondition, no active trigger, no CodeRabbit-style authorization
      gate) with the two new Codex scenarios. Same constraint: the living
      spec is not touched now.

## 2. `plugins/jt-flow/skills/jt-flow-one/SKILL.md`

- [x] 2.1 Replace the local-review batch paragraph (the one starting "每批
      程式碼變更最多進行一次 Superpowers review") with the 3-run-ceiling
      wording.
- [x] 2.2 Update the Queue execution contract's "既有的每個 code batch 一次
      Superpowers review" phrase to reflect the 3-run ceiling instead of
      unlimited batches.
- [x] 2.3 Add a new Codex paragraph next to the existing Copilot paragraph in
      the PR/review step (step 5): one-review budget, the 審查觸發條件 = 開啟
      PR precondition (manual, not repository-verifiable), no active
      `@codex review` trigger, and standard `receiving-code-review` handling
      of whatever Codex posts, including an unexpected extra review.
- [x] 2.4 Confirm the CodeRabbit pre-authorization section is left unchanged
      and does not reference Codex.

## 3. `plugins/jt-flow/README.md`

- [x] 3.1 Mirror the 3-run local-review ceiling wording from task 2.1.
- [x] 3.2 Mirror the new Codex paragraph from task 2.3 next to the existing
      Copilot description.

## 4. `CLAUDE.md` (repository root)

- [x] 4.1 Mirror the 3-run local-review ceiling wording in the review
      checklist / policy guidance section that currently states "an accepted
      finding that changes code creates a new batch eligible for one more
      review".
- [x] 4.2 Mirror the new Codex paragraph next to the existing Copilot
      guidance ("Copilot permits at most one review per PR or change...").

## 5. Tests

- [x] 5.1 In `scripts/jt-flow-review-policy.test.mjs`, replace the batch-based
      assertions (the test titled "allows a new local review only after
      another code change batch") with assertions for the 3-run ceiling
      across `SKILL.md`, `README.md`, and `CLAUDE.md`.
- [x] 5.2 Add assertions in the same file that `SKILL.md`, `README.md`, and
      `CLAUDE.md` each state Codex's one-review budget, the 審查觸發條件
      precondition, no active trigger, and no CodeRabbit-style authorization
      gate — parallel in structure to the existing Copilot assertions.
- [x] 5.3 Run `npm test` and confirm all `scripts/*.test.mjs` files pass,
      including the updated `jt-flow-review-policy.test.mjs`.

## 6. Verification

- [x] 6.1 Run `npm run validate` and confirm it passes (marketplace checks,
      Release Please version sync, markdown lint, and the Node test suite).
- [x] 6.2 Run `openspec validate --strict` and confirm this change passes.
- [x] 6.3 Manually re-read the four updated documents
      (`plugins/jt-flow/skills/jt-flow-one/SKILL.md`,
      `plugins/jt-flow/README.md`, `CLAUDE.md`, and the delta spec at
      `openspec/changes/cap-jt-flow-review-budgets/specs/jt-flow-review-orchestration/spec.md`)
      side by side to confirm the local 3-run cap and the Codex paragraph are
      worded consistently across all four, since this is a documentation-only
      change with no executable code path to exercise. Confirm
      `openspec/specs/jt-flow-review-orchestration/spec.md` (the living spec)
      is unchanged from `origin/main`.
