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

test("delivery-preflight 列出六項查證且每項都有出口", () => {
  const source = readSkill("delivery-preflight");

  for (const marker of [
    "版本控制",
    "git",
    "GitHub",
    "remote 解析唯一",
    "案件管理讀取管道",
  ]) {
    assert.match(source, new RegExp(marker), `缺少查證項：${marker}`);
  }

  assert.match(source, /`remote`/);
  assert.match(source, /`ownerRepo`/);
  assert.match(source, /`defaultBranch`/);
  assert.match(source, /外部審查管道不在此查證/, "preflight 必須明文把外部審查排除在查證之外，避免提早阻擋");

  const exitRows = source.split("\n").filter((line) => /\| .*halted|not_applicable|回 `ok`/.test(line));
  assert.ok(exitRows.length >= 6, `每項查證都要有出口，實際 ${exitRows.length} 列`);
});

test("engineering-delivery 定義 N0-N10 且每個節點都有出口", () => {
  const source = readSkill("engineering-delivery");

  for (let node = 0; node <= 10; node += 1) {
    assert.match(source, new RegExp(`\\| N${node} `), `缺少節點 N${node}`);
  }

  assert.match(source, /`recoverableByCode` 為真 → \*\*回 N4\*\*/);
  assert.match(source, /連續第三次/, "回頭邊必須有收斂保護");
  assert.match(source, /awaiting_owner_acceptance/);

  for (const field of ["`status`", "`stage`", "`issue`", "`branch`", "`pr`", "`blocked`"]) {
    assert.ok(source.includes(field), `envelope schema 缺少欄位 ${field}`);
  }
  assert.match(source, /只有 Release Please 版號 PR 允許 `null`/);
});

test("engineering-delivery 調用而非重寫工法與關卡", () => {
  const source = readSkill("engineering-delivery");

  for (const dependency of [
    "superpowers:test-driven-development",
    "superpowers:systematic-debugging",
    "superpowers:verification-before-completion",
    "superpowers:requesting-code-review",
    "superpowers:receiving-code-review",
    "delivery-preflight",
    "external-review-gate",
    "merge-gate",
    "acceptance-readback",
  ]) {
    assert.match(source, new RegExp(dependency.replace(/[-:]/g, "\\$&")), `缺少對 ${dependency} 的調用`);
  }

  assert.doesNotMatch(source, /@coderabbitai/, "審查管道細節屬於 coderabbit:code-review，不得複製到此");
  assert.doesNotMatch(source, /mergeStateStatus/, "合併判定細節屬於 merge-gate");
});

test("案件記錄以 references 子檔承載，不是獨立 Skill", () => {
  const record = readFileSync(
    new URL("engineering-delivery/references/case-record.md", skillsDir),
    "utf8",
  );

  assert.match(record, /去重/);
  assert.match(record, /寫入失敗/);
  assert.match(record, /Done 由 product owner 決定/);
  assert.ok(!ALL_SKILLS.includes("linear-case-record"));
});

test("using-jt-workflow 保留環境問題處置與平行查證方法論", () => {
  const source = readSkill("using-jt-workflow");

  assert.match(source, /不動全域設定/, "環境類修正的行動指引不得消失");
  assert.match(source, /多個角度平行查/, "外部文件的平行查證方法論不得消失");
  assert.match(source, /不用推理填空/);
});

test("external-review-gate 枚舉八種可觀測狀態", () => {
  const source = readSkill("external-review-gate");
  const matrix = source.slice(source.indexOf("| 可觀測狀態"));
  const rows = matrix
    .split("\n")
    .filter((line) => line.startsWith("|") && !line.startsWith("|---") && !line.startsWith("| 可觀測狀態"));

  assert.equal(rows.length, 8, `狀態矩陣必須有八列，實際 ${rows.length}`);
  assert.match(source, /無任何受理跡象/);
  assert.match(source, /已受理但尚未完成/);
  assert.match(source, /needsCodeChange/);
});

