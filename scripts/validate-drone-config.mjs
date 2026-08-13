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

requireValue(pipelines.length === 3, "expected exactly three pipelines");
requireValue(
  [...byName.keys()].sort().join(",") === "release,release-pr-auto-merge,validate",
  "expected only validate, release, and release-pr-auto-merge pipelines",
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

// Commit-type guardrails (design D3/D4): a pull-request build with an
// out-of-policy title, or a push to main whose squash subject was
// overridden past the title check, must fail before npm run validate does
// its slower, dependency-installing work. The full ordering invariant this
// pipeline exists to enforce is a three-link chain — checkers, then
// npm ci, then npm run validate — not just "checkers somewhere before
// npm run validate": a checker placed after npm ci still runs before
// npm run validate but has already paid for the dependency install a bad
// title was supposed to let CI skip (Copilot review finding on an earlier
// version of this file, which only asserted the weaker two-point check).
const validateCommands = list(validateStep?.commands);
const prTitleCommand = "node scripts/validate-pr-title.mjs";
const squashSubjectCommand = "node scripts/validate-squash-subject.mjs";
const npmCiIndex = validateCommands.indexOf("npm ci");
const npmRunValidateIndex = validateCommands.indexOf("npm run validate");
const prTitleIndex = validateCommands.indexOf(prTitleCommand);
const squashSubjectIndex = validateCommands.indexOf(squashSubjectCommand);
requireValue(
  prTitleIndex !== -1 && squashSubjectIndex !== -1,
  "validate must run both the pull-request title and squash-subject commit-type checkers",
);
requireValue(
  npmRunValidateIndex !== -1 &&
    prTitleIndex !== -1 &&
    squashSubjectIndex !== -1 &&
    prTitleIndex < npmRunValidateIndex &&
    squashSubjectIndex < npmRunValidateIndex,
  "the commit-type checkers must run before npm run validate so a bad title fails fast",
);
requireValue(
  npmCiIndex !== -1 &&
    prTitleIndex !== -1 &&
    squashSubjectIndex !== -1 &&
    prTitleIndex < npmCiIndex &&
    squashSubjectIndex < npmCiIndex,
  "the commit-type checkers must run before npm ci, not merely before npm run validate — " +
    "otherwise a bad title still pays for the dependency install it was supposed to skip",
);
requireValue(
  npmCiIndex !== -1 && npmRunValidateIndex !== -1 && npmCiIndex < npmRunValidateIndex,
  "npm ci must run before npm run validate",
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

const releasePrCommands = list(releaseSteps[releasePrIndex]?.commands);
const releasePrCommandText = releasePrCommands.join("\n");
const eligibilityCommand = "node scripts/release-eligibility.mjs";
const eligibilityIndex = releasePrCommandText.indexOf(eligibilityCommand);
const releasePrCommandIndex = releasePrCommandText.indexOf(
  "release-please@17.10.4 release-pr",
);
const releasePrCommandCount =
  releasePrCommandText.match(/release-please@17\.10\.4 release-pr/g)?.length ?? 0;
const statusAssignment = /([A-Za-z_][A-Za-z0-9_]*)\s*=\s*\$\?/u.exec(releasePrCommandText);
const statusVariable = statusAssignment?.[1];
const statusCasePattern = statusVariable
  ? new RegExp(`case\\s+"?\\$${statusVariable}"?\\s+in`, "u")
  : null;
const eligibleBranchStart = statusVariable
  ? releasePrCommandText.indexOf("0)")
  : -1;
const skipBranchStart = statusVariable
  ? releasePrCommandText.indexOf("10)", eligibleBranchStart + 1)
  : -1;
const errorBranchStart = statusVariable
  ? releasePrCommandText.indexOf("*)", skipBranchStart + 1)
  : -1;

requireValue(
  eligibilityIndex !== -1,
  "release-pr must run scripts/release-eligibility.mjs before Release Please",
);
requireValue(
  releasePrCommandIndex > eligibilityIndex,
  "release-pr must invoke Release Please only after the eligibility gate",
);
requireValue(
  releasePrCommandCount === 1,
  "release-pr must contain exactly one Release Please invocation",
);
requireValue(
  eligibilityIndex !== -1 &&
    releasePrCommandText.lastIndexOf("set +e", eligibilityIndex) !== -1 &&
    statusAssignment !== null &&
    releasePrCommandText.indexOf("set -e", statusAssignment.index) > statusAssignment.index,
  "release-pr must capture the eligibility exit status before restoring errexit",
);
requireValue(
  statusCasePattern?.test(releasePrCommandText) === true,
  "release-pr must branch on the captured eligibility exit status",
);
requireValue(
  eligibleBranchStart !== -1 &&
    skipBranchStart > eligibleBranchStart &&
    releasePrCommandIndex > eligibleBranchStart &&
    releasePrCommandIndex < skipBranchStart,
  "release-pr must call Release Please only in the exit-0 branch",
);
requireValue(
  skipBranchStart !== -1 &&
    errorBranchStart > skipBranchStart &&
    /;;/u.test(releasePrCommandText.slice(skipBranchStart, errorBranchStart)),
  "release-pr must handle exit 10 as a successful case branch",
);
requireValue(
  errorBranchStart !== -1 &&
    new RegExp(`exit\\s+"?\\$${statusVariable}"?`, "u").test(
      releasePrCommandText.slice(errorBranchStart),
    ),
  "release-pr must propagate every non-zero status other than 10",
);

for (const step of releaseSteps) {
  requireValue(
    step.environment?.RELEASE_PLEASE_TOKEN?.from_secret ===
      "RELEASE_PLEASE_TOKEN",
    `${step.name} must use Drone release-token secret indirection`,
  );
  const command = list(step.commands).join("\n");
  const releasePleaseCommands = command
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /\brelease-please(?:@|\b)/u.test(line));
  requireValue(
    releasePleaseCommands.length === 1 &&
      /^npx --yes release-please@17\.10\.4\s/u.test(releasePleaseCommands[0]),
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

const autoMerge = byName.get("release-pr-auto-merge");
const autoMergeEvents = list(autoMerge?.trigger?.event);
const autoMergeRefs = list(autoMerge?.trigger?.ref);
const autoMergeDependencies = list(autoMerge?.depends_on);
const autoMergeSteps = list(autoMerge?.steps);
const autoMergeStep = autoMergeSteps[0];

requireValue(
  autoMergeEvents.length === 1 && autoMergeEvents[0] === "push",
  "release-pr-auto-merge must run only for push",
);
requireValue(
  autoMergeRefs.length === 1 && autoMergeRefs[0] === "refs/heads/main",
  "release-pr-auto-merge must run only for refs/heads/main",
);
requireValue(
  [...autoMergeDependencies].sort().join(",") === "release,validate",
  "release-pr-auto-merge must depend on validate and release",
);
requireValue(
  autoMerge?.concurrency?.limit === 1,
  "release-pr-auto-merge must serialize overlapping main deliveries",
);
requireValue(
  autoMergeSteps.length === 1 && autoMergeStep?.name === "merge-release-pr",
  "release-pr-auto-merge must contain exactly one merge-release-pr step",
);
requireValue(
  autoMergeStep?.image === "node:22.22.2-bookworm-slim",
  "release-pr-auto-merge must use the exact supported Node image",
);
requireValue(
  autoMergeStep?.environment?.RELEASE_PLEASE_TOKEN?.from_secret ===
    "RELEASE_PLEASE_TOKEN",
  "release-pr-auto-merge must use Drone release-token secret indirection",
);
requireValue(
  list(autoMergeStep?.commands).length === 1 &&
    autoMergeStep.commands[0] === "node scripts/release-pr-auto-merge.mjs",
  "release-pr-auto-merge must execute only the source-controlled validator",
);

if (errors.length > 0) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  process.exit(1);
}

console.log(`validated ${configPath}: validate + release + release-pr-auto-merge`);
