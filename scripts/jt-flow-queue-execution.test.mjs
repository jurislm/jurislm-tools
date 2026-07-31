import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const allSkill = readFileSync(
  "plugins/jt-flow/skills/jt-flow-all/SKILL.md",
  "utf8",
);
const oneSkill = readFileSync(
  "plugins/jt-flow/skills/jt-flow-one/SKILL.md",
  "utf8",
);

const stateCases = [
  {
    input: "Complete, consistent relations; exact proposal GO; every hard predecessor is `SUCCESS`",
    expectedState: "READY",
  },
  {
    input: "Proposal GO missing or mismatched to change, proposal path, Issue, repository, or approved scope",
    expectedState: "AWAITING_GO",
  },
  {
    input: "A `READY` change is assigned to an item owner",
    expectedState: "ACTIVE",
  },
  {
    input: "Valid but unresolved hard dependency or dispatch-gated external blocker",
    expectedState: "WAITING",
  },
  {
    input: "Required relationship absent, contradictory, invalid, or cyclic",
    expectedState: "BLOCKED",
  },
  {
    input: "`Production targets` absent, `unknown`, or unverifiable",
    expectedState: "BLOCKED",
  },
  {
    input: "Explicit `Production targets: none` with otherwise complete valid relations",
    expectedState: "READY",
  },
  {
    input: "Explicitly `deferred` or postponed",
    expectedState: "PAUSED",
  },
  {
    input: "Implementation, required tests, `jt-flow-one` quality review, PR checks, review disposition, and current item HEAD readback complete",
    expectedState: "INTEGRATION_READY",
  },
  {
    input: "Acceptance dependencies satisfied and permitted integration, verification, and archive complete",
    expectedState: "SUCCESS",
  },
  {
    input: "The item owner reports an irrecoverable delivery failure",
    expectedState: "FAILED",
  },
  {
    input: "The user explicitly cancels an item",
    expectedState: "CANCELLED",
  },
];

const fixedStateTable = allSkill
  .split("## Fixed state decisions\n", 2)[1]
  .split("\n## Phase 2", 2)[0]
  .split("\n")
  .filter(
    (line) =>
      line.startsWith("| ") &&
      !line.startsWith("| Fixed input ") &&
      !line.startsWith("| ---"),
  )
  .map((line) => {
    const [, input, expected] = line.split("|");
    return { input: input.trim(), expected: expected.trim() };
  });

test("dependency-aware queue contract records fixed state decisions without claiming a runtime scheduler", () => {
  assert.deepEqual(
    fixedStateTable.map(({ input }) => input),
    stateCases.map(({ input }) => input),
  );
  assert.deepEqual(
    fixedStateTable.map(({ expected }) => expected.match(/^`(\w+)`/)[1]),
    stateCases.map(({ expectedState }) => expectedState),
  );
  assert.match(allSkill, /`AWAITING_GO`[\s\S]*`READY`[\s\S]*`ACTIVE`[\s\S]*`WAITING`[\s\S]*`BLOCKED`[\s\S]*`PAUSED`[\s\S]*`INTEGRATION_READY`[\s\S]*`SUCCESS`[\s\S]*`FAILED`[\s\S]*`CANCELLED`/);
  assert.match(allSkill, /valid unresolved[\s\S]*`WAITING`|`WAITING`[\s\S]*valid unresolved/i);
  assert.match(allSkill, /required relationship[\s\S]*`BLOCKED`|`BLOCKED`[\s\S]*delivery metadata/i);
  assert.match(allSkill, /`deferred`[\s\S]*`PAUSED`|`PAUSED`[\s\S]*deferred/);
  assert.match(allSkill, /assigned to an item owner[\s\S]*`ACTIVE`/);
  assert.match(allSkill, /irrecoverable delivery failure[\s\S]*`FAILED`/);
  assert.match(allSkill, /explicitly cancels an item[\s\S]*`CANCELLED`/);
  assert.match(allSkill, /Markdown policy contract, not a runtime scheduler/);
});

test("production target metadata fails closed without confusing it with an unknown post-mutation target", () => {
  assert.match(allSkill, /`Production targets` absent, `unknown`, or unverifiable[\s\S]*`BLOCKED`/);
  assert.match(allSkill, /`Production targets` absent, `unknown`, or unverifiable[\s\S]*no integration permit may issue/);
  assert.match(allSkill, /Explicit `Production targets: none` with otherwise complete valid relations[\s\S]*`READY`/);
  assert.match(allSkill, /After a production mutation begins[\s\S]*unknown production state[\s\S]*integration lane\s+is `WAITING`/);
});

