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

test("both existing 2+-angle dispatch points always call Workflow directly, unaffected by detection", () => {
  const section = sectionContaining(skill, "團隊模式（Agent Teams）偵測與派工");

  assertContains(section, "三工具研究（Context7/Exa/Firecrawl");
  assertContains(section, "Phase 4 code-review dispatch");
  assertContains(section, "不論上面判定結果為何，行為都不變");
  assertContains(
    section,
    "一律由目前執行 `jt-flow-one` 的 session 直接呼叫 Workflow tool",
  );
});

test("documents why no wrapper is used: Workflow is only callable from the top-level session", () => {
  const section = sectionContaining(skill, "團隊模式（Agent Teams）偵測與派工");

  assertContains(section, "`Workflow` tool 只有主 session");
  assertContains(section, "spawn 出去的 agent 拿不到這個 tool");
  assertContains(section, "已實測驗證");
  assertContains(section, "團隊模式判定為可用的前提就是「非 nested」");
  assertContains(section, "本來就已經是可被直接發訊息插話的");
});

test("retains the detection logic as inert groundwork for a future non-Workflow dispatch point", () => {
  const section = sectionContaining(skill, "團隊模式（Agent Teams）偵測與派工");

  assertContains(section, "上面的偵測邏輯目前對這兩處派工沒有實際影響");
  assertContains(section, "不需要呼叫 Workflow tool 的單純單次派工點");
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
  assert.ok(sectionIndex < codeReviewIndex, "team-mode section must precede the Phase 4 code-review dispatch paragraph");
});

test("mirrors the detection logic and the no-behavior-change rationale in README.md and root CLAUDE.md", () => {
  assertContains(readme, "團隊模式");
  assertContains(readme, "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` 且");
  assertNotContains(readme, "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` 或");
  assert.match(readme, /no nested teams|nested.*team/i);
  assertContains(readme, "不受偵測結果影響");
  assertContains(readme, "只有主 session 能呼叫");

  assertContains(guidance, "jt-flow-one");
  assertContains(guidance, "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` and the");
  assertContains(guidance, "unaffected by this detection today");
  assertContains(guidance, "only possible from the top-level session");
});
