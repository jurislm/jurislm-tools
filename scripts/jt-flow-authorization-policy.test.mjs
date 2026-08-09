import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import test from "node:test";

const oneSkill = readFileSync(
  "plugins/jt-flow/skills/jt-flow-one/SKILL.md",
  "utf8",
);
const allSkill = readFileSync(
  "plugins/jt-flow/skills/jt-flow-all/SKILL.md",
  "utf8",
);
const readme = readFileSync("plugins/jt-flow/README.md", "utf8");
const guidance = readFileSync("CLAUDE.md", "utf8");
const livingQueueSpec = readFileSync(
  "openspec/specs/jt-flow-queue-delegation/spec.md",
  "utf8",
);
const livingTeamModeSpec = readFileSync(
  "openspec/specs/jt-flow-one-team-mode-dispatch/spec.md",
  "utf8",
);
const activeQueueDeltaPath =
  "openspec/changes/make-jt-flow-all-dependency-aware/specs/jt-flow-queue-delegation/spec.md";
const activeQueueDelta = existsSync(activeQueueDeltaPath)
  ? readFileSync(activeQueueDeltaPath, "utf8")
  : null;
const canonicalChangeName = "make-openspec-canonical";
const canonicalActiveChangeRoot = `openspec/changes/${canonicalChangeName}`;
const canonicalChangeRoot = (() => {
  if (existsSync(canonicalActiveChangeRoot)) {
    return canonicalActiveChangeRoot;
  }

  const archiveRoot = "openspec/changes/archive";
  if (!existsSync(archiveRoot)) {
    return null;
  }

  const archivedChange = readdirSync(archiveRoot)
    .filter((entry) => entry.endsWith(`-${canonicalChangeName}`))
    .sort()
    .at(-1);
  return archivedChange ? `${archiveRoot}/${archivedChange}` : null;
})();
const readCanonicalArtifact = (relativePath) => {
  if (!canonicalChangeRoot) {
    return null;
  }

  const artifactPath = `${canonicalChangeRoot}/${relativePath}`;
  return existsSync(artifactPath) ? readFileSync(artifactPath, "utf8") : null;
};
const canonicalQueueDelta = readCanonicalArtifact(
  "specs/jt-flow-queue-delegation/spec.md",
);
const canonicalTeamModeDelta = readCanonicalArtifact(
  "specs/jt-flow-one-team-mode-dispatch/spec.md",
);
const canonicalProposal = readCanonicalArtifact("proposal.md");
const canonicalDesign = readCanonicalArtifact("design.md");
const canonicalTasks = readCanonicalArtifact("tasks.md");

