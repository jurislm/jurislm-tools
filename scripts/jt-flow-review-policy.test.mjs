import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";

const skill = readFileSync(
  "plugins/jt-flow/skills/jt-flow-one/SKILL.md",
  "utf8",
);
const readme = readFileSync("plugins/jt-flow/README.md", "utf8");
const guidance = readFileSync("CLAUDE.md", "utf8");
const allSkill = readFileSync(
  "plugins/jt-flow/skills/jt-flow-all/SKILL.md",
  "utf8",
);
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
const sectionContaining = (document, heading) => {
  const matches = document
    .split(/(?=^## )/m)
    .filter((candidate) => candidate.startsWith(`## ${heading}\n`));
  assert.equal(matches.length, 1, `expected one policy section: ${heading}`);
  return matches[0];
};

test("uses portable Superpowers review without slash command dependency", () => {
  assert.equal(containsRetiredCodeReviewCommand(currentPolicy), false);
  assert.equal(containsRetiredCodeReviewCommand("/code-review"), true);
  assert.match(skill, /superpowers:requesting-code-review/);
  assert.match(
    paragraphContaining(skill, "`superpowers:requesting-code-review` 進行本地 code review"),
    /本地 Superpowers review.*全程最多.*3\s*次/s,
  );
});

test("caps local review at 3 total runs per PR or change", () => {
  const skillPolicy = paragraphContaining(
    skill,
    "`superpowers:requesting-code-review` 進行本地 code review",
  );
  const readmePolicy = paragraphContaining(readme, "本地 review 使用");
  const guidancePolicy = paragraphContaining(
    guidance,
    "Only `jt-flow-one` owns local code review",
  );

  assert.match(skillPolicy, /全程最多\s*進行\s*3\s*次/);
  assert.match(skillPolicy, /第 3 次跑完後.*不再重跑\s*本地\s*review/s);
  assert.match(skillPolicy, /沒有程式碼變更就不得重跑本地\s*review/);
  assert.match(readmePolicy, /全程.*最多\s*3\s*次/);
  assert.match(readmePolicy, /第 3 次跑完後即使仍有新 finding 也不再重跑/);
  assert.match(readmePolicy, /沒有程式碼變更也不得\s*重跑/);
  assert.match(guidancePolicy, /at most 3 total runs per PR or change/i);
  assert.match(guidancePolicy, /after the 3rd run, no further local review occurs/i);
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

test("adds Codex as a one-review external reviewer contingent on a manual precondition", () => {
  const skillPolicy = paragraphContaining(skill, "Codex 每個 PR／變更最多一次");
  const readmePolicy = paragraphContaining(readme, "本地 review 使用");
  const guidancePolicy = paragraphContaining(
    guidance,
    "Only `jt-flow-one` owns local code review",
  );

  assert.match(skillPolicy, /Codex 每個 PR／變更最多一次 review/);
  assert.match(skillPolicy, /不主動送出\s*`@codex review`.*不等待 Codex/);
  assert.match(skillPolicy, /不套用\s*CodeRabbit 的預先授權/);
  assert.match(skillPolicy, /審查觸發條件.*開啟 PR/);
  assert.match(skillPolicy, /非 repo\s*內可提交.*人工一次性確認/);
  assert.match(skillPolicy, /superpowers:receiving-code-review.*規則核實/);
  assert.match(readmePolicy, /Codex 每個 PR／變更最多一次 review/);
  assert.match(readmePolicy, /不主動\s*要求也不等待 Codex/);
  assert.match(readmePolicy, /審查觸發條件＝\s*開啟 PR/);
  assert.match(readmePolicy, /非 repo\s*內可驗證的人工前置確認/);
  assert.match(guidancePolicy, /Codex is treated as budgeted at one review per PR or change/i);
  assert.match(guidancePolicy, /review-trigger-condition setting/i);
  assert.match(guidancePolicy, /does not request or wait for a\s*Codex review/i);
  assert.match(guidancePolicy, /no CodeRabbit-style pre-authorization or\s*disclosure gate/i);
  assert.match(guidancePolicy, /evaluated via `superpowers:receiving-code-review`/i);
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
  const queueContract = sectionContaining(skill, "Queue execution contract");
  const queueInventory = sectionContaining(
    allSkill,
    "Phase 1 — refreshed remote dependency snapshot",
  );
  const queueDispatch = sectionContaining(
    allSkill,
    "Phase 2 — dependency-aware coordinator dispatch and bounded item ownership",
  );

  assert.match(
    queueContract,
    /jt-flow-all.*one independent.*proposal.*overdesign review.*material proposal revision/is,
  );
  assert.match(
    queueContract,
    /jt-flow-one.*implementation quality review.*sole owner.*jt-flow-all.*must not initiate.*duplicate/is,
  );
  assert.match(
    queueContract,
    /jt-flow-all.*appoint.*one independent proposal overdesign reviewer.*current material proposal revision.*record.*disposition.*evidence/is,
  );
  assert.match(queueInventory, /one independent proposal-scope overdesign reviewer/is);
  assert.match(queueDispatch, /never initiates a second\s+implementation code review/is);
});

test("Copilot quota exhaustion records a skip without blocking a delegated item or queue", () => {
  const queueContract = sectionContaining(skill, "Queue execution contract");

  assert.match(queueContract, /quota\s+exhausted.*record.*skip.*continue.*item.*queue/is);
});

test("every prescribed CodeRabbit CLI invocation names --help as its flag authority", () => {
  // 鎖的是耐久的不變量，不是旗標字面值:一旦 CLI 改名,鎖 `--committed` 會讓
  // 這支測試自己變成下一個過期的斷言。這裡只要求「寫死指令的段落必須同時
  // 指出現行拼法從哪裡讀回」,以及「repo 內不得留下現行 CLI 會拒絕的拼法」。
  // ⚠️ 硬編檔名清單會重蹈這次的覆轍——第三個檔案開始寫死指令時不會被抓到。
  // 改為走訪檔案系統列舉 markdown,由內容決定要不要檢查。
  // ⚠️ 不用 `git ls-files`:CI 容器沒有 git(實測 build 125 `spawnSync git ENOENT`),
  // 而這支測試必須在本機與 CI 行為一致。
  const walk = (dir) =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const path = `${dir}/${entry.name}`;
      if (entry.isDirectory()) {
        return entry.name === "node_modules" || entry.name === ".git"
          ? []
          : walk(path);
      }
      return entry.name.endsWith(".md") ? [path.replace(/^\.\//, "")] : [];
    });

  // archive 是歷史反例(必須保留),本 change 的 artifacts 引述的是被修對象。
  // 兩者都是預期命中,不屬於「會被讀者複製當成指令」的位置。
  const isQuotingContext = (path) =>
    path.startsWith("openspec/changes/archive/") ||
    path.startsWith("openspec/changes/fix-coderabbit-cli-flag/");

  const prescribing = walk(".")
    .filter((path) => !isQuotingContext(path))
    .map((path) => [path, readFileSync(path, "utf8")])
    .filter(([, body]) => /coderabbit review/.test(body));

  assert.ok(
    prescribing.length > 0,
    "expected at least one document prescribing the CodeRabbit CLI",
  );

  for (const [name, document] of prescribing) {
    const paragraphs = document
      .split(/\n\s*\n/)
      .filter((candidate) => /coderabbit review --agent/.test(candidate));

    for (const paragraph of paragraphs) {
      assert.match(
        paragraph.replaceAll("\n", " "),
        /coderabbit review --help/,
        `${name}: a paragraph prescribes the CLI without naming --help as the authority for its flag spelling`,
      );
    }

    assert.doesNotMatch(
      document,
      /--type committed/,
      `${name}: carries a CLI flag spelling the current CodeRabbit CLI rejects`,
    );
  }
});
