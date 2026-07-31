import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const skill = readFileSync(
  "plugins/jt-flow/skills/jt-flow-one/SKILL.md",
  "utf8",
);
const readme = readFileSync("plugins/jt-flow/README.md", "utf8");
const guidance = readFileSync("CLAUDE.md", "utf8");
const codeRabbitConfig = readFileSync(".coderabbit.yaml", "utf8");
const currentPolicy = `${skill}\n${readme}\n${guidance}`;
const containsRetiredCodeReviewCommand = (policy) => /\/code-review/.test(policy);
const paragraphContaining = (document, phrase) => {
  const paragraph = document
    .split(/\n\s*\n/)
    .find((candidate) => candidate.includes(phrase));
  assert.ok(paragraph, `missing policy paragraph containing: ${phrase}`);
  return paragraph.replaceAll("\n", " ");
};

test("uses portable Superpowers review without slash command dependency", () => {
  assert.equal(containsRetiredCodeReviewCommand(currentPolicy), false);
  assert.equal(containsRetiredCodeReviewCommand("/code-review"), true);
  assert.match(skill, /superpowers:requesting-code-review/);
  assert.match(skill, /每批程式碼變更.*最多.*一次.*Superpowers review/s);
});

test("allows a new local review only after another code change batch", () => {
  const skillPolicy = paragraphContaining(
    skill,
    "`superpowers:requesting-code-review` 進行本地 code review",
  );
  const readmePolicy = paragraphContaining(readme, "本地 review 使用");
  const guidancePolicy = paragraphContaining(
    guidance,
    "Only `jt-flow-one` owns local code review",
  );

  assert.match(skillPolicy, /變更程式碼.*新一批.*再次.*一次/);
  assert.match(skillPolicy, /沒有程式碼變更.*不得重跑/);
  assert.match(readmePolicy, /新一批程式碼變更.*可再 review 一次/);
  assert.match(readmePolicy, /沒有程式碼變更不得重跑/);
  assert.match(guidancePolicy, /new batch eligible for one more review/i);
  assert.match(guidancePolicy, /no intervening code change means no repeat/i);
  assert.match(guidancePolicy, /jt-flow-all.*must not initiate or own/i);
});

test("limits each external reviewer to one effective review", () => {
  const skillPolicy = paragraphContaining(
    skill,
    "CodeRabbit 已由本 Skill 預先授權使用",
  );
  const readmePolicy = paragraphContaining(
    readme,
    "CodeRabbit GitHub App 與 CodeRabbit CLI",
  );
  const guidancePolicy = paragraphContaining(
    guidance,
    "CodeRabbit completion means",
  );

  assert.match(skillPolicy, /GitHub App.*CLI 合計最多一次有效 review/);
  assert.match(readmePolicy, /App 與 CLI.*合計最多一次有效 review/);
  assert.match(guidancePolicy, /App and CLI together permit at most one/i);
  assert.match(paragraphContaining(skill, "Copilot 每個"), /最多一次 review/);
  assert.match(paragraphContaining(readme, "Copilot 每個"), /最多一次 review/);
  assert.match(paragraphContaining(guidance, "Copilot permits"), /at most one/i);
  assert.match(
    paragraphContaining(skill, "外部 review 不因修正重啟"),
    /finding.*修正.*push.*不得重新啟動外部 review/,
  );
  assert.match(
    paragraphContaining(readme, "finding 的修正與後續 push"),
    /不得重新啟動外部 review/,
  );
  assert.match(
    paragraphContaining(guidance, "Copilot permits"),
    /Fixes and later pushes must not restart CodeRabbit or Copilot/i,
  );
  assert.match(codeRabbitConfig, /auto_review:\s*\n\s+enabled: false/);
  assert.match(skillPolicy, /明確\s*要求一次 GitHub App review/);
  assert.match(
    skillPolicy,
    /該次 App 要求進入終態.*上方預檢執行.*coderabbit review/,
  );
  assert.match(readmePolicy, /要求進入成功、失敗或受限終態.*CLI fallback/);
  assert.match(
    guidancePolicy,
    /wait for that sole request to reach a terminal outcome.*CLI/i,
  );
});

test("does not restart CodeRabbit when a real review lacks current SHA proof", () => {
  const appPolicy = paragraphContaining(
    skill,
    "CodeRabbit 已由本 Skill 預先授權使用",
  );

  assert.match(appPolicy, /收到 CodeRabbit review 後.*重新取得最新\s+HEAD/);
  assert.match(appPolicy, /無法取得最新 HEAD.*不再觸發 App 或 CLI/);
  assert.doesNotMatch(appPolicy, /SHA.*(?:不符|missing).*(?:重新|再次).*觸發/i);
});

test("exhausts the CodeRabbit CLI fallback after its first invocation", () => {
  assert.match(
    skill,
    /CLI 一經呼叫即耗盡唯一\s+fallback.*無論.*產出真實 review.*不得重試/s,
  );
});

test("delegated review separates one proposal overdesign review from jt-flow-one quality review", () => {
  const queueContract = skill
    .split("## Queue execution contract\n", 2)[1]
    .split("\n## ", 2)[0];

  assert.match(
    queueContract,
    /jt-flow-all.*one independent.*proposal.*overdesign review.*material proposal revision.*jt-flow-one.*implementation quality review.*sole owner.*jt-flow-all.*must not initiate.*duplicate/is,
  );
});

test("Copilot quota exhaustion records a skip without blocking a delegated item or queue", () => {
  const queueContract = skill
    .split("## Queue execution contract\n", 2)[1]
    .split("\n## ", 2)[0];

  assert.match(queueContract, /quota\s+exhausted.*record.*skip.*continue.*item.*queue/is);
});