const rawSectionContaining = (document, heading) => {
  const section = document
    .split(/(?=^## )/m)
    .find((candidate) => candidate.startsWith(`## ${heading}`));
  assert.ok(section, `missing policy section: ${heading}`);
  return section;
};
const normalize = (document) => document.replace(/\s+/g, " ").trim();
const sectionContaining = (document, heading) => {
  return normalize(rawSectionContaining(document, heading));
};
const rawRequirement = (document, requirementName) => {
  const matches = document
    .split(/(?=^### Requirement: )/m)
    .filter((candidate) =>
      candidate.startsWith(`### Requirement: ${requirementName}\n`),
    );
  assert.equal(
    matches.length,
    1,
    `expected one requirement: ${requirementName}`,
  );
  return matches[0];
};
const assertOrdered = (document, expectations) => {
  let priorIndex = -1;
  for (const [label, pattern] of expectations) {
    const match = pattern.exec(document);
    assert.ok(match, `missing ordered policy marker: ${label}`);
    assert.ok(
      match.index > priorIndex,
      `policy marker out of order: ${label}`,
    );
    priorIndex = match.index;
  }
};

test("explicit invocation authorizes proposal preparation without implementation", () => {
  const contract = sectionContaining(oneSkill, "端到端授權契約");

  assert.match(contract, /明確.*呼叫.*OpenSpec.*不需.*確認/i);
  assert.doesNotMatch(contract, /tracking issue/i);
  assert.match(contract, /proposal GO.*之前.*不得.*實作/i);
});

test("proposal GO authorizes the complete normal delivery chain", () => {
  const contract = sectionContaining(oneSkill, "端到端授權契約");
  const flow = sectionContaining(oneSkill, "流程");
  const normalizedSkill = normalize(oneSkill);

  assert.match(
    contract,
    /實作.*commit.*push.*PR.*review.*merge.*部署驗收.*(?:OpenSpec|歸檔)/i,
  );
  assert.match(contract, /不再.*授權|不得.*重複.*確認/);
  assert.doesNotMatch(
    oneSkill,
    /是否需要當回合再次徵求合併授權，依專案既有授權規則判斷/,
  );
  assert.match(
    flow,
    /proposal GO 已包含 merge 授權.*直接合併.*不得再次詢問/s,
  );
  assert.doesNotMatch(
    normalizedSkill,
    /merge 前.{0,160}(?:專案|project|repository).{0,160}(?:規則|policy).{0,160}(?:詢問|確認|授權|approval)/i,
  );
  assert.doesNotMatch(
    normalizedSkill,
    /merge 前(?:仍|必須|需要|應).{0,160}(?:再次|重新).{0,160}(?:授權|approval|確認)/i,
  );
  assert.doesNotMatch(
    normalizedSkill,
    /merge.{0,160}(?:依|視).{0,160}(?:專案|project|repository).{0,160}(?:規則|policy).{0,160}(?:授權|approval|確認)/i,
  );
});

test("post-GO pauses are limited to observable safety exceptions", () => {
  const exceptions = sectionContaining(oneSkill, "端到端授權契約");
  const rawExceptions = rawSectionContaining(oneSkill, "端到端授權契約");
  const boundedList = rawExceptions
    .split("proposal GO 後唯一允許暫停並要求使用者 input／approval 的情況是：")[1]
    .split("同一核准範圍內")[0];
  const bullets = boundedList.match(/^- /gm) ?? [];

  assert.equal(bullets.length, 6);
  assert.match(exceptions, /歧義/);
  assert.match(exceptions, /重大.*範圍|material.*scope/i);
  assert.match(exceptions, /重大.*架構變更/);
  assert.doesNotMatch(exceptions, /架構替換/);
  assert.match(exceptions, /secret|敏感/i);
  assert.match(exceptions, /權限|permission/i);
  assert.match(exceptions, /不可逆|破壞性/);
  assert.match(exceptions, /rollback|回退/i);
  assert.match(
    exceptions,
    /實作細節.*測試修正.*review.*push.*PR.*merge.*部署.*歸檔.*不得.*暫停/s,
  );
});

test("a single unclear proposal is treated as genuine ambiguity", () => {
  const flow = sectionContaining(oneSkill, "流程");

  assert.match(
    flow,
    /只命中 1 個 active 提案.*無法明確證實.*真實歧義.*請使用者/s,
  );
});

test("intent-routed CodeRabbit consent is completed at proposal GO", () => {
  const contract = sectionContaining(oneSkill, "端到端授權契約");
  const consent = sectionContaining(oneSkill, "CodeRabbit 審查預先授權");

  assert.match(
    contract,
    /一般意圖.*CodeRabbit.*disclosure.*proposal.*GO.*之前|proposal.*GO.*同一次.*consent/is,
  );
  assert.match(consent, /proposal.*摘要.*揭露.*GO.*consent/is);
  assert.doesNotMatch(
    consent,
    /第一次外部傳送前須.*(?:取得|獲得).*(?:確認|consent)/is,
  );
});

test("delegated items reuse recorded proposal GO", () => {
  const queuePolicy = sectionContaining(
    allSkill,
    "Phase 2 — dependency-aware coordinator dispatch and bounded item ownership",
  );
  const executionContract = normalize(oneSkill);

  assert.match(queuePolicy, /已記錄的明確 proposal GO.*沿用.*不得.*重複/s);
  assert.match(
    queuePolicy,
    /change identifier.*proposal 路徑.*<owner>\/<repo>.*核准範圍.*目前 item/s,
  );
  assert.match(
    queuePolicy,
    /proposal 路徑.*已核准範圍.*proposal GO.*evidence/s,
  );
  assert.match(
    executionContract,
    /verification-logs\/proposal-go\.md.*change identifier.*proposal 路徑.*<owner>\/<repo>.*核准範圍/s,
  );
  assert.match(queuePolicy, /不得.*重複.*GO/);
  assert.match(queuePolicy, /bounded|例外/i);
});

test("delegated item keeps a mismatched GO local and requires an exact current integration permit", () => {
  const rawExecutionContract = rawSectionContaining(
    oneSkill,
    "Queue execution contract",
  );
  const executionContract = normalize(rawExecutionContract);

  assert.match(
    executionContract,
    /change identifier.*proposal 路徑.*<owner>\/<repo>.*已核准範圍/is,
  );
  assert.match(executionContract, /proposal GO.*目前 item.*相符/is);
  assert.match(executionContract, /任一欄不符.*`AWAITING_GO`/is);
  assert.match(executionContract, /unrelated `READY`.*continue/i);
  assertOrdered(rawExecutionContract, [
    ["exact GO identity comparison", /compare durable proposal GO/i],
    ["item-local AWAITING_GO before mutation", /AWAITING_GO[^A-Za-z]+before any\s+delegated fetch or feature-worktree mutation/i],
    ["READY transition", /only after that comparison makes the item `READY`/i],
    ["fetch remote main", /fetch remote main/i],
    ["record remote-main SHA", /resolve and record\s+the exact remote-main SHA\/ref/i],
    ["create isolated worktree", /create (?:and own )?(?:its|the) isolated feature\s+worktree/i],
  ]);
  assert.match(executionContract, /`INTEGRATION_READY`/);
  assert.match(
    executionContract,
    /integration permit.*exact.*repository.*change identifier.*item HEAD SHA.*refreshed.*main SHA/is,
  );
  assert.match(
    executionContract,
    /contains.*main SHA.*or rebase.*rerun.*required checks.*current mergeability/is,
  );
  assert.match(executionContract, /item HEAD.*main SHA.*(?:changes|drifts).*fresh permit/is);
  assert.match(executionContract, /SHA 漂移.*不需要.*新的 proposal GO/is);
});

test("CodeRabbit queue consent successor is exact and consistent across delivery surfaces", () => {
  const requirementName = "Queue delegation preserves CodeRabbit consent";
  const livingConsent = normalize(rawRequirement(livingQueueSpec, requirementName));
  const allConsent = sectionContaining(allSkill, "CodeRabbit authorization handoff");
  const oneConsent = sectionContaining(oneSkill, "Queue execution contract");
  const readmeConsent = sectionContaining(readme, "Dependencies");

  if (activeQueueDelta !== null) {
    const deltaConsent = normalize(
      rawRequirement(activeQueueDelta, requirementName),
    );
    assert.match(livingConsent, /authorizationSource=explicit-jt-flow-all/);
    assert.doesNotMatch(
      livingConsent,
      /authorizationSource=explicit-coderabbit-consent/,
    );
    assert.match(deltaConsent, /invoking or routing to `jt-flow-all`.*not itself prove CodeRabbit consent/i);
    assert.match(deltaConsent, /authorizationSource=explicit-coderabbit-consent/);
    assert.doesNotMatch(deltaConsent, /authorizationSource=explicit-jt-flow-all/);
  } else {
    assert.match(livingConsent, /authorizationSource=explicit-coderabbit-consent/);
    assert.doesNotMatch(livingConsent, /authorizationSource=explicit-jt-flow-all/);
  }

  for (const policy of [allConsent, oneConsent, readmeConsent]) {
    assert.match(policy, /(?:invok|呼叫|點名)[\s\S]{0,180}(?:does not|不構成|不代表)[\s\S]{0,100}(?:consent|授權)/i);
    assert.match(policy, /durable[\s\S]{0,220}(?:saw|看過)[\s\S]{0,160}(?:explicit|明確)[\s\S]{0,80}(?:consent|接受|同意)/i);
    assert.match(policy, /codeRabbitAuthorization=preauthorized[\s\S]{0,180}authorizationSource=explicit-coderabbit-consent/i);
    assert.match(policy, /codeRabbitAuthorization=requires-disclosure/);
  }
});

test("published guidance describes one normal checkpoint", () => {
  const normalizedReadme = normalize(readme);
  const normalizedGuidance = normalize(guidance);

  assert.match(
    normalizedReadme,
    /proposal GO.*唯一.*正常.*停頓|唯一.*正常.*proposal GO/s,
  );
  assert.match(
    normalizedGuidance,
    /proposal GO.*sole normal-path checkpoint|sole normal-path checkpoint.*proposal GO/is,
  );
  for (const policy of [normalizedReadme, normalizedGuidance]) {
    assert.doesNotMatch(
      policy,
      /merge 前.*(?:再次|重新).*(?:授權|approval|確認)/i,
    );
    assert.doesNotMatch(
      policy,
      /proposal GO 後.*CodeRabbit.*(?:consent|確認).*(?:第二|再次|另一)/i,
    );
  }
});

test("jt-flow-one uses OpenSpec as the sole current planning record", () => {
  const normalizedSkill = normalize(oneSkill);
  const normalizedReadme = normalize(readme);
  const normalizedGuidance = normalize(guidance);

  assert.doesNotMatch(oneSkill, /superpowers:(?:brainstorming|writing-plans)/i);
  for (const policy of [normalizedSkill, normalizedReadme, normalizedGuidance]) {
    assert.match(
      policy,
      /OpenSpec.*(?:唯一|sole).*(?:需求|計畫|planning|交付)/i,
    );
    assert.match(
      policy,
      /(?:不另|不得|must not|do not).*(?:平行.*(?:規劃|planning)|parallel.*planning)/i,
    );
  }
});

test("OpenSpec-only delivery does not require a tracking issue", () => {
  const flow = sectionContaining(oneSkill, "流程");
  const contract = sectionContaining(oneSkill, "端到端授權契約");
  const executionContract = normalize(
    rawSectionContaining(oneSkill, "Queue execution contract"),
  );

  assert.match(flow, /需求.*OpenSpec.*proposal GO.*實作.*PR/s);
  assert.match(flow, /Issue.*(?:可選|選用|optional)/i);
  assert.doesNotMatch(flow, /建立／沿用追蹤 issue/);
  assert.doesNotMatch(contract, /tracking issue/i);
  assert.doesNotMatch(executionContract, /issue identifier/i);
});

test("OpenSpec-only queue delta replaces the tracking-Issue prerequisite", () => {
  assert.ok(canonicalQueueDelta, "missing make-openspec-canonical queue delta");
  const modifiedSection = canonicalQueueDelta.split(/^## REMOVED Requirements/m)[0];

  assert.match(
    canonicalQueueDelta,
    /## REMOVED Requirements\s+### Requirement: Active changes have tracking issues before queueing\s+\*\*Reason\*\*:[\s\S]+?\*\*Migration\*\*:/,
  );
  assert.match(
    canonicalQueueDelta,
    /## ADDED Requirements\s+### Requirement: Active changes use OpenSpec delivery records before queueing/s,
  );
  assert.doesNotMatch(
    modifiedSection,
    /^### Requirement: Active changes have tracking issues before queueing/m,
  );
});

test("OpenSpec-only planning excludes the Superpowers plan pipeline", () => {
  assert.doesNotMatch(
    oneSkill,
    /superpowers:(?:using-superpowers|brainstorming|writing-plans)/i,
  );
  assert.match(
    guidance,
    /MUST NOT invoke[\s\S]*superpowers:using-superpowers[\s\S]*superpowers:brainstorming[\s\S]*superpowers:writing-plans/i,
  );
});

test("make-openspec-canonical declares complete delivery relations", () => {
  assert.ok(canonicalProposal, "missing make-openspec-canonical proposal");
  for (const field of [
    "Priority",
    "Hard dependencies",
    "Acceptance dependencies",
    "External blockers",
    "Affected areas",
    "Production targets",
  ]) {
    assert.match(canonicalProposal, new RegExp(`^- ${field}:`, "m"));
  }
  assert.match(
    canonicalProposal,
    /External blockers:[\s\S]*integration[\s\S]*convert-jt-flow-commands-to-skills/i,
  );
});

test("OpenSpec deltas replace retired queue and phase references", () => {
  assert.ok(canonicalQueueDelta, "missing make-openspec-canonical queue delta");
  assert.ok(canonicalTeamModeDelta, "missing make-openspec-canonical team-mode delta");
  assert.match(
    canonicalQueueDelta,
    /### Requirement: Single-request delivery workflow has one owner[\s\S]*OpenSpec\s+preparation/i,
  );
  assert.match(
    canonicalTeamModeDelta,
    /### Requirement: The Workflow-tool-mandated dispatch points are unaffected by team-mode detection[\s\S]*Phase 4 code-review dispatch/i,
  );
});

test("canonical archive gate verifies the team-mode Purpose migration", () => {
  assert.ok(canonicalDesign, "missing make-openspec-canonical design");
  assert.ok(canonicalTasks, "missing make-openspec-canonical tasks");
  assert.match(
    canonicalDesign,
    /manual.*Purpose.*Step 5.*Phase 4|Purpose.*Step 5.*Phase 4.*manual/is,
  );
  assert.match(
    canonicalTasks,
    /- \[ \] 4\.1[\s\S]*Purpose[\s\S]*Step 5[\s\S]*Phase 4[\s\S]*rg -n[\s\S]*openspec validate --all --strict/i,
  );

  if (!existsSync(canonicalActiveChangeRoot)) {
    assert.match(livingTeamModeSpec, /Phase 4 code-review dispatch/i);
    assert.doesNotMatch(livingTeamModeSpec, /Step 5 code-review dispatch/i);
  }
});
