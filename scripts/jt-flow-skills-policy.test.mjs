import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
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

  const exitRows = source
    .split("\n")
    .filter((line) => /^\|.*(halted|not_applicable|回 `ok`)/.test(line));
  assert.equal(exitRows.length, 6, `每項查證都要有出口，實際 ${exitRows.length} 列`);
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
  assert.doesNotMatch(source, /`CLEAN`|`UNSTABLE`|`DIRTY`|`BEHIND`/, "合併判定的狀態清單屬於 merge-gate");
});

test("案件記錄以 references 子檔承載，不是獨立 Skill", () => {
  const record = readFileSync(
    new URL("engineering-delivery/references/case-record.md", skillsDir),
    "utf8",
  );

  assert.match(record, /去重/);
  assert.match(record, /寫入失敗/);
  assert.match(record, /Done 由 product owner 決定/);
});

test("using-jt-workflow 保留環境問題處置與平行查證方法論", () => {
  const source = readSkill("using-jt-workflow");

  assert.match(source, /不動全域設定/, "環境類修正的行動指引不得消失");
  assert.match(source, /多個角度平行查/, "外部文件的平行查證方法論不得消失");
  assert.match(source, /不用推理填空/);
});

test("external-review-gate 枚舉八種可觀測狀態", () => {
  const source = readSkill("external-review-gate");
  const matrix = source.slice(source.indexOf("| 可觀測狀態"), source.indexOf("## 兩個管道結論不同時"));
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
  for (const name of INTERNAL_SKILLS) {
    const source = readSkill(name);
    assert.match(source, /`recoverableByCode/, `${name} 必須宣告 recoverableByCode`);
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

test("merge-gate 區分 required check 未回報與已失敗，且涵蓋 HAS_HOOKS", () => {
  const source = readSkill("merge-gate");

  assert.match(source, /`HAS_HOOKS`/, "HAS_HOOKS 是 GitHub 實際會回的值，必須有出口");
  assert.match(source, /尚未回報完畢/, "required check 未回報不得與已失敗共用出口");
  assert.match(source, /已失敗/);
  assert.doesNotMatch(source, /`PENDING`/, "GitHub 的 MergeStateStatus 沒有 PENDING 這個值");
});

test("external-review-gate 綁定嚴重度與可用的處置", () => {
  const source = readSkill("external-review-gate");

  assert.match(source, /只能 `accepted`（採納，修正在 N4 進行）或 `fixed`/, "critical/high/medium 不得以 rejected 結案");
  assert.match(source, /`recoverableByCode: false`/);
});

test("engineering-delivery 涵蓋 check 終態與版號 PR 兩條路徑", () => {
  const source = readSkill("engineering-delivery");

  assert.match(source, /check 到終態/, "進外部審查前必須先等 check，否則會被誤判成需要改碼");
  assert.match(source, /版號 PR/, "版號 PR 的監看責任必須有落點");
});

test("engineering-delivery 本文自帶重跑指引與 disposition 時序", () => {
  const source = readSkill("engineering-delivery");

  assert.match(source, /^## 重跑$/m, "coordinator 本文要有重跑指引，不能只存在於 references");
  assert.match(source, /冪等鍵/);
  assert.match(source, /沒有 `pending` 這個值/, "disposition 的時序必須寫明，避免被當成待辦清單");
});

test("N3 對沿用分支的三種情況都有轉移", () => {
  const source = readSkill("engineering-delivery");

  assert.match(source, /無 commit，\*\*或\*\*查得到該分支已合併的 PR/, "已交付的分支要能開新分支，不是停下");
  assert.match(source, /對不上本次 issue/);
  assert.match(source, /halted\/risk/);
});

test("merge-gate 依失敗原因分類 required check，不一律判成可改碼解除", () => {
  const source = readSkill("merge-gate");

  assert.match(source, /屬\*\*程式碼缺陷\*\*/);
  assert.match(source, /屬\*\*基礎設施或設定\*\*/, "runner 中斷或憑證過期不是改碼能解除的");
  assert.match(source, /先讀它的實際輸出再分類/);
});

test("跨 Skill 引用的檔案路徑真的存在", () => {
  const referenced = new Set();
  for (const name of ALL_SKILLS) {
    for (const match of readSkill(name).matchAll(/`([\w./-]*references\/[\w.-]+\.md)`/g)) {
      referenced.add(match[1]);
    }
  }

  assert.ok(referenced.size > 0, "至少要有一處 references 引用，否則本測試無意義");
  for (const relativePath of referenced) {
    const candidates = [
      new URL(relativePath, skillsDir),
      ...ALL_SKILLS.map((name) => new URL(`${name}/${relativePath}`, skillsDir)),
    ];
    assert.ok(
      candidates.some((url) => existsSync(url)),
      `引用的 ${relativePath} 在 plugins/jt-flow/skills/ 底下找不到對應檔案`,
    );
  }
});

test("halted/<kind> 的簡寫只定義一次，且不與 status 或 stage 混淆", () => {
  const source = readSkill("engineering-delivery");

  assert.match(source, /`halted\/<kind>` 是簡寫/);
  assert.match(source, /不是 `status` 的第五個值，也不是\n\*\*`stage`\*\*|不是 `status` 的第五個值/);
});

test("findings 的 disposition 用 accepted 表達「已採納、修正在 N4」", () => {
  const coordinator = readSkill("engineering-delivery");
  const gate = readSkill("external-review-gate");

  assert.match(coordinator, /`accepted`（已採納，修正在 N4 進行）/);
  assert.doesNotMatch(coordinator, /`pending`(?!\s*這個值)/);
  assert.match(gate, /`needsCodeChange: true` 時，回傳的 finding 是 `accepted`/);
});

test("external-review-gate 採信 review 前先驗證來源、PR 與 head SHA", () => {
  const source = readSkill("external-review-gate");

  assert.match(source, /## 採信一份 review 之前/);
  assert.match(source, /head SHA \*\*仍是目前的 HEAD\*\*/, "過期的 review 審的是別的程式碼");
  assert.match(source, /不得映射為 `ok`/);
});

test("acceptance-readback 綁定合併 commit 並要求遮罩證據", () => {
  const source = readSkill("acceptance-readback");

  assert.match(source, /head SHA \*\*必須等於本次的合併 commit\*\*/);
  assert.match(source, /先遮罩/, "evidence 會寫進 Linear，不得夾帶 credential");
});

test("repo-standards 的 review 模板不與 jt-flow 的 merge gate 契約漂移", () => {
  const template = readFileSync(
    new URL(
      "plugins/repo-standards/skills/repo-standards/references/review-orchestration-template.md",
      repositoryRoot,
    ),
    "utf8",
  );

  assert.match(template, /`CLEAN`／`UNSTABLE`／`HAS_HOOKS`/);
  assert.match(
    template,
    /\*\*不要要求 `mergeStateStatus=CLEAN`\*\*/,
    "要求 CLEAN 會與「額度耗盡不擋合併」互相矛盾，模板必須明講",
  );
  assert.doesNotMatch(
    template,
    /滿足[\s\S]{0,200}`mergeStateStatus=CLEAN`/,
    "gate 條件本身不得再要求 CLEAN",
  );
  assert.match(template, /依原因分流，不是一律略過/);
});
