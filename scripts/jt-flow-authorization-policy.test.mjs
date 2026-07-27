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

const sectionContaining = (document, heading) => {
  const section = document
    .split(/(?=^## )/m)
    .find((candidate) => candidate.startsWith(`## ${heading}`));
  assert.ok(section, `missing policy section: ${heading}`);
  return section.replaceAll("\n", " ");
};

test("explicit invocation authorizes proposal preparation without implementation", () => {
  const contract = sectionContaining(oneSkill, "端到端授權契約");

  assert.match(contract, /明確.*呼叫.*issue.*OpenSpec.*不需.*確認/i);
  assert.match(contract, /proposal GO.*之前.*不得.*實作/i);
});

test("proposal GO authorizes the complete normal delivery chain", () => {
  const contract = sectionContaining(oneSkill, "端到端授權契約");

  assert.match(
    contract,
    /實作.*commit.*push.*PR.*review.*merge.*部署驗收.*issue.*歸檔/i,
  );
  assert.match(contract, /不再.*授權|不得.*重複.*確認/);
  assert.doesNotMatch(
    oneSkill,
    /是否需要當回合再次徵求合併授權，依專案既有授權規則判斷/,
  );
});

test("post-GO pauses are limited to observable safety exceptions", () => {
  const exceptions = sectionContaining(oneSkill, "端到端授權契約");

  assert.match(exceptions, /歧義/);
  assert.match(exceptions, /重大.*範圍|material.*scope/i);
  assert.match(exceptions, /架構/);
  assert.match(exceptions, /secret|敏感/i);
  assert.match(exceptions, /權限|permission/i);
  assert.match(exceptions, /不可逆|破壞性/);
  assert.match(exceptions, /rollback|回退/i);
  assert.match(
    exceptions,
    /實作細節.*測試修正.*review.*push.*PR.*merge.*部署.*issue.*歸檔.*不得.*暫停/s,
  );
});

test("delegated items reuse recorded proposal GO", () => {
  const queuePolicy = sectionContaining(allSkill, "Phase 2 — 由同一主代理逐項執行");

  assert.match(queuePolicy, /不得.*重複.*GO/);
  assert.match(queuePolicy, /bounded|例外/i);
  assert.match(oneSkill, /jt-flow-all.*已記錄.*proposal GO.*有效/s);
});

test("published guidance describes one normal checkpoint", () => {
  assert.match(readme, /proposal GO.*唯一.*正常.*停頓|唯一.*正常.*proposal GO/s);
  assert.match(
    guidance,
    /proposal GO.*sole normal-path checkpoint|sole normal-path checkpoint.*proposal GO/is,
  );
});
