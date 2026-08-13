import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { parseAllDocuments, stringify } from "yaml";

const repositoryRoot = new URL("../", import.meta.url);
const validator = new URL("./validate-drone-yml.sh", import.meta.url);
const droneConfig = new URL("../.drone.yml", import.meta.url);

function list(value) {
  return Array.isArray(value) ? value : [];
}

function readDroneConfig(configPath = droneConfig) {
  return parseAllDocuments(readFileSync(configPath, "utf8")).map((document) => {
    assert.equal(document.errors.length, 0, document.errors.join("\n"));
    return document.toJSON();
  });
}

function writeDroneConfig(configPath, documents) {
  writeFileSync(
    configPath,
    `${documents.map((document) => stringify(document).trimEnd()).join("\n---\n")}\n`,
  );
}

function requirePipeline(pipelines, name) {
  const pipeline = pipelines.find((candidate) => candidate?.name === name);
  assert.ok(pipeline, `expected ${name} pipeline`);
  return pipeline;
}

function requireStep(pipeline, name) {
  const step = list(pipeline.steps).find((candidate) => candidate?.name === name);
  assert.ok(step, `expected ${pipeline.name} pipeline step ${name}`);
  return step;
}

function releasePleaseWriteCommands(pipeline) {
  return list(pipeline.steps).flatMap((step) =>
    list(step.commands)
      .flatMap((command) => String(command).split("\n"))
      .map((command) => command.trim())
      .filter((command) => command.startsWith("npx --yes release-please@"))
      .map((command) => ({ step: step.name, command })),
  );
}

function makeAutoMergePipeline() {
  return {
    kind: "pipeline",
    type: "docker",
    name: "release-pr-auto-merge",
    platform: { os: "linux", arch: "amd64" },
    trigger: {
      event: ["push"],
      ref: ["refs/heads/main"],
    },
    depends_on: ["validate", "release"],
    concurrency: { limit: 1 },
    steps: [
      {
        name: "merge-release-pr",
        image: "node:22.22.2-bookworm-slim",
        environment: {
          RELEASE_PLEASE_TOKEN: {
            from_secret: "RELEASE_PLEASE_TOKEN",
          },
        },
        commands: ["node scripts/release-pr-auto-merge.mjs"],
      },
    ],
  };
}

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

test("the trusted release-pr auto-merge pipeline is main-only and delivery-bound", () => {
  const pipelines = readDroneConfig();
  const pipeline = requirePipeline(pipelines, "release-pr-auto-merge");

  assert.deepEqual(pipeline.trigger, {
    event: ["push"],
    ref: ["refs/heads/main"],
  });
  assert.deepEqual([...list(pipeline.depends_on)].sort(), ["release", "validate"]);
  assert.deepEqual(pipeline.concurrency, { limit: 1 });
});

test("the auto-merge credential is confined to its source-controlled validator step", () => {
  const pipelines = readDroneConfig();
  const pipeline = requirePipeline(pipelines, "release-pr-auto-merge");
  const tokenSteps = list(pipeline.steps).filter(
    (step) => step.environment?.RELEASE_PLEASE_TOKEN?.from_secret === "RELEASE_PLEASE_TOKEN",
  );

  assert.equal(tokenSteps.length, 1);
  assert.equal(tokenSteps[0].name, "merge-release-pr");
  assert.deepEqual(tokenSteps[0].commands, ["node scripts/release-pr-auto-merge.mjs"]);

  for (const candidate of pipelines) {
    if (candidate.name === "release-pr-auto-merge") continue;
    if (!list(candidate.trigger?.event).includes("pull_request")) continue;
    for (const step of list(candidate.steps)) {
      assert.equal(
        step.environment?.RELEASE_PLEASE_TOKEN,
        undefined,
        `${candidate.name}/${step.name} must not receive the release token`,
      );
    }
  }
});

test("release write commands expose the exact Release Please 17.10.4 contract", () => {
  const release = requirePipeline(readDroneConfig(), "release");
  const expectedOptions =
    "--token=$RELEASE_PLEASE_TOKEN --repo-url=https://github.com/jurislm/jurislm-tools " +
    "--target-branch=main --config-file=release-please-config.json " +
    "--manifest-file=.release-please-manifest.json";

  assert.deepEqual(releasePleaseWriteCommands(release), [
    {
      step: "github-release",
      command: `npx --yes release-please@17.10.4 github-release ${expectedOptions}`,
    },
    {
      step: "release-pr",
      command: `npx --yes release-please@17.10.4 release-pr ${expectedOptions}`,
    },
  ]);
});

test("the existing validator rejects an unpinned Release Please write command", () => {
  const temporaryDirectory = mkdtempSync(join(tmpdir(), "drone-ci-policy-"));
  const fixturePath = join(temporaryDirectory, ".drone.yml");
  const documents = readDroneConfig();
  const release = requirePipeline(documents, "release");
  const releasePr = requireStep(release, "release-pr");
  const commandIndex = list(releasePr.commands).findIndex((command) =>
    String(command)
      .split("\n")
      .some((line) => line.trim().startsWith("npx --yes release-please@17.10.4 release-pr ")),
  );

  assert.notEqual(commandIndex, -1);
  releasePr.commands[commandIndex] = String(releasePr.commands[commandIndex]).replace(
    "release-please@17.10.4",
    "release-please",
  );
  documents.push(makeAutoMergePipeline());
  writeDroneConfig(fixturePath, documents);

  try {
    const result = validate(fixturePath);

    assert.notEqual(result.status, 0);
    assert.match(
      `${result.stdout}\n${result.stderr}`,
      /release-pr must pin Release Please/i,
    );
  } finally {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
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
