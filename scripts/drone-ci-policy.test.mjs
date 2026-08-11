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

test("the validator rejects the commit-type checkers running after npm ci (Copilot finding: incomplete ordering assertion)", () => {
  // Both checkers were still before `npm run validate` here, which the
  // pre-fix assertion accepted — but they ran after `npm ci` already paid
  // for a dependency install, defeating the fail-fast-before-install intent
  // that is the entire reason `.drone.yml` puts them first.
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
    commands:
      - npm ci
      - node scripts/validate-pr-title.mjs
      - node scripts/validate-squash-subject.mjs
      - npm run validate
---
kind: pipeline
type: docker
name: release
trigger:
  event: [push]
  ref: [refs/heads/main]
steps:
  - name: github-release
    image: node:22.22.2-bookworm-slim
    environment:
      RELEASE_PLEASE_TOKEN:
        from_secret: RELEASE_PLEASE_TOKEN
    commands:
      - npx --yes release-please@17.10.4 github-release --repo-url=https://github.com/jurislm/jurislm-tools --target-branch=main --config-file=release-please-config.json --manifest-file=.release-please-manifest.json
  - name: release-pr
    image: node:22.22.2-bookworm-slim
    depends_on: [github-release]
    environment:
      RELEASE_PLEASE_TOKEN:
        from_secret: RELEASE_PLEASE_TOKEN
    commands:
      - npx --yes release-please@17.10.4 release-pr --repo-url=https://github.com/jurislm/jurislm-tools --target-branch=main --config-file=release-please-config.json --manifest-file=.release-please-manifest.json
`,
  );

  try {
    const result = validate(fixturePath);

    assert.notEqual(result.status, 0);
    assert.match(
      `${result.stdout}\n${result.stderr}`,
      /checkers must run before npm ci/i,
    );
  } finally {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
});

test("the validator rejects npm ci running after npm run validate", () => {
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
    commands:
      - node scripts/validate-pr-title.mjs
      - node scripts/validate-squash-subject.mjs
      - npm run validate
      - npm ci
---
kind: pipeline
type: docker
name: release
trigger:
  event: [push]
  ref: [refs/heads/main]
steps:
  - name: github-release
    image: node:22.22.2-bookworm-slim
    environment:
      RELEASE_PLEASE_TOKEN:
        from_secret: RELEASE_PLEASE_TOKEN
    commands:
      - npx --yes release-please@17.10.4 github-release --repo-url=https://github.com/jurislm/jurislm-tools --target-branch=main --config-file=release-please-config.json --manifest-file=.release-please-manifest.json
  - name: release-pr
    image: node:22.22.2-bookworm-slim
    depends_on: [github-release]
    environment:
      RELEASE_PLEASE_TOKEN:
        from_secret: RELEASE_PLEASE_TOKEN
    commands:
      - npx --yes release-please@17.10.4 release-pr --repo-url=https://github.com/jurislm/jurislm-tools --target-branch=main --config-file=release-please-config.json --manifest-file=.release-please-manifest.json
`,
  );

  try {
    const result = validate(fixturePath);

    assert.notEqual(result.status, 0);
    assert.match(
      `${result.stdout}\n${result.stderr}`,
      /npm ci must run before npm run validate/i,
    );
  } finally {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
});

