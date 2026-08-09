import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const allSkill = readFileSync(
  "plugins/jt-flow/skills/jt-flow-all/SKILL.md",
  "utf8",
);
const sectionByHeading = (document, heading) => {
  const matches = document
    .split(/(?=^## )/m)
    .filter((candidate) => candidate.startsWith(`## ${heading}\n`));
  assert.equal(matches.length, 1, `expected one policy section: ${heading}`);
  return matches[0];
};

const parseTwoColumnDecisionTable = (section, firstHeader) => {
  const lines = section.split("\n");
  const headerIndex = lines.findIndex((line) =>
    line.startsWith(`| ${firstHeader} |`),
  );
  assert.notEqual(headerIndex, -1, `missing decision table: ${firstHeader}`);
  assert.match(lines[headerIndex + 1] ?? "", /^\| --- \| --- \|$/);

  const rows = [];
  for (const line of lines.slice(headerIndex + 2)) {
    if (!line.startsWith("| ")) break;
    const cells = line.split("|").slice(1, -1).map((cell) => cell.trim());
    assert.equal(cells.length, 2, `expected two decision cells: ${line}`);
    rows.push({ input: cells[0], expected: cells[1] });
  }
  return rows;
};

const stateCases = [
  {
    input: "Complete, consistent relations; exact proposal GO; every hard predecessor is `SUCCESS`",
    expectedState: "READY",
  },
  {
    input: "Proposal GO missing or mismatched to change, proposal path, repository, or approved scope",
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
    input: "Acceptance-only dependency cycle",
    expectedState: "BLOCKED",
  },
  {
    input: "Mixed hard/acceptance dependency cycle",
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

const fixedStateSection = sectionByHeading(allSkill, "Fixed state decisions");
const snapshotSection = sectionByHeading(
  allSkill,
  "Phase 1 — refreshed remote dependency snapshot",
);
const getDispatchSection = () =>
  sectionByHeading(
    allSkill,
    "Phase 2 — dependency-aware coordinator dispatch and bounded item ownership",
  );
const integrationSection = sectionByHeading(
  allSkill,
  "Phase 3 — one exact-SHA integration lane",
);
const scopeSection = sectionByHeading(allSkill, "Scope and non-goals");
const fixedStateTable = parseTwoColumnDecisionTable(
  fixedStateSection,
  "Fixed input",
);

test("dependency-aware queue contract records fixed state decisions without claiming a runtime scheduler", () => {
  assert.deepEqual(
    fixedStateTable.map(({ input }) => input),
    stateCases.map(({ input }) => input),
  );
  assert.deepEqual(
    fixedStateTable.map(({ expected }) => expected.match(/^`(\w+)`/)[1]),
    stateCases.map(({ expectedState }) => expectedState),
  );
  assert.match(fixedStateSection, /valid unresolved[\s\S]*`WAITING`|`WAITING`[\s\S]*valid unresolved/i);
  assert.match(fixedStateSection, /required relationship[\s\S]*`BLOCKED`|`BLOCKED`[\s\S]*delivery metadata/i);
  assert.match(fixedStateSection, /`deferred`[\s\S]*`PAUSED`|`PAUSED`[\s\S]*deferred/);
  assert.match(fixedStateSection, /assigned to an item owner[\s\S]*`ACTIVE`/);
  assert.match(fixedStateSection, /irrecoverable delivery failure[\s\S]*`FAILED`/);
  assert.match(fixedStateSection, /explicitly cancels an item[\s\S]*`CANCELLED`/);
  assert.match(scopeSection, /Markdown policy contract, not a runtime scheduler/);
});

test("production target metadata fails closed without confusing it with an unknown post-mutation target", () => {
  assert.match(fixedStateSection, /`Production targets` absent, `unknown`, or unverifiable[\s\S]*`BLOCKED`/);
  assert.match(fixedStateSection, /`Production targets` absent, `unknown`, or unverifiable[\s\S]*no integration permit may issue/);
  assert.match(fixedStateSection, /Explicit `Production targets: none` with otherwise complete valid relations[\s\S]*`READY`/);
  assert.match(integrationSection, /unknown (?:merge, pipeline, or production|downstream) state[\s\S]*integration lane\s+is `WAITING`/i);
});

test("queue inventory is built from a clean refreshed remote main snapshot", () => {
  assert.match(snapshotSection, /resolve.*GitHub remote|解析.*GitHub remote/i);
  assert.match(snapshotSection, /fetch.*prune|fetch.*--prune/i);
  assert.match(snapshotSection, /clean detached snapshot.*<remote>\/main|乾淨.*detached.*<remote>\/main/is);
  assert.match(snapshotSection, /never from a dirty or stale\s+caller worktree/);
  assert.match(snapshotSection, /all active\s+OpenSpec changes/);
});

test("queue derives execution units from OpenSpec without requiring Issue inventory", () => {
  const dispatchSection = getDispatchSection();

  assert.match(snapshotSection, /read all active\s+OpenSpec changes/);
  assert.doesNotMatch(snapshotSection, /paginate all open Issues/);
  assert.doesNotMatch(snapshotSection, /primary Issue|Issue mapping/);
  assert.doesNotMatch(dispatchSection, /Issue mapping|primary Issue/);
});

test("remote-main drift rebuilds the entire dependency snapshot before dispatch or permit", () => {
  assert.match(
    snapshotSection,
    /before (?:each|every) (?:subsequent )?dispatch or integration-permit decision[\s\S]*reread\s+remote main/is,
  );
  assert.match(
    snapshotSection,
    /SHA drift[\s\S]*invalidates the (?:whole )?dependency snapshot[\s\S]*clean snapshot[\s\S]*active changes[\s\S]*Delivery Relations[\s\S]*reverse edges[\s\S]*descendants[\s\S]*eligibility/is,
  );
  assert.match(snapshotSection, /reclassif(?:y|ies)[\s\S]*`ACTIVE`[\s\S]*`INTEGRATION_READY`/i);
});

test("proposal relations gate whole-change dispatch and derive descendant-only impact", () => {
  assert.match(snapshotSection, /Priority[\s\S]*Hard dependencies[\s\S]*Acceptance dependencies[\s\S]*External blockers[\s\S]*Affected areas[\s\S]*Production targets/);
  assert.doesNotMatch(snapshotSection, /Issue mapping|primary Issue/);
  assert.match(snapshotSection, /Each whole active\s+change is one execution unit/);
  assert.match(scopeSection, /dispatch only a subset of a change's tasks/);
  assert.match(fixedStateSection, /Hard dependencies prevent dispatch[\s\S]*`SUCCESS`/);
  assert.match(fixedStateSection, /Acceptance dependencies permit work through[\s\S]*`INTEGRATION_READY`[\s\S]*integration permit/);
  assert.match(snapshotSection, /external\s+blocker[\s\S]*`dispatch`\s+or\s+`integration`\s+gate/);
  assert.match(snapshotSection, /Derive reverse\s+`Blocks` edges/);
  assert.match(snapshotSection, /affected descendants/);
});

test("waiting, blocking, pausing, failure, and cancellation isolate unrelated ready changes", () => {
  assert.match(fixedStateSection, /`AWAITING_GO`, `WAITING`, `BLOCKED`, `PAUSED`, `FAILED`, or `CANCELLED` affects[\s\S]*item and its dependency descendants/);
  assert.match(fixedStateSection, /dispatch unrelated `READY` changes/);
  assert.match(fixedStateSection, /`PAUSED`; it consumes no item-owner capacity/);
  assert.match(snapshotSection, /acceptance-only and mixed hard\/acceptance cycles[\s\S]*block cycle members and their descendants/i);
  assert.match(snapshotSection, /unrelated Issues remain outside the execution graph|unrelated `READY` changes/);
});

test("coordinator reserves one slot and hands each ready item to jt-flow-one", () => {
  const dispatchSection = getDispatchSection();
  assert.match(dispatchSection, /primary agent is the coordinator and reserves one available agent slot/);
  assert.match(dispatchSection, /Each remaining available slot may own one `READY` change/);
  assert.match(dispatchSection, /clean main checkout/);
  assert.match(dispatchSection, /`jt-flow-one` to create and own the item's\s+isolated feature worktree/);
  assert.match(dispatchSection, /change identifier,\s+proposal[\s\S]*target repository, approved scope,\s+durable[\s\S]*proposal GO evidence, dependency snapshot revision, integration policy,\s+and CodeRabbit authorization context/);
  assert.match(dispatchSection, /primary agent performs coordinator dispatch, not each item's delivery/);
});

test("integration permit decision rows fail closed on every stale or incomplete fixture", () => {
  const permitDecisions = parseTwoColumnDecisionTable(
    integrationSection,
    "Permit evidence fixture",
  );
  assert.deepEqual(permitDecisions, [
    {
      input: "Exact current repository, change, item HEAD, refreshed main, required-check set and terminal-success results, mergeable result, and fresh readback time",
      expected: "`GRANT`",
    },
    {
      input: "Current required-check set differs from the recorded set",
      expected: "`WITHHOLD_OR_INVALIDATE`",
    },
    {
      input: "Any required check is pending, failed, unknown, non-terminal, missing, or bound to another item HEAD",
      expected: "`WITHHOLD_OR_INVALIDATE`",
    },
    {
      input: "Item HEAD differs from permit evidence",
      expected: "`INVALIDATE`",
    },
    {
      input: "Remote-main SHA differs from permit or dependency snapshot",
      expected: "`INVALIDATE_AND_REBUILD`",
    },
    {
      input: "Mergeability is unknown or non-mergeable",
      expected: "`WITHHOLD_OR_INVALIDATE`",
    },
    {
      input: "Permit evidence readback time is missing or stale",
      expected: "`WITHHOLD_OR_INVALIDATE`",
    },
  ]);
  assert.match(
    integrationSection,
    /reread every bound field at permit grant and again immediately before merge or\s+any production mutation/is,
  );
});

test("integration lane decision rows require no merge, mutation, or downstream pipeline before revocation", () => {
  const laneDecisions = parseTwoColumnDecisionTable(
    integrationSection,
    "Lane evidence fixture",
  );
  assert.deepEqual(laneDecisions, [
    {
      input: "No merge, no production mutation, and no derived downstream pipeline began",
      expected: "`REVOKE`",
    },
    { input: "A merge occurred", expected: "`HOLD`" },
    { input: "A production mutation occurred", expected: "`HOLD`" },
    { input: "A derived downstream pipeline began", expected: "`HOLD`" },
    {
      input: "All downstream CI and deployment are verified healthy",
      expected: "`RELEASE_AFTER_VERIFICATION`",
    },
    {
      input: "The system is restored to a known rollback state",
      expected: "`RELEASE_AFTER_ROLLBACK`",
    },
  ]);
  assert.match(integrationSection, /unrelated.*development.*tests.*continue/is);
});
