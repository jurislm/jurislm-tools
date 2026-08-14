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

  assert.match(template, /`jt-flow-all`.*只協調.*Spectra change queue/s);
  assert.match(template, /`jt-flow-one`.*invoke.*`superpowers:requesting-code-review`/s);
  assert.match(template, /`jt-flow-all`.*不發起或擁有額外 review/s);
});
