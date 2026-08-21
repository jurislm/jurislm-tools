import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import test from "node:test";

const repositoryRoot = new URL("../", import.meta.url);
const skillsDir = new URL("plugins/jt-flow/skills/", repositoryRoot);

export const PUBLIC_SKILLS = ["engineering-delivery", "using-jt-workflow"];
export const INTERNAL_SKILLS = [
  "acceptance-readback",
  "delivery-preflight",
  "external-review-gate",
  "merge-gate",
];
export const ALL_SKILLS = [...PUBLIC_SKILLS, ...INTERNAL_SKILLS].sort();

export function readSkill(name) {
  return readFileSync(new URL(`${name}/SKILL.md`, skillsDir), "utf8");
}

function frontmatter(source) {
  const match = source.match(/^---\n([\s\S]*?)\n---/);
  assert.ok(match, "SKILL.md 必須以 YAML frontmatter 開頭");
  return match[1];
}

export function frontmatterName(source) {
  const match = frontmatter(source).match(/^name:\s*(\S+)/m);
  assert.ok(match, "frontmatter 必須宣告 name");
  return match[1];
}

export function frontmatterDescription(source) {
  const match = frontmatter(source).match(
    /^description:\s*(?:>-?|\|-?)?[ \t]*\n?([\s\S]*?)(?=\n[a-zA-Z_-]+:|$)/m,
  );
  assert.ok(match, "frontmatter 必須宣告 description");
  return match[1].replace(/\s+/g, " ").trim();
}

test("jt-flow 只提供六個 Skill，且 jt-flow-one 已退場", () => {
  const actual = readdirSync(skillsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  assert.deepEqual(actual, ALL_SKILLS);
  assert.ok(!actual.includes("jt-flow-one"), "jt-flow-one 目錄必須刪除，不留 shim");
});

test("每個 Skill 的目錄名與 frontmatter name 一致", () => {
  for (const name of ALL_SKILLS) {
    assert.equal(frontmatterName(readSkill(name)), name, `${name} 的 frontmatter name 與目錄名不符`);
  }
});

test("內部 Skill 宣告自己由 coordinator 調用", () => {
  for (const name of INTERNAL_SKILLS) {
    assert.match(
      frontmatterDescription(readSkill(name)),
      /^由 `engineering-delivery` 調用/,
      `${name} 的 description 必須以「由 \`engineering-delivery\` 調用」開頭，避免被自然語言直接路由`,
    );
  }
});

test("using-jt-workflow 承載三條紀律、具名依賴判別與紅旗表", () => {
  const source = readSkill("using-jt-workflow");

  assert.match(source, /可替換工具一律是例子/);
  assert.match(source, /repo 事實去讀該 repo 自己宣告的定義/);
  assert.match(source, /Linear 是案件檔案/);
  assert.match(source, /具名依賴/);
  assert.match(source, /來源優先序/);

  const redFlagRows = source
    .split("\n")
    .filter((line) => line.startsWith("| 「"));
  assert.ok(redFlagRows.length >= 7, `紅旗表至少七列，實際 ${redFlagRows.length}`);
});

test("using-jt-workflow 不執行動作", () => {
  const source = readSkill("using-jt-workflow");
  assert.doesNotMatch(source, /^```bash/m, "紀律 Skill 不應包含可執行指令區塊");
});
