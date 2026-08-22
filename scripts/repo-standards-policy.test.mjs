import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const repositoryRoot = new URL("../", import.meta.url);

const policyPaths = [
  "openspec/specs/docs-and-standards/spec.md",
  "openspec/specs/docs-and-standards/repo-standards-detail.md",
  "plugins/repo-standards/skills/repo-standards/SKILL.md",
  "plugins/repo-standards/skills/repo-standards/references/ci-workflow-templates.md",
  "plugins/repo-standards/skills/repo-standards/references/new-repo-checklist.md",
  "plugins/repo-standards/skills/repo-standards/references/review-orchestration-template.md",
];

function readPolicy(relativePath) {
  return readFileSync(new URL(relativePath, repositoryRoot), "utf8");
}

const policies = Object.fromEntries(policyPaths.map((path) => [path, readPolicy(path)]));
const policyText = Object.values(policies).join("\n");

test("repo standards name entire as the only verified reference and gate adoption on observable acceptance", () => {
  assert.match(
    policyText,
    /(?:jurislm\/entire[\s\S]{0,180}(?:only|sole)[\s\S]{0,120}verified reference|(?:only|sole)[\s\S]{0,120}verified reference[\s\S]{0,180}jurislm\/entire)/i,
  );
  assert.match(policyText, /adoption target/i);
  assert.match(policyText, /source fact/i);
  assert.match(policyText, /prevented failure/i);
  assert.match(policyText, /observable acceptance/i);

  for (const path of policyPaths) {
    assert.doesNotMatch(
      policies[path],
      /jurislm\/(?:lexvision|musicer|memory-dessert)[^\n]{0,120}\b(?:preferred|mature|verified|reference)\b/i,
      `${path} must not promote an unverified repository as a standards reference`,
    );
  }
});

test("monorepo guidance requires Turborepo and safe scoped execution", () => {
  assert.match(policyText, /Turborepo/i);
  assert.match(policyText, /turbo\.json/i);
  assert.match(policyText, /`--filter`[\s\S]{0,180}(?:fixed|known|explicit)/i);
  assert.match(policyText, /`--affected`[\s\S]{0,220}(?:trustworthy|verified|Git base)/i);
  assert.match(policyText, /full validation/i);
  assert.match(policyText, /full deployment/i);
  assert.match(policyText, /cache inputs/i);
});

test("release templates require exact versions and a trusted automatic merge contract", () => {
  assert.match(policyText, /same (?:trusted )?delivery commit/i);
  assert.match(policyText, /GitHub PR merge API/i);
  assert.match(policyText, /latest-base (?:required )?checks/i);
  assert.match(policyText, /automation credential/i);
  assert.match(policyText, /(?:no |without )manual merge fallback/i);
  assert.match(
    policyText,
    /(?:no candidate[\s\S]{0,120}no-op|without candidate[\s\S]{0,120}no-op)/i,
  );
  assert.match(
    policyText,
    /candidate[\s\S]{0,200}(?:newer delivery|較新 delivery)[\s\S]{0,200}no-op/i,
  );
  assert.match(policyText, /(?:GitHub rejects?|rejected protected merge)[\s\S]{0,200}no-op/i);

  const template = policies[
    "plugins/repo-standards/skills/repo-standards/references/ci-workflow-templates.md"
  ];
  const npmTemplate = template.slice(
    template.indexOf("## 標準模板 C："),
    template.indexOf("## 標準模板 D："),
  );
  assert.match(npmTemplate, /release-pr-auto-merge/i);
  assert.match(npmTemplate, /trusted `validate`／`release`/i);
  assert.match(npmTemplate, /npm／MCP.*不能跳過 release PR auto-merge/i);
  const writeCommands = template
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /\brelease-please(?:@|\b)/i.test(line) && /--token=/i.test(line));

  assert.ok(writeCommands.length >= 2, "templates must include release write commands");
  for (const command of writeCommands) {
    assert.match(
      command,
      /release-please@(?:<EXACT-RELEASE-PLEASE-VERSION>|\d+\.\d+\.\d+)/i,
      `write command must pin one exact Release Please version: ${command}`,
    );
  }
});

test("release eligibility uses immutable mainline deliveries and target-compatible squash mode", () => {
  assert.match(policyText, /immutable `DRONE_COMMIT`|immutable DRONE_COMMIT/i);
  assert.match(policyText, /first-parent mainline|first-parent/i);
  assert.match(policyText, /target-compatible merge mode/i);
  assert.match(policyText, /squash-only/i);
  assert.match(policyText, /pull-request title.*squash title|PR title.*squash/i);
});

test("plugin release templates bind eligibility to DRONE_COMMIT instead of a raw branch range", () => {
  const template = policies[
    "plugins/repo-standards/skills/repo-standards/references/ci-workflow-templates.md"
  ];
  const detail = policies["openspec/specs/docs-and-standards/repo-standards-detail.md"];

  assert.match(template, /DRONE_REPO／DRONE_BRANCH／DRONE_COMMIT/);
  assert.match(template, /first-parent mainline/);
  assert.doesNotMatch(template, /比較已發布 manifest tag 到目前分支的完整範圍/);
  assert.match(detail, /DRONE_REPO`、`DRONE_BRANCH`、`DRONE_COMMIT/);
  assert.match(detail, /first-parent mainline/);
});

