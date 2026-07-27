import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

const repositoryRoot = new URL("../", import.meta.url);
const validator = new URL("./validate-drone-yml.sh", import.meta.url);

function validate(configPath) {
  return spawnSync("bash", [validator.pathname], {
    cwd: repositoryRoot,
    encoding: "utf8",
    env: { ...process.env, DRONE_YML: configPath, DRONE_SKIP_LINT: "1" },
  });
}

test("the repository Drone configuration satisfies the CI and release contract", () => {
  const result = validate(".drone.yml");

  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
});

test("the validator rejects release-pr running before github-release", () => {
  const temporaryDirectory = mkdtempSync(join(tmpdir(), "drone-ci-policy-"));
  const fixturePath = join(temporaryDirectory, ".drone.yml");

  writeFileSync(
    fixturePath,
    `kind: pipeline
type: docker
name: validate
trigger:
  event: [push, pull_request]
  ref: [refs/heads/main, refs/pull/*/head]
steps:
  - name: validate
    image: node:22.22.2-bookworm-slim
    commands: [npm ci, npm run validate]
---
kind: pipeline
type: docker
name: release
trigger:
  event: [push]
  ref: [refs/heads/main]
steps:
  - name: release-pr
    image: node:22.22.2-bookworm-slim
    environment:
      RELEASE_PLEASE_TOKEN:
        from_secret: RELEASE_PLEASE_TOKEN
    commands:
      - npx release-please release-pr --target-branch=main --config-file=release-please-config.json --manifest-file=.release-please-manifest.json
  - name: github-release
    image: node:22.22.2-bookworm-slim
    environment:
      RELEASE_PLEASE_TOKEN:
        from_secret: RELEASE_PLEASE_TOKEN
    commands:
      - npx release-please github-release --target-branch=main --config-file=release-please-config.json --manifest-file=.release-please-manifest.json
`,
  );

  try {
    const result = validate(fixturePath);

    assert.notEqual(result.status, 0);
    assert.match(`${result.stdout}\n${result.stderr}`, /github-release.*before.*release-pr/i);
  } finally {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
});
