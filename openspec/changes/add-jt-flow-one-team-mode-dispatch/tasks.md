## 1. Test file (write first, red)

- [ ] 1.1 Create `scripts/jt-flow-team-mode-dispatch.test.mjs`, following the
  structure of `scripts/jt-flow-review-policy.test.mjs`: read
  `plugins/jt-flow/skills/jt-flow-one/SKILL.md` and assert that it contains
  (a) the nested-check-before-capability-check detection order, (b) the dual
  `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` + `SendMessage`/`TaskCreate`/`TaskList`
  condition, (c) the "wrap in one named agent with `Workflow` tool access,
  don't replace" wording for the Workflow-tool-mandated pattern, and (d) the
  unavailable-path wording stating dispatch is unchanged. Run it and confirm
  it fails, since none of this wording exists in SKILL.md yet.

## 2. SKILL.md changes (green)

- [ ] 2.1 Add a team-mode detection subsection to
  `plugins/jt-flow/skills/jt-flow-one/SKILL.md`, placed near "前置環境檢查",
  covering: nested-check-first (checking for `jt-flow-all`'s Queue execution
  contract delegated fields), the dual env-var + tool-schema condition, and
  "determine once at the start of the run, reuse for every later dispatch
  point without re-checking".
- [ ] 2.2 Update Step 0's three-tool research dispatch text (Context7/Exa/
  Firecrawl) to branch on the recorded detection outcome: named and
  addressable via `SendMessage` when available, anonymous when not.
- [ ] 2.3 Update the `systematic-debugging` escalation and the read-only
  Opus consult text (in the closed-loop / 求援順序 sections) to branch the
  same way, without changing the existing model-tier rules (sonnet default,
  Opus read-only exception).
- [ ] 2.4 Update Step 5's code-review dispatch text: when available, spawn
  one named wrapper agent with a tool allowlist that includes `Workflow`
  (e.g. `general-purpose`), and instruct it to carry out the review by
  calling the `Workflow` tool per the existing rule — explicitly prohibit
  replacing that call with several manually-spawned named agents. Leave the
  existing Workflow-tool-mandated wording for the unavailable path
  untouched.
- [ ] 2.5 Run `scripts/jt-flow-team-mode-dispatch.test.mjs` again and confirm
  it now passes.

## 3. Mirror documentation

- [ ] 3.1 Mirror a short paragraph describing the detection rule and the two
  branches in `plugins/jt-flow/README.md`, matching the existing mirroring
  convention used for other `jt-flow-one` policy sections.
- [ ] 3.2 Mirror the same short paragraph in the root `CLAUDE.md`'s
  OpenSpec/jt-flow section.

## 4. Validation

- [ ] 4.1 Run `npm test` and confirm the new test plus all existing tests
  pass.
- [ ] 4.2 Run `npm run validate` and confirm it is fully green.
- [ ] 4.3 Run `openspec validate add-jt-flow-one-team-mode-dispatch --strict`
  and confirm it passes.
- [ ] 4.4 Read the four updated/created files together (SKILL.md, README.md,
  CLAUDE.md, `specs/jt-flow-one-team-mode-dispatch/spec.md`) and confirm the
  wording is consistent and non-contradictory.