test("portable review contract preserves jt-flow review ownership", () => {
  const template = policies[
    "plugins/repo-standards/skills/repo-standards/references/review-orchestration-template.md"
  ];

  assert.match(template, /`engineering-delivery`.*invoke.*`superpowers:requesting-code-review`/s);
  assert.match(template, /外部 review 交給 `coderabbit:code-review`/s);
  assert.doesNotMatch(template, /jt-flow-all/);
});

test("self-hosted Drone is the only CI and release platform", () => {
  assert.match(
    policies["plugins/repo-standards/skills/repo-standards/SKILL.md"],
    /Drone[\s\S]{0,80}唯一[\s\S]{0,40}(?:CI|平台)|唯一[\s\S]{0,60}(?:CI|平台)[\s\S]{0,80}Drone/,
    "SKILL.md itself must name self-hosted Drone as the only CI and release platform",
  );

  for (const path of policyPaths) {
    assert.doesNotMatch(
      policies[path],
      /(?:預設|改用|可選)[^\n]{0,16}(?:GitHub Actions|GHA)|(?:GitHub Actions|GHA)[^\n]{0,16}(?:預設|亦可|可選)/,
      `${path} must not describe GitHub Actions as a default or selectable platform`,
    );
    assert.doesNotMatch(
      policies[path],
      /sync-plugins\.yml/,
      `${path} must not reference a workflow owned by an archived repository`,
    );
    assert.doesNotMatch(
      policies[path],
      /(?:預設|可以|也可|亦可|或)[^\n]{0,30}`?(?:release|version-check)\.yml/,
      `${path} must not offer a GitHub Actions workflow as an alternative path`,
    );
    assert.doesNotMatch(
      policies[path],
      /(?:若|如果|已)(?:明確)?選(?:擇)? *Drone|選擇 *Drone *後|平台決策|依.{0,8}平台.{0,4}決定/,
      `${path} must not presuppose a platform choice that no longer exists`,
    );
    assert.doesNotMatch(
      policies[path],
      /jurislm-plugins/,
      `${path} must not reference the archived jurislm-plugins repository`,
    );
  }
});

test("repo classification tables state the CI platform for every repo type", () => {
  const tablePaths = [
    "plugins/repo-standards/skills/repo-standards/SKILL.md",
    "openspec/specs/docs-and-standards/repo-standards-detail.md",
  ];

  for (const path of tablePaths) {
    const body = policies[path];
    const start = body.indexOf("## Repo 分類");
    assert.ok(start >= 0, `${path} must keep a repo classification section`);
    const nextHeading = body.indexOf("\n## ", start + 1);
    const section = body.slice(start, nextHeading === -1 ? undefined : nextHeading);

    const rows = section.split("\n").filter((line) => line.trim().startsWith("|"));
    assert.ok(rows.length >= 6, `${path} classification table looks truncated`);

    const header = rows[0].split("|").map((cell) => cell.trim());
    const ciColumn = header.indexOf("CI 平台");
    assert.ok(ciColumn > 0, `${path} classification table needs a CI platform column`);

    const separator = rows[1].split("|").length;
    assert.equal(
      separator,
      header.length,
      `${path} classification table separator row column count must match the header`,
    );

    for (const row of rows.slice(2)) {
      const cells = row.split("|").map((cell) => cell.trim());
      assert.equal(
        cells[ciColumn],
        "Drone",
        `${path} must mark every repo type as Drone, found "${cells[ciColumn]}" in: ${row.trim()}`,
      );
    }
  }
});

test("upstream forks are excluded from the Drone-only requirement", () => {
  const forkPaths = [
    "plugins/repo-standards/skills/repo-standards/SKILL.md",
    "openspec/specs/docs-and-standards/repo-standards-detail.md",
    "plugins/repo-standards/skills/repo-standards/references/ci-workflow-templates.md",
  ];

  for (const path of forkPaths) {
    assert.match(
      policies[path],
      /上游 fork[\s\S]{0,120}firecrawl[\s\S]{0,120}(?:不受|保留上游)/,
      `${path} must state the upstream-fork exception in full, not by adjacency`,
    );
  }
});

test("the workflow platform matrix marks every repo type as Drone", () => {
  const template = policies[
    "plugins/repo-standards/skills/repo-standards/references/ci-workflow-templates.md"
  ];

  const rows = template
    .split("\n")
    .filter((line) => line.trim().startsWith("> |"))
    .map((line) => line.replace(/^>\s*/, ""));
  assert.ok(rows.length >= 6, "platform matrix looks truncated");

  const header = rows[0].split("|").map((cell) => cell.trim());
  const ciColumn = header.findIndex((cell) => cell.startsWith("CI"));
  const releaseColumn = header.indexOf("release-please");
  assert.ok(ciColumn > 0, "platform matrix needs a CI column");
  assert.ok(releaseColumn > 0, "platform matrix needs a release-please column");

  for (const row of rows.slice(2)) {
    const cells = row.split("|").map((cell) => cell.trim());
    assert.match(
      cells[ciColumn],
      /^Drone/,
      `platform matrix CI column must be Drone, found "${cells[ciColumn]}" in: ${row.trim()}`,
    );
    assert.match(
      cells[releaseColumn],
      /^(?:Drone|release-please)/,
      `platform matrix release column must stay on Drone, found "${cells[releaseColumn]}"`,
    );
  }
});
