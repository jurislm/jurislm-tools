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
  assert.match(policyText, /validated head SHA/i);
  assert.match(policyText, /(?:no |without )manual merge fallback/i);
  assert.match(
    policyText,
    /(?:no candidate[\s\S]{0,120}no-op|without candidate[\s\S]{0,120}no-op)/i,
  );
  assert.match(
    policyText,
    /candidate[\s\S]{0,200}(?:newer delivery|較新 delivery)[\s\S]{0,200}no-op/i,
  );
  assert.match(policyText, /final main[\s\S]{0,160}no-op/i);

  const template = policies[
    "plugins/repo-standards/skills/repo-standards/references/ci-workflow-templates.md"
  ];
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
