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

test("jt-flow-all continues each item in the current primary agent", () => {
  assert.match(allSkill, /目前主代理/);
  assert.match(allSkill, /不得建立或安排子代理/);
  assert.match(allSkill, /載入並遵循 `jt-flow-one`/);
});

test("queue handoff wording does not imply subagent delegation", () => {
  assert.doesNotMatch(allSkill, /委派|delivery owner/i);
  assert.doesNotMatch(oneSkill, /委派|delegation/i);
});
