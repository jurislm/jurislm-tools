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

test("jt-flow-all follows the existing active OpenSpec change order", () => {
  assert.match(allSkill, /active `openspec\/changes\/`/);
  assert.match(allSkill, /既有順序/);
  assert.match(allSkill, /不得重新排序/);
});

test("jt-flow-all does not inventory the full GitHub issue backlog", () => {
  assert.doesNotMatch(allSkill, /抓取完整 open issue 集合/);
  assert.doesNotMatch(allSkill, /gh issue list[\s\S]*--limit 500/);
  assert.doesNotMatch(allSkill, /重新比較所有項目/);
  assert.doesNotMatch(allSkill, /等待使用者明確 GO/);
});

test("explicit queue invocation does not imply CodeRabbit consent", () => {
  assert.doesNotMatch(allSkill, /明確點名／呼叫本 Skill 即代表接受/);
  assert.match(
    allSkill,
    /明確.*CodeRabbit consent evidence.*preauthorized.*否則.*requires-disclosure/s,
  );
});
