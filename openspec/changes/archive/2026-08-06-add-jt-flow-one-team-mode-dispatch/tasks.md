## 1. Test file (write first, red)

- [x] 1.1 Create `scripts/jt-flow-team-mode-dispatch.test.mjs`, following the
  structure of `scripts/jt-flow-review-policy.test.mjs`: read
  `plugins/jt-flow/skills/jt-flow-one/SKILL.md` and assert that it contains
  (a) the nested-check-before-capability-check detection order, (b) the dual
  `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` + `SendMessage`/`TaskCreate`/`TaskList`
  condition, (c) the "wrap in one named agent with `Workflow` tool access,
  don't replace" wording naming both the three-tool research trio and the
  Step 5 code-review dispatch, and (d) the unavailable-path wording stating
  both call `Workflow` directly, unchanged. Run it and confirm it fails,
  since none of this wording exists in SKILL.md yet.

## 2. SKILL.md changes (green)

- [x] 2.1 Add one new `## 團隊模式（Agent Teams）偵測與派工` section to
  `plugins/jt-flow/skills/jt-flow-one/SKILL.md`, placed near "前置環境檢查",
  covering: nested-check-first (checking for `jt-flow-all`'s Queue execution
  contract delegated fields), the dual env-var + tool-schema condition,
  "determine once at the start of the run, reuse for every later dispatch
  point without re-checking", and the wrap-don't-replace rule naming both
  existing call sites by name — the three-tool research trio (Context7/Exa/
  Firecrawl) and the Step 5 code-review dispatch — plus the explicit
  unavailable-path statement that both call `Workflow` directly, unchanged.
  Do not edit the three-tool research paragraph or the Step 5 code-review
  paragraph themselves; this section is additive and governs them by
  reference, avoiding changes to either paragraph's existing wording.
- [x] 2.2 Run `scripts/jt-flow-team-mode-dispatch.test.mjs` again and confirm
  it now passes.

## 3. Mirror documentation

- [x] 3.1 Mirror a short paragraph describing the detection rule and the two
  branches in `plugins/jt-flow/README.md`, matching the existing mirroring
  convention used for other `jt-flow-one` policy sections.
- [x] 3.2 Mirror the same short paragraph in the root `CLAUDE.md`'s
  OpenSpec/jt-flow section.

## 4. Validation

- [x] 4.0 Confirm the active Node.js version satisfies
  `^22.22.2 || ^24.15.0 || >=26.0.0` before installing dependencies, per
  this repository's `CLAUDE.md` "Required validation" section.
- [x] 4.1 Run `npm test` and confirm the new test plus all existing tests
  pass.
- [x] 4.2 Run `npm run validate` and confirm it is fully green.
- [x] 4.3 Run `openspec validate add-jt-flow-one-team-mode-dispatch --strict`
  and confirm it passes.
- [x] 4.4 Read the four updated/created files together (SKILL.md, README.md,
  CLAUDE.md, `specs/jt-flow-one-team-mode-dispatch/spec.md`) and confirm the
  wording is consistent and non-contradictory.
- [x] 4.5 Run `claude plugin validate .` and confirm it passes, per this
  repository's own review checklist.

## 5. Post-merge correction (found via PR #194's second CodeRabbit CLI round)

- [x] 5.1 Verify empirically whether a spawned agent can call the `Workflow`
  tool: dispatch a probe agent, have it check its own tool list (top-level
  and `ToolSearch`-deferred) for `Workflow`. Confirmed: not present in
  either list — spawned agents cannot call `Workflow`.
- [x] 5.2 Rewrite `scripts/jt-flow-team-mode-dispatch.test.mjs`'s wrapper-
  related assertions to instead assert both dispatch points always call
  `Workflow` directly regardless of team-mode outcome, plus the rationale
  wording. Run red (fails against the still-wrapper-based `SKILL.md`).
- [x] 5.3 Remove the wrapper-agent instruction from `SKILL.md`'s `## 團隊
  模式` section; replace with "no behavior change, here's why" wording.
  Mirror the same correction in `README.md` and root `CLAUDE.md`. Run green.
- [x] 5.4 Sync the correction into `openspec/specs/jt-flow-one-team-mode-
  dispatch/spec.md` (the living spec) and this change's own archived
  `proposal.md`/`design.md`/`specs/.../spec.md`, so the archived record
  doesn't describe a mechanism that never actually took effect.
- [x] 5.5 Run `npm test`, `npm run validate`, `openspec validate --all
  --strict` and confirm all green after the correction.