test("external-review-gate 不擁有審查管道", () => {
  const source = readSkill("external-review-gate");

  assert.match(source, /`coderabbit:code-review`/);
  assert.doesNotMatch(source, /@coderabbitai/, "不得描述 App 指令");
  assert.doesNotMatch(source, /coderabbit review --/, "不得描述 CLI 旗標");
  assert.match(source, /不受信任/, "外部留言必須被當成不受信任資料");
});

test("merge-gate 與 acceptance-readback 在 halted 時提供 recoverableByCode", () => {
  for (const name of ["merge-gate", "acceptance-readback"]) {
    const source = readSkill(name);
    assert.match(source, /`recoverableByCode`/, `${name} 必須宣告 recoverableByCode`);
    assert.match(source, /`halted`/, `${name} 必須說明 halted 的情況`);
  }
});

test("merge-gate 以 UNSTABLE 為可合併狀態且對 UNKNOWN 設上限", () => {
  const source = readSkill("merge-gate");

  assert.match(source, /`UNSTABLE`/);
  assert.match(source, /`UNKNOWN`[\s\S]{0,200}上限/);
  assert.match(source, /Release Please/);
  assert.match(source, /目標 repo 的 `CLAUDE\.md` 為準/);
});

test("acceptance-readback 涵蓋無部署管道的 repo", () => {
  const source = readSkill("acceptance-readback");

  assert.match(source, /沒有部署管道/);
  assert.match(source, /CI 終態/);
  assert.match(source, /migration/);
  assert.match(source, /superpowers:verification-before-completion/);
});

test("live 檔案不再引用 jt-flow-one", () => {
  const EXCLUDED_DIRS = new Set([
    ".git",
    "node_modules",
    ".claude/worktrees",
    "openspec/changes/archive",
    "docs/superpowers",
    ".superpowers",
  ]);
  const EXCLUDED_FILES = new Set([
    "CHANGELOG.md",
    // 本測試檔必須指名退場的 Skill 才能斷言它不存在
    "scripts/jt-flow-skills-policy.test.mjs",
  ]);

  const offenders = [];
  const walk = (relativeDir) => {
    const entries = readdirSync(new URL(relativeDir, repositoryRoot), { withFileTypes: true });
    for (const entry of entries) {
      const relativePath = relativeDir === "" ? entry.name : `${relativeDir}${entry.name}`;
      if (entry.isDirectory()) {
        if (EXCLUDED_DIRS.has(relativePath)) continue;
        walk(`${relativePath}/`);
        continue;
      }
      if (EXCLUDED_FILES.has(relativePath)) continue;
      if (!/\.(md|json|yaml|yml|mjs|js)$/.test(entry.name)) continue;
      const source = readFileSync(new URL(relativePath, repositoryRoot), "utf8");
      if (source.includes("jt-flow-one")) offenders.push(relativePath);
    }
  };
  walk("");

  assert.deepEqual(offenders, [], `這些 live 檔案仍引用退場的 jt-flow-one：${offenders.join(", ")}`);
});

test("六個 Skill 都不使用需要拿捏的措辭", () => {
  const HEDGES = ["合理時間", "適當", "看情況", "盡快"];
  for (const name of ALL_SKILLS) {
    const source = readSkill(name);
    for (const hedge of HEDGES) {
      assert.ok(!source.includes(hedge), `${name} 出現需要拿捏的措辭「${hedge}」`);
    }
  }
});

test("jt-flow 的 README 不重複外部審查的管道細節，也不使用需要拿捏的措辭", () => {
  const readme = readFileSync(new URL("plugins/jt-flow/README.md", repositoryRoot), "utf8");

  assert.doesNotMatch(readme, /@coderabbitai/, "App 指令細節屬於 coderabbit:code-review");
  assert.doesNotMatch(readme, /coderabbit review --/, "CLI 旗標細節屬於 coderabbit:code-review");
  assert.doesNotMatch(readme, /\.coderabbit\.yaml/, "設定檔判讀細節屬於 coderabbit:code-review");
  assert.match(readme, /`coderabbit:code-review`/, "仍須指出審查的所有權歸屬");

  for (const hedge of ["合理時間", "適當", "看情況", "盡快"]) {
    assert.ok(!readme.includes(hedge), `README 出現需要拿捏的措辭「${hedge}」`);
  }
});