test("the validator rejects a second validate step that can escape isolation", () => {
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
  - name: prepare
    image: node:22.22.2-bookworm-slim
    commands: [echo preparing]
  - name: validate
    image: node:latest
    environment:
      RELEASE_PLEASE_TOKEN:
        from_secret: RELEASE_PLEASE_TOKEN
    commands: [npm ci, npm run validate]
---
kind: pipeline
type: docker
name: release
trigger:
  event: [push]
  ref: [refs/heads/main]
steps:
  - name: github-release
    image: node:22.22.2-bookworm-slim
    environment:
      RELEASE_PLEASE_TOKEN:
        from_secret: RELEASE_PLEASE_TOKEN
    commands:
      - npx --yes release-please@17.10.4 github-release --repo-url=https://github.com/jurislm/jurislm-tools --target-branch=main --config-file=release-please-config.json --manifest-file=.release-please-manifest.json
  - name: release-pr
    image: node:22.22.2-bookworm-slim
    depends_on: [github-release]
    environment:
      RELEASE_PLEASE_TOKEN:
        from_secret: RELEASE_PLEASE_TOKEN
    commands:
      - npx --yes release-please@17.10.4 release-pr --repo-url=https://github.com/jurislm/jurislm-tools --target-branch=main --config-file=release-please-config.json --manifest-file=.release-please-manifest.json
`,
  );

  try {
    const result = validate(fixturePath);

    assert.notEqual(result.status, 0);
    assert.match(`${result.stdout}\n${result.stderr}`, /exactly one validate step/i);
  } finally {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
});

test("the validator rejects a release-pr step without the release eligibility gate", () => {
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
    commands:
      - node scripts/validate-pr-title.mjs
      - node scripts/validate-squash-subject.mjs
      - npm ci
      - npm run validate
---
kind: pipeline
type: docker
name: release
trigger:
  event: [push]
  ref: [refs/heads/main]
steps:
  - name: github-release
    image: node:22.22.2-bookworm-slim
    environment:
      RELEASE_PLEASE_TOKEN:
        from_secret: RELEASE_PLEASE_TOKEN
    commands:
      - npx --yes release-please@17.10.4 github-release --repo-url=https://github.com/jurislm/jurislm-tools --target-branch=main --config-file=release-please-config.json --manifest-file=.release-please-manifest.json
  - name: release-pr
    image: node:22.22.2-bookworm-slim
    depends_on: [github-release]
    environment:
      RELEASE_PLEASE_TOKEN:
        from_secret: RELEASE_PLEASE_TOKEN
    commands:
      - npx --yes release-please@17.10.4 release-pr --repo-url=https://github.com/jurislm/jurislm-tools --target-branch=main --config-file=release-please-config.json --manifest-file=.release-please-manifest.json
`,
  );

  try {
    const result = validate(fixturePath);

    assert.notEqual(result.status, 0);
    assert.match(`${result.stdout}\n${result.stderr}`, /release-pr.*eligibility|eligibility.*release-pr/i);
  } finally {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
});

test("the validator rejects a release-pr gate that turns unsafe errors into a successful skip", () => {
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
    commands:
      - node scripts/validate-pr-title.mjs
      - node scripts/validate-squash-subject.mjs
      - npm ci
      - npm run validate
---
kind: pipeline
type: docker
name: release
trigger:
  event: [push]
  ref: [refs/heads/main]
steps:
  - name: github-release
    image: node:22.22.2-bookworm-slim
    environment:
      RELEASE_PLEASE_TOKEN:
        from_secret: RELEASE_PLEASE_TOKEN
    commands:
      - npx --yes release-please@17.10.4 github-release --repo-url=https://github.com/jurislm/jurislm-tools --target-branch=main --config-file=release-please-config.json --manifest-file=.release-please-manifest.json
  - name: release-pr
    image: node:22.22.2-bookworm-slim
    depends_on: [github-release]
    environment:
      RELEASE_PLEASE_TOKEN:
        from_secret: RELEASE_PLEASE_TOKEN
    commands:
      - |
        set +e
        node scripts/release-eligibility.mjs
        status=$?
        set -e
        if [ "$status" -eq 10 ]; then exit 0; fi
        npx --yes release-please@17.10.4 release-pr --repo-url=https://github.com/jurislm/jurislm-tools --target-branch=main --config-file=release-please-config.json --manifest-file=.release-please-manifest.json
`,
  );

  try {
    const result = validate(fixturePath);

    assert.notEqual(result.status, 0);
    assert.match(`${result.stdout}\n${result.stderr}`, /unsafe|non-10|fail closed|exit/i);
  } finally {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
});
