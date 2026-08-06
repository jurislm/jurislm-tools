import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const skill = readFileSync(
  "plugins/jt-flow/skills/jt-flow-one/SKILL.md",
  "utf8",
);
const readme = readFileSync("plugins/jt-flow/README.md", "utf8");
const guidance = readFileSync("CLAUDE.md", "utf8");

const sectionContaining = (document, heading) => {
  const matches = document
    .split(/(?=^## )/m)
    .filter((candidate) => candidate.startsWith(`## ${heading}\n`));
  assert.equal(matches.length, 1, `expected one policy section: ${heading}`);
  return matches[0].replaceAll("\n", " ");
};

const paragraphContaining = (document, phrase) => {
  const paragraph = document
    .split(/\n\s*\n/)
    .find((candidate) => candidate.includes(phrase));
  assert.ok(paragraph, `missing policy paragraph containing: ${phrase}`);
  return paragraph.replaceAll("\n", " ");
};

test("checks nested delegation before the capability check, not after", () => {
  const section = sectionContaining(skill, "團隊模式（Agent Teams）偵測與派工");

  assert.match(
    section,
    /先判斷本次執行是否為\s*`jt-flow-all`.*Queue execution contract.*委派下來/s,
  );
  assert.match(section, /no nested teams/i);
  assert.match(section, /直接判定團隊模式不可用.*不再檢查下面兩個條件/s);
});

test("requires both the feature flag and the addressing tools before recording team mode as available", () => {
  const section = sectionContaining(skill, "團隊模式（Agent Teams）偵測與派工");

  assert.match(
    section,
    /`echo\s+"\$CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS"`\s*回傳\s*`1`/,
  );
  assert.match(section, /`SendMessage`、\s*`TaskCreate`、\s*`TaskList`/);
  assert.match(section, /三個 tool 的 schema 可透過 ToolSearch 正常載入/);
  assert.match(section, /兩者都成立才判定可用/);
});

test("determines availability once per run and reuses it, not per dispatch point", () => {
  const section = sectionContaining(skill, "團隊模式（Agent Teams）偵測與派工");

  assert.match(section, /執行一開始.*判斷一次.*團隊模式.*是否可用/s);
  assert.match(section, /之後整個執行過程沿用同一個結果，不重複判斷/);
});

test("wraps the Workflow-tool call for both existing 2+-angle dispatch points instead of replacing it", () => {
  const section = sectionContaining(skill, "團隊模式（Agent Teams）偵測與派工");

  assert.match(section, /三工具研究.*Context7\/Exa\/Firecrawl/);
  assert.match(section, /Step 5 code\s*review/);
  assert.match(section, /派一個具名的 wrapper agent/);
  assert.match(section, /tool allowlist 需包含\s*`Workflow`.*`general-purpose`/);
  assert.match(section, /由該 wrapper 內部照原規則呼叫 Workflow tool/);
  assert.match(section, /`jt-flow-one` 本身不再直接呼叫 Workflow tool/);
  assert.match(section, /\*\*不得\*\*拆解成手動散派\s*多個具名 agent 取代這次 Workflow tool 呼叫/);
  assert.match(section, /可隨時用 SendMessage 對該\s*wrapper 追加指示/);
});

test("leaves both dispatch points calling Workflow directly when team mode is unavailable", () => {
  const section = sectionContaining(skill, "團隊模式（Agent Teams）偵測與派工");

  assert.match(
    section,
    /判定為不可用時.*Codex.*未開旗標的 Claude Code.*nested 執行.*這兩處派工完全不變/s,
  );
  assert.match(section, /`jt-flow-one` 直接呼叫 Workflow tool，不經過任何具名\s*wrapper/);
});

test("does not edit the existing three-tool research or code-review paragraphs themselves", () => {
  assert.match(
    skill,
    /Context7、Exa、Firecrawl \*\*各派一個 agent 平行查\*\*（`model: sonnet`，2 個以上平行\n角度時用 Workflow 而非手動散派）/,
  );
  assert.match(
    paragraphContaining(skill, "以\n   `superpowers:requesting-code-review` 進行本地 code review"),
    /superpowers:receiving-code-review/,
  );
});

test("mirrors the detection-and-wrap rule in README.md and root CLAUDE.md", () => {
  assert.match(readme, /團隊模式|Agent Teams/);
  assert.match(readme, /CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS/);
  assert.match(readme, /no nested teams|nested.*team/i);

  assert.match(guidance, /jt-flow-one/);
  assert.match(guidance, /CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS/);
  assert.match(guidance, /Workflow/);
});
