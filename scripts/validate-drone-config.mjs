import { readFileSync } from "node:fs";
import { parseAllDocuments } from "yaml";

const configPath = process.env.DRONE_YML ?? process.argv[2] ?? ".drone.yml";
const documents = parseAllDocuments(readFileSync(configPath, "utf8"));
const errors = [];

for (const document of documents) {
  if (document.errors.length > 0) {
    errors.push(...document.errors.map((error) => `invalid YAML: ${error.message}`));
  }
}

const pipelines = documents
  .map((document) => document.toJSON())
  .filter((document) => document?.kind === "pipeline");
const byName = new Map(pipelines.map((pipeline) => [pipeline.name, pipeline]));

function requireValue(condition, message) {
  if (!condition) errors.push(message);
}

function list(value) {
  return Array.isArray(value) ? value : [];
}

requireValue(pipelines.length === 2, "expected exactly two pipelines");
requireValue(
  [...byName.keys()].sort().join(",") === "release,validate",
  "expected only release and validate pipelines",
);

const validate = byName.get("validate");
const validateEvents = list(validate?.trigger?.event);
const validateRefs = list(validate?.trigger?.ref);
const validateSteps = list(validate?.steps);
const validateStep = validateSteps[0];
requireValue(
  validateSteps.length === 1,
  "validate must contain exactly one validate step",
);
requireValue(
  validateEvents.includes("push") && validateEvents.includes("pull_request"),
  "validate must run for push and pull_request",
);
requireValue(
  validateRefs.includes("refs/heads/main") &&
    validateRefs.includes("refs/pull/*/head") &&
    !validateRefs.includes("refs/heads/develop"),
  "validate refs must contain main and pull requests, but not develop",
);
requireValue(
  validateStep?.image === "node:22.22.2-bookworm-slim",
  "validate must use the exact supported Node image",
);
requireValue(
  list(validateStep?.commands).includes("npm ci") &&
    list(validateStep?.commands).includes("npm run validate"),
  "validate must install locked dependencies and run npm run validate",
);
requireValue(
  validateStep?.environment?.RELEASE_PLEASE_TOKEN === undefined,
  "validate must not receive the release token",
);

const release = byName.get("release");
const releaseEvents = list(release?.trigger?.event);
const releaseRefs = list(release?.trigger?.ref);
const releaseSteps = list(release?.steps);
const githubReleaseIndex = releaseSteps.findIndex(
  (step) => step.name === "github-release",
);
const releasePrIndex = releaseSteps.findIndex((step) => step.name === "release-pr");

requireValue(
  releaseEvents.length === 1 && releaseEvents[0] === "push",
  "release must run only for push",
);
requireValue(
  releaseRefs.length === 1 && releaseRefs[0] === "refs/heads/main",
  "release must run only for refs/heads/main",
);
requireValue(
  githubReleaseIndex !== -1 &&
    releasePrIndex !== -1 &&
    githubReleaseIndex < releasePrIndex,
  "github-release must run before release-pr",
);
requireValue(
  list(releaseSteps[releasePrIndex]?.depends_on).includes("github-release"),
  "release-pr must depend on github-release",
);

for (const step of releaseSteps) {
  requireValue(
    step.environment?.RELEASE_PLEASE_TOKEN?.from_secret ===
      "RELEASE_PLEASE_TOKEN",
    `${step.name} must use Drone release-token secret indirection`,
  );
  const command = list(step.commands).join("\n");
  requireValue(
    command.includes("release-please@17.10.4"),
    `${step.name} must pin Release Please`,
  );
  requireValue(
    command.includes("--repo-url=https://github.com/jurislm/jurislm-tools") &&
      command.includes("--target-branch=main") &&
      command.includes("--config-file=release-please-config.json") &&
      command.includes("--manifest-file=.release-please-manifest.json"),
    `${step.name} must use the explicit repository, target, config, and manifest`,
  );
}

if (errors.length > 0) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  process.exit(1);
}

console.log(`validated ${configPath}: validate + release`);
