import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const skill = readFileSync(
  "plugins/jt-flow/skills/jt-flow-one/SKILL.md",
  "utf8",
);
const readme = readFileSync("plugins/jt-flow/README.md", "utf8");
const guidance = readFileSync("CLAUDE.md", "utf8");

const noSpace = (text) => text.replace(/\s+/g, "");

const sectionContaining = (document, heading) => {
  const matches = document
    .split(/(?=^## )/m)
    .filter((candidate) => candidate.startsWith(`## ${heading}\n`));
  assert.equal(matches.length, 1, `expected one policy section: ${heading}`);
  return matches[0];
};

const paragraphContaining = (document, phrase) => {
  const paragraph = document
    .split(/\n\s*\n/)
    .find((candidate) => noSpace(candidate).includes(noSpace(phrase)));
  assert.ok(paragraph, `missing policy paragraph containing: ${phrase}`);
  return paragraph;
};

// Markdown wraps CJK/English prose at arbitrary points, so a phrase that
// happens to span two source lines today can silently stop matching after a
// purely cosmetic reflow. Comparing with whitespace stripped from both sides
// makes these assertions test wording, not today's line-wrap positions.
const containsPhrase = (document, phrase) =>
  noSpace(document).includes(noSpace(phrase));
const assertContains = (document, phrase) =>
  assert.ok(containsPhrase(document, phrase), `missing phrase: ${phrase}`);
const assertNotContains = (document, phrase) =>
  assert.ok(!containsPhrase(document, phrase), `unexpected phrase present: ${phrase}`);

test("checks nested delegation before the capability check, not after", () => {
  const section = sectionContaining(skill, "團隊模式（Agent Teams）偵測與派工");

  assertContains(
    section,
    "先判斷本次執行是否為 `jt-flow-all` 依【Queue execution contract】委派下來的 nested 執行",
  );
  assert.match(section, /no nested teams/i);
  assertContains(section, "有 → 直接判定團隊模式不可用，不再檢查下面兩個條件");
});

test("requires both the feature flag and the addressing tools before recording team mode as available", () => {
  const section = sectionContaining(skill, "團隊模式（Agent Teams）偵測與派工");

  assertContains(
    section,
    '`echo "$CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS"` 回傳 `1`',
  );
  assertContains(section, "`SendMessage`、`TaskCreate`、`TaskList`");
  assertContains(section, "三個 tool 的 schema 可透過 ToolSearch 正常載入");
  assertContains(section, "兩者都成立才判定可用");
});

test("determines availability once per run and reuses it, not per dispatch point", () => {
  const section = sectionContaining(skill, "團隊模式（Agent Teams）偵測與派工");

  assertContains(section, "本 Skill 執行一開始");
  assertContains(section, "判斷一次「團隊模式」是否可用");
  assertContains(section, "之後整個執行過程沿用同一個結果，不重複判斷");
});

test("wraps the Workflow-tool call for both existing 2+-angle dispatch points instead of replacing it", () => {
  const section = sectionContaining(skill, "團隊模式（Agent Teams）偵測與派工");

  assertContains(section, "三工具研究（Context7/Exa/Firecrawl");
  assertContains(section, "Step 5 code review");
  assertContains(section, "在這兩處各自派一個具名的 wrapper agent");
  assertContains(section, "`model: sonnet`");
  assertContains(section, "tool allowlist 需包含 `Workflow`，如 `general-purpose`");
  assertContains(section, "由該 wrapper 內部照原規則呼叫 Workflow tool");
  assertContains(section, "`jt-flow-one` 本身不再直接呼叫 Workflow tool");
  assertContains(
    section,
    "**不得**拆解成手動散派多個具名 agent 取代這次 Workflow tool 呼叫",
  );
  assertContains(section, "可隨時用 SendMessage 對該 wrapper 追加指示");
});

test("leaves both dispatch points calling Workflow directly when team mode is unavailable", () => {
  const section = sectionContaining(skill, "團隊模式（Agent Teams）偵測與派工");

  assertContains(
    section,
    "判定為不可用時（Codex、未開旗標的 Claude Code、或上述第 1 點的 nested 執行），這兩處派工完全不變",
  );
  assertContains(
    section,
    "`jt-flow-one` 直接呼叫 Workflow tool，不經過任何具名 wrapper",
  );
});

test("does not edit the existing three-tool research or code-review paragraphs themselves", () => {
  assertContains(
    skill,
    "Context7、Exa、Firecrawl **各派一個 agent 平行查**（`model: sonnet`，2 個以上平行角度時用 Workflow 而非手動散派）",
  );
  assert.match(
    paragraphContaining(skill, "`superpowers:requesting-code-review` 進行本地 code review"),
    /superpowers:receiving-code-review/,
  );
});

test("team-mode section precedes both dispatch points it governs in reading order", () => {
  const sectionIndex = skill.indexOf("## 團隊模式（Agent Teams）偵測與派工");
  const researchIndex = skill.indexOf("外部系統行為不確定時，一定查文件");
  const codeReviewIndex = skill.indexOf("進行本地 code review");

  assert.ok(sectionIndex >= 0, "team-mode section not found");
  assert.ok(sectionIndex < researchIndex, "team-mode section must precede the three-tool research paragraph");
  assert.ok(sectionIndex < codeReviewIndex, "team-mode section must precede the Step 5 code-review paragraph");
});

test("mirrors the detection-and-wrap rule in README.md and root CLAUDE.md", () => {
  assertContains(readme, "團隊模式");
  assertContains(readme, "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` 且");
  assertNotContains(readme, "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` 或");
  assert.match(readme, /no nested teams|nested.*team/i);
  assertContains(readme, "不拆解取代");
  assertContains(readme, "`model: sonnet`");
  assertContains(readme, "`general-purpose`");

  assertContains(guidance, "jt-flow-one");
  assertContains(guidance, "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` and the");
  assert.match(guidance, /rather than replacing that call with/i);
  assertContains(guidance, "`model: sonnet`");
  assertContains(guidance, "`general-purpose`");
});
