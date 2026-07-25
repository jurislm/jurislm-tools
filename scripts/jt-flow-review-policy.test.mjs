import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const skill = readFileSync(
  "plugins/jt-flow/skills/jt-flow-one/SKILL.md",
  "utf8",
);
const readme = readFileSync("plugins/jt-flow/README.md", "utf8");
const guidance = readFileSync("CLAUDE.md", "utf8");
const currentPolicy = `${skill}\n${readme}\n${guidance}`;
const containsRetiredCodeReviewCommand = (policy) => /`\/code-review`/.test(policy);

test("uses portable Superpowers review without slash command dependency", () => {
  assert.equal(containsRetiredCodeReviewCommand(currentPolicy), false);
  assert.equal(containsRetiredCodeReviewCommand("/code-review"), true);
  assert.match(skill, /superpowers:requesting-code-review/);
  assert.match(skill, /每批程式碼變更.*最多.*一次.*Superpowers review/s);
});

test("allows a new local review only after another code change batch", () => {
  assert.match(
    skill,
    /finding.*變更程式碼.*新一批.*再次.*一次.*Superpowers review/s,
  );
  assert.match(skill, /沒有程式碼變更.*不得重跑/s);
});

test("limits each external reviewer to one effective review", () => {
  assert.match(
    currentPolicy,
    /CodeRabbit.*GitHub App.*CLI.*合計.*最多一次有效 review/s,
  );
  assert.match(currentPolicy, /Copilot.*每個 PR.*最多一次 review/s);
  assert.match(currentPolicy, /修正.*push.*不得.*重新.*外部 review/s);
});

test("does not restart CodeRabbit when a real review lacks current SHA proof", () => {
  assert.doesNotMatch(
    skill,
    /review 缺少 SHA、SHA 不符.*觸發.*GitHub review/s,
  );
  assert.match(
    skill,
    /真實 review.*無法證明.*目前 HEAD.*不再觸發 App 或 CLI/s,
  );
});