test("queue inventory is built from a clean refreshed remote main snapshot", () => {
  assert.match(allSkill, /resolve.*GitHub remote|解析.*GitHub remote/i);
  assert.match(allSkill, /fetch.*prune|fetch.*--prune/i);
  assert.match(allSkill, /clean detached snapshot.*<remote>\/main|乾淨.*detached.*<remote>\/main/is);
  assert.match(allSkill, /never from a dirty or stale\s+caller worktree/);
  assert.match(allSkill, /paginate all open Issues/);
  assert.match(allSkill, /all active\s+OpenSpec changes/);
});

test("proposal relations gate whole-change dispatch and derive descendant-only impact", () => {
  assert.match(allSkill, /Priority[\s\S]*Hard dependencies[\s\S]*Acceptance dependencies[\s\S]*External blockers[\s\S]*Affected areas[\s\S]*Production targets/);
  assert.match(allSkill, /primary\/related Issue mapping/);
  assert.match(allSkill, /whole active change is one execution unit/);
  assert.match(allSkill, /dispatch only a subset of a change's tasks/);
  assert.match(allSkill, /Hard dependencies prevent dispatch[\s\S]*`SUCCESS`/);
  assert.match(allSkill, /Acceptance dependencies permit work through[\s\S]*`INTEGRATION_READY`[\s\S]*integration permit/);
  assert.match(allSkill, /external\s+blocker[\s\S]*`dispatch` or `integration` gate/);
  assert.match(allSkill, /Derive reverse\s+`Blocks` edges/);
  assert.match(allSkill, /affected descendants/);
});

test("waiting, blocking, pausing, failure, and cancellation isolate unrelated ready changes", () => {
  assert.match(allSkill, /`AWAITING_GO`, `WAITING`, `BLOCKED`, `PAUSED`, `FAILED`, or `CANCELLED` affects[\s\S]*item and its dependency descendants/);
  assert.match(allSkill, /dispatch unrelated `READY` changes/);
  assert.match(allSkill, /`PAUSED`; it consumes no item-owner capacity/);
  assert.match(allSkill, /cycles block cycle members and their descendants/);
  assert.match(allSkill, /unmapped Issues without creating work or\s+blocking unrelated items/);
});

test("coordinator reserves one slot and hands each ready item to jt-flow-one", () => {
  assert.match(allSkill, /primary agent is the coordinator and reserves one available agent slot/);
  assert.match(allSkill, /Each remaining available slot may own one `READY` change/);
  assert.match(allSkill, /clean main checkout/);
  assert.match(allSkill, /`jt-flow-one` creates and\s+owns the item's isolated feature worktree/);
  assert.match(allSkill, /change identifier,\s+proposal[\s\S]*Issue mapping, target repository, approved scope,\s+durable[\s\S]*proposal GO evidence, dependency snapshot revision, integration policy,\s+and CodeRabbit authorization context/);
  assert.match(allSkill, /primary agent performs coordinator dispatch, not each item's delivery/);
});

test("integration uses one exact-SHA lane and releases it safely after failure", () => {
  assert.match(allSkill, /at most one integration permit/);
  assert.match(allSkill, /repository, change identifier, item HEAD SHA, and verified main SHA/);
  assert.match(allSkill, /fetches remote main[\s\S]*rebases[\s\S]*reruns required checks[\s\S]*mergeability/);
  assert.match(allSkill, /changed item\s+HEAD invalidates the permit/);
  assert.match(allSkill, /changed main SHA[\s\S]*new permit/);
  assert.match(allSkill, /revoke the permit only after proving no production mutation\s+began/);
  assert.match(allSkill, /After a production mutation begins, an\s+unknown production state issues no new permit/);
  assert.match(allSkill, /unrelated.*development.*tests.*continue/is);
});

test("explicit queue invocation does not imply CodeRabbit consent", () => {
  assert.doesNotMatch(allSkill, /明確點名／呼叫本 Skill 即代表接受/);
  assert.match(
    allSkill,
    /CodeRabbit consent evidence[\s\S]*preauthorized[\s\S]*requires-disclosure/,
  );
  assert.match(oneSkill, /CodeRabbit/);
});
