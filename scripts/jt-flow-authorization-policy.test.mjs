import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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

test("explicit invocation authorizes proposal preparation without implementation", () => {
  const contract = sectionContaining(oneSkill, "端到端授權契約");

  assert.match(contract, /明確.*呼叫.*issue.*OpenSpec.*不需.*確認/i);
  assert.match(contract, /proposal GO.*之前.*不得.*實作/i);
});

test("proposal GO authorizes the complete normal delivery chain", () => {
  const contract = sectionContaining(oneSkill, "端到端授權契約");
  const flow = sectionContaining(oneSkill, "流程");
  const normalizedSkill = normalize(oneSkill);

  assert.match(
    contract,
    /實作.*commit.*push.*PR.*review.*merge.*部署驗收.*issue.*歸檔/i,
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
    /實作細節.*測試修正.*review.*push.*PR.*merge.*部署.*issue.*歸檔.*不得.*暫停/s,
  );
});

test("a single unclear issue or proposal is treated as genuine ambiguity", () => {
  const flow = sectionContaining(oneSkill, "流程");

  assert.match(
    flow,
    /只命中 1 筆.*無法明確證實.*真實歧義.*請使用者/s,
  );
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
  const queuePolicy = sectionContaining(allSkill, "Phase 2 — 由同一主代理逐項執行");
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
