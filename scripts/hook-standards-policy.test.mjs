import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repositoryRoot = new URL("../", import.meta.url);
const pluginRoot = new URL("plugins/hook-standards/", repositoryRoot);
const skillRoot = new URL("skills/hook-standards/", pluginRoot);
const scriptsRoot = new URL("scripts/", skillRoot);

// 規格與腳本分屬兩個檔案，一定會漂移。這支測試只守機械可驗的部分：
// 對應關係、檔案形狀、以及「不得自動註冊」這個決策本身。
function read(url) {
  return readFileSync(url, "utf8");
}

function listGuardScripts() {
  return readdirSync(scriptsRoot)
    .filter((name) => name.endsWith(".sh"))
    .sort();
}

test("每支腳本都同時出現在 SKILL.md 與 hook-catalog.md", () => {
  const scripts = listGuardScripts();
  assert.ok(scripts.length > 0, "scripts/ 必須至少有一支 hook 腳本");

  const skill = read(new URL("SKILL.md", skillRoot));
  const catalog = read(new URL("references/hook-catalog.md", skillRoot));

  for (const script of scripts) {
    assert.ok(skill.includes(script), `SKILL.md 必須提到 ${script}`);
    assert.match(
      catalog,
      new RegExp(`^## ${script.replace(/\./g, "\\.")}$`, "m"),
      `hook-catalog.md 必須有 ## ${script} 章節`,
    );
  }

  const catalogSections = catalog.match(/^## .+\.sh$/gm) ?? [];
  assert.equal(
    catalogSections.length,
    scripts.length,
    "hook-catalog.md 的腳本章節數必須等於 scripts/ 的腳本數，不得有孤兒章節",
  );
});

test("hook-catalog.md 每支腳本都填滿六個固定欄位", () => {
  const catalog = read(new URL("references/hook-catalog.md", skillRoot));
  const fields = [
    "事件與 matcher",
    "攔什麼",
    "決定",
    "不攔什麼",
    "對應規則",
    "踩坑記錄",
  ];

  const sections = catalog.split(/^## /m).slice(1);
  const scriptSections = sections.filter((section) => /^\S+\.sh$/m.test(section.split("\n")[0]));

  for (const section of scriptSections) {
    const name = section.split("\n")[0];
    for (const field of fields) {
      assert.ok(
        section.includes(field),
        `hook-catalog.md 的 ${name} 章節缺少「${field}」欄位`,
      );
    }
  }
});

test("每支腳本以 shebang 開頭，且檔頭說明了為什麼這是 hook", () => {
  for (const script of listGuardScripts()) {
    const source = read(new URL(script, scriptsRoot));
    assert.match(source, /^#!/, `${script} 必須以 shebang 開頭`);

    const header = source.split("\n").slice(0, 40).join("\n");
    assert.match(
      header,
      /^#.*(?:Why:|為什麼)/m,
      `${script} 的檔頭必須說明為什麼這件事是 hook 而不是規則文字`,
    );
  }
});

test("SKILL.md 八節齊備", () => {
  const skill = read(new URL("SKILL.md", skillRoot));
  const sections = [
    "分層原則",
    "入選判準",
    "deny 與 ask",
    "匹配紀律",
    "失敗紀律",
    "輸出格式",
    "註解義務",
    "安裝與更新",
  ];

  for (const section of sections) {
    assert.match(
      skill,
      new RegExp(`^## ${section}$`, "m"),
      `SKILL.md 必須有 ## ${section} 章節`,
    );
  }
});

test("plugin 不得以任何方式自動註冊 hook", () => {
  // 自動註冊有兩條路徑，擋一條不夠：預設位置 hooks/hooks.json，以及 manifest 的
  // hooks 欄位——後者可指向任意路徑，且與預設位置是合併而非取代。
  assert.equal(
    existsSync(new URL("hooks/hooks.json", pluginRoot)),
    false,
    "加上 hooks/hooks.json 會讓同一個 Bash 指令跑兩次 guard",
  );

  const manifest = JSON.parse(read(new URL(".claude-plugin/plugin.json", pluginRoot)));
  assert.equal(
    Object.hasOwn(manifest, "hooks"),
    false,
    "plugin.json 的 hooks 欄位同樣會自動註冊，與個人層 settings.json 雙重觸發",
  );
});

test("SKILL.md 列的 git global option 與 git-guard.sh 實際列舉的一致", () => {
  // SKILL.md 逐字複述了 git-guard.sh 的選項清單，這是整份交付裡唯一被抄寫兩次的事實。
  // 沒有這條斷言，改了腳本而忘了改文件不會有任何東西發現。
  const guard = read(new URL("git-guard.sh", scriptsRoot));
  const line = guard.match(/^GIT_GLOBAL_OPT=.*$/m);
  assert.ok(line, "git-guard.sh 必須有 GIT_GLOBAL_OPT 定義");

  const options = [...line[0].matchAll(/(--[a-z-]+=?|-[A-Za-z])(?=\[|\||\))/g)].map(
    (match) => match[1],
  );
  assert.ok(options.length > 0, "GIT_GLOBAL_OPT 必須列舉至少一個選項");

  const skill = read(new URL("SKILL.md", skillRoot));
  const discipline = skill.split(/^## /m).find((section) => section.startsWith("匹配紀律"));
  assert.ok(discipline, "SKILL.md 必須有匹配紀律章節");

  for (const option of options) {
    assert.ok(
      discipline.includes(option),
      `SKILL.md 的匹配紀律必須列出 ${option}，否則文件與 git-guard.sh 已經漂移`,
    );
  }
});

function decideDestructive(command) {
  const guard = fileURLToPath(new URL("destructive-guard.sh", scriptsRoot));
  const result = spawnSync("bash", [guard], {
    input: JSON.stringify({ tool_input: { command } }),
    encoding: "utf8",
  });
  assert.equal(result.status, 0, `${command} 不得讓守衛以非零退出碼結束`);
  if (result.stdout.trim() === "") return null;
  return JSON.parse(result.stdout).hookSpecificOutput.permissionDecision;
}

// 守衛以 jq 解析 stdin。CI 跑的 node:*-slim 映像沒有 jq，守衛在那裡整支 fail-open
// ——catalog 的「不攔什麼」明載這件事。所以 jq 不在時不跳過測試，改為驗證那條
// fail-open 本身：兩種環境下斷言的內容不同，但都是文件宣稱為真的行為。
const jqAvailable = spawnSync("jq", ["--version"]).status === 0;

test("destructive-guard 的行為與 catalog 記載的邊界相符", () => {
  const decide = decideDestructive;

  if (!jqAvailable) {
    assert.equal(decide("rm -rf /tmp/x"), null, "無 jq 時應如 catalog 所載整支放行");
    assert.equal(decide("prisma migrate reset"), null, "無 jq 時應如 catalog 所載整支放行");
    return;
  }

  // catalog 說會攔的
  assert.equal(decide("rm -rf /tmp/x"), "ask");
  assert.equal(decide("psql -c 'DROP TABLE users'"), "ask");
  assert.equal(decide("prisma migrate reset"), "ask");

  // catalog 的「不攔什麼」列出的漏網，實測確認過。這些斷言不是在慶祝漏網，
  // 而是釘住文件宣稱的邊界——哪天腳本補上了，這裡會紅，文件就必須跟著改。
  assert.equal(decide("rm -f -r /tmp/x"), null, "catalog 記載旗標順序變體會漏");
  assert.equal(decide("rm --recursive --force /tmp/x"), null, "catalog 記載長旗標會漏");
  assert.equal(decide("rm -r /tmp/x"), null, "catalog 記載不帶 -f 不攔");
  assert.equal(decide("rm  -rf /tmp/x"), null, "catalog 記載多一個空白就漏");

  // 不該誤擋的
  assert.equal(decide("git status"), null);
});

test("marketplace 收錄 hook-standards，且 langfuse 位於索引 0", () => {
  const marketplace = JSON.parse(
    read(new URL(".claude-plugin/marketplace.json", repositoryRoot)),
  );

  assert.equal(
    marketplace.plugins[0].name,
    "langfuse",
    "Release Please 以索引 0 寫版號，抽離 Coolify／Hetzner 後 langfuse 位於第一個",
  );

  const entry = marketplace.plugins.find((plugin) => plugin.name === "hook-standards");
  assert.ok(entry, "marketplace.json 必須收錄 hook-standards");
  assert.equal(entry.source, "./plugins/hook-standards");
  assert.equal(
    Object.hasOwn(entry, "version"),
    false,
    "非索引 0 的 entry 不帶 version 欄位，對齊其餘 entry 的既有慣例",
  );
});

test("release-please 追蹤 hook-standards 的版號", () => {
  const config = JSON.parse(read(new URL("release-please-config.json", repositoryRoot)));
  const tracked = config.packages["."]["extra-files"].some(
    (entry) => entry.path === "plugins/hook-standards/.claude-plugin/plugin.json",
  );

  assert.ok(tracked, "release-please-config.json 必須追蹤 hook-standards 的 plugin.json");
});
